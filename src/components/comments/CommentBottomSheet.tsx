"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { X, Loader2 } from "lucide-react";
import { useComments } from "@/hooks/use-comments";
import { apiClient } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import { userAvatarUrl } from "@/lib/avatar";
import { useAuth } from "@/hooks/use-auth";
import type { CommentDto } from "@/types/comment";

interface CommentBottomSheetProps {
  postId: number;
  onClose: () => void;
  highlightCommentIds?: number[];
  /** When provided, the sheet is glued to this element (e.g. a trailer card)
   *  instead of covering the whole screen. */
  anchorRef?: React.RefObject<HTMLElement | null>;
}

export function CommentBottomSheet({
  postId,
  onClose,
  highlightCommentIds,
  anchorRef,
}: CommentBottomSheetProps) {
  const { user } = useAuth();
  const {
    comments,
    isLoading,
    error,
    isPosting,
    replyCounts,
    repliesCache,
    visibleReplySections,
    loadingReplies,
    deletingComments,
    toggleReplySection,
    loadMoreReplies,
    hasMoreReplies,
    deleteComment,
    postComment,
  } = useComments(postId);

  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<CommentDto | null>(null);
  const [contextTarget, setContextTarget] = useState<CommentDto | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CommentDto | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<Set<number>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const highlightHandledRef = useRef(false);

  // When anchored to a trailer, keep the sheet glued to that element's box even
  // as the surrounding reel scrolls.
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    const el = anchorRef?.current;
    if (!el) {
      setAnchorRect(null);
      return;
    }
    const update = () => setAnchorRect(el.getBoundingClientRect());
    update();
    const scrollables: HTMLElement[] = [];
    let node: HTMLElement | null = el.parentElement;
    while (node) {
      const style = getComputedStyle(node);
      const scrollable =
        style.overflowY === "scroll" ||
        style.overflowY === "auto" ||
        style.overflow === "scroll" ||
        style.overflow === "auto";
      if (scrollable) scrollables.push(node);
      node = node.parentElement;
    }
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    scrollables.forEach((s) => s.addEventListener("scroll", update, true));
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      scrollables.forEach((s) => s.removeEventListener("scroll", update, true));
    };
  }, [anchorRef]);

  const anchored = anchorRect != null;

  const handlePost = useCallback(async () => {
    if (!commentText.trim() || isPosting) return;
    await postComment(commentText, replyingTo?.commentId ?? undefined);
    setCommentText("");
    setReplyingTo(null);
  }, [commentText, isPosting, postComment, replyingTo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const ids = highlightCommentIds ?? [];
    if (
      ids.length === 0 ||
      isLoading ||
      comments.length === 0 ||
      highlightHandledRef.current
    ) {
      return;
    }
    highlightHandledRef.current = true;
    let cancelled = false;

    const resolveHighlights = async () => {
      const idSet = new Set(ids);
      const rootIds = new Set<number>();
      const repliesByRoot = new Map<number, Set<number>>();

      comments.forEach((c) => {
        if (c.commentId !== null && idSet.has(c.commentId)) {
          rootIds.add(c.commentId);
        }
      });

      for (const id of idSet) {
        if (rootIds.has(id) || cancelled) continue;
        try {
          let parentId: number | null = null;
          const comment = await apiClient<CommentDto>(`/api/comments/data/${id}`);
          if (cancelled) return;
          if (comment.parentCommentId != null) {
            parentId = comment.parentCommentId;
            if (!comments.some((c) => c.commentId === parentId)) {
              const root = await apiClient<CommentDto>(
                `/api/comments/${id}/root-parent`
              );
              if (cancelled) return;
              parentId = root.commentId ?? parentId;
            }
          }
          if (parentId != null) {
            rootIds.add(parentId);
            const replyIds = repliesByRoot.get(parentId) ?? new Set<number>();
            replyIds.add(id);
            repliesByRoot.set(parentId, replyIds);
          } else {
            rootIds.add(id);
          }
        } catch {
          // ignore ids that cannot be resolved
        }
      }

      if (cancelled || rootIds.size === 0) return;

      setHighlightedIds(rootIds);
      repliesByRoot.forEach((_replyIds, rootId) => {
        if (!visibleReplySections.has(rootId)) {
          toggleReplySection(rootId);
        }
      });

      const firstRoot = rootIds.values().next().value;
      if (firstRoot == null) return;
      setTimeout(() => {
        if (cancelled) return;
        listRef.current
          ?.querySelector(`[data-comment-id="${firstRoot}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 200);
    };

    resolveHighlights();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments, isLoading, highlightCommentIds]);

  // Guest mode: comments require an account — show a conversion panel instead.
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div
          className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
          onClick={onClose}
        />
        <div className="relative w-full sm:max-w-sm card p-6 m-4 space-y-4 text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-bold">Comments are for members</h2>
          <p className="text-sm text-muted-foreground">
            Create a free account to join the conversation.
          </p>
          <div className="space-y-2 pt-1">
            <Link
              href="/auth/register"
              className="btn-primary w-full h-10 flex items-center justify-center"
            >
              Sign up free
            </Link>
            <button
              onClick={onClose}
              className="btn-outline w-full h-10 flex items-center justify-center"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        anchored
          ? "fixed z-50"
          : "fixed inset-0 z-50 flex items-end justify-center"
      }
      style={
        anchored && anchorRect
          ? {
              top: anchorRect.top,
              left: anchorRect.left,
              width: anchorRect.width,
              height: anchorRect.height,
            }
          : undefined
      }
    >
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        className={
          anchored
            ? "absolute inset-0 bg-background rounded-2xl flex flex-col animate-in slide-in-from-bottom duration-300"
            : "relative w-full max-w-lg bg-background rounded-t-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300"
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h3 className="font-semibold text-lg">Comments</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Comment list */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-center text-sm text-destructive py-8">
              {error}
            </p>
          ) : comments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-1">
              {comments
                .filter((c) => c.commentId !== null)
                .map((comment) => {
                  const cid = comment.commentId as number;
                  return (
                <CommentItem
                  key={cid}
                  comment={comment}
                  replyCount={replyCounts[cid] || 0}
                  replies={repliesCache[cid] || []}
                  isRepliesVisible={visibleReplySections.has(cid)}
                  isLoadingReplies={loadingReplies.has(cid)}
                  hasMoreReplies={hasMoreReplies(cid)}
                  isDeleting={deletingComments.has(cid)}
                  currentUserId={user?.userId}
                  selectedComments={highlightedIds}
                  deletingComments={deletingComments}
                  onReplyClick={() => setReplyingTo(comment)}
                  onViewReplies={() => toggleReplySection(cid)}
                  onHideReplies={() => toggleReplySection(cid)}
                  onLoadMoreReplies={() => loadMoreReplies(cid)}
                  onDeleteRequest={() => setConfirmDelete(comment)}
                  onReplyToReply={(reply) => setReplyingTo(reply)}
                />
                  );
                })}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border shrink-0" />

        {/* Reply indicator */}
        {replyingTo && (
          <div className="flex items-center gap-2 px-4 py-2 shrink-0">
            <span className="text-xs text-primary flex-1">
              Replying to @{replyingTo.username}
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-xs text-primary hover:underline"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="flex items-center gap-2 px-4 py-3 shrink-0">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handlePost();
              }
            }}
            placeholder="Add a comment"
            rows={1}
            className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[40px] max-h-[80px]"
          />
          <button
            onClick={handlePost}
            disabled={!commentText.trim() || isPosting || !user}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 shrink-0"
          >
            {isPosting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Post"
            )}
          </button>
        </div>
      </div>

      {/* Context menu */}
      {contextTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setContextTarget(null)}
          />
          <div className="relative bg-background rounded-lg p-4 w-64 shadow-lg space-y-2 animate-in fade-in zoom-in-95 duration-150">
            <p className="text-sm font-medium mb-2">Comment options</p>
              {user?.userId === contextTarget.userId ? (
              <button
                onClick={() => {
                  setConfirmDelete(contextTarget);
                  setContextTarget(null);
                }}
                className="w-full text-left text-sm text-destructive px-3 py-2 rounded-lg hover:bg-accent"
              >
                Delete comment
              </button>
            ) : (
              <>
                <button className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-accent">
                  Report comment
                </button>
                <button className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-accent">
                  Block @{contextTarget.username}
                </button>
              </>
            )}
            <button
              onClick={() => setContextTarget(null)}
              className="w-full text-left text-sm text-muted-foreground px-3 py-2 rounded-lg hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setConfirmDelete(null)}
          />
          <div className="relative bg-background rounded-lg p-6 w-80 shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="font-semibold">Delete Comment</h4>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this comment?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm rounded-lg hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmDelete?.commentId != null) deleteComment(confirmDelete.commentId);
                  setConfirmDelete(null);
                }}
                className="px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  replyCount,
  replies,
  isRepliesVisible,
  isLoadingReplies,
  hasMoreReplies,
  isDeleting,
  currentUserId,
  selectedComments,
  deletingComments,
  onReplyClick,
  onViewReplies,
  onHideReplies,
  onLoadMoreReplies,
  onDeleteRequest,
  onReplyToReply,
}: {
  comment: CommentDto;
  replyCount: number;
  replies: CommentDto[];
  isRepliesVisible: boolean;
  isLoadingReplies: boolean;
  hasMoreReplies: boolean;
  isDeleting: boolean;
  currentUserId?: number;
  selectedComments: Set<number>;
  deletingComments: Set<number>;
  onReplyClick: () => void;
  onViewReplies: () => void;
  onHideReplies: () => void;
  onLoadMoreReplies: () => void;
  onDeleteRequest: () => void;
  onReplyToReply: (reply: CommentDto) => void;
}) {
  const commentId = comment.commentId ?? 0;
  const isSelected = selectedComments.has(commentId);

  return (
    <div
      data-comment-id={commentId}
      className={`py-2 ${
        isSelected
          ? "bg-primary/10 rounded-lg -mx-1 px-1"
          : ""
      }`}
    >
      {/* Root comment content */}
      <div
        className="flex items-start gap-3"
        onContextMenu={(e) => {
          e.preventDefault();
          onDeleteRequest();
        }}
      >
        <div className="h-10 w-10 rounded-full shrink-0 overflow-hidden">
          <img
            src={userAvatarUrl(comment.userId, 80)}
            alt={comment.username}
            className="h-10 w-10 rounded-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">{comment.username}</span>
            <span className="text-xs text-muted-foreground">
              {comment.timestamp ? formatDate(new Date(comment.timestamp).toISOString()) : ""}
            </span>
          </div>
          <p className="text-sm mt-0.5 break-words">{comment.content}</p>
          <div className="flex items-center gap-1 mt-1">
            <button
              onClick={onReplyClick}
              className="text-xs text-primary hover:underline font-medium px-1"
            >
              Reply
            </button>
            {isDeleting && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-1" />
            )}
          </div>
        </div>
      </div>

      {/* View replies button (collapsed) */}
      {(replyCount > 0 || replies.length > 0) && !isRepliesVisible && (
        <div className="flex justify-center mt-1">
          <button
            onClick={onViewReplies}
            className="text-xs text-primary hover:underline font-medium"
          >
            View {replyCount} {replyCount === 1 ? "Reply" : "Replies"}
          </button>
        </div>
      )}

      {/* Loading replies */}
      {isLoadingReplies && (
        <div className="flex items-center gap-2 ml-[52px] mt-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Loading replies...
          </span>
        </div>
      )}

      {/* Replies section */}
      {isRepliesVisible && replies.length > 0 && (
        <div className="ml-[52px] mt-2 space-y-2">
          {replies.map((reply) => {
            const parentUsername = findParentUsername(
              reply.parentCommentId ?? undefined,
              comment,
              replies
            );
            const rid = reply.commentId ?? 0;
            return (
              <ReplyItem
                key={rid}
                reply={reply}
                replyingToUsername={parentUsername}
                isDeleting={deletingComments.has(rid)}
                isSelected={selectedComments.has(rid)}
                onReplyClick={() => onReplyToReply(reply)}
                onDeleteRequest={onDeleteRequest}
              />
            );
          })}

          {/* Pagination */}
          <div className="flex items-center justify-center gap-1 pt-1">
            {hasMoreReplies ? (
              <>
                <button
                  onClick={onLoadMoreReplies}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  View More
                </button>
                <span className="text-xs text-muted-foreground">&middot;</span>
              </>
            ) : null}
            <button
              onClick={onHideReplies}
              className="text-xs text-primary hover:underline font-medium"
            >
              Hide Replies
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReplyItem({
  reply,
  replyingToUsername,
  isDeleting,
  isSelected,
  onReplyClick,
  onDeleteRequest,
}: {
  reply: CommentDto;
  replyingToUsername: string | null;
  isDeleting: boolean;
  isSelected: boolean;
  onReplyClick: () => void;
  onDeleteRequest: () => void;
}) {
  return (
    <div
      data-comment-id={reply.commentId ?? 0}
      className={`py-1 ${
        isSelected
          ? "bg-primary/10 rounded-lg -mx-1 px-1"
          : ""
      }`}
    >
      <div
        className="flex items-start gap-2"
        onContextMenu={(e) => {
          e.preventDefault();
          onDeleteRequest();
        }}
      >
        <div className="h-8 w-8 rounded-full shrink-0 overflow-hidden">
          <img
            src={userAvatarUrl(reply.userId, 64)}
            alt={reply.username}
            className="h-8 w-8 rounded-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold">{reply.username}</span>
            <span className="text-xs text-muted-foreground">
              {reply.timestamp ? formatDate(new Date(reply.timestamp).toISOString()) : ""}
            </span>
          </div>
          {replyingToUsername && (
            <p className="text-xs text-primary mt-0.5">
              Replying to @{replyingToUsername}
            </p>
          )}
          <p className="text-xs mt-0.5 break-words">{reply.content}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <button
              onClick={onReplyClick}
              className="text-xs text-primary hover:underline font-medium px-1"
            >
              Reply
            </button>
            {isDeleting && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-1" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function findParentUsername(
  parentCommentId: number | undefined,
  rootComment: CommentDto,
  replies: CommentDto[]
): string | null {
  if (!parentCommentId) return null;
  if (parentCommentId === rootComment.commentId) return rootComment.username;
  return replies.find((r) => r.commentId === parentCommentId)?.username || null;
}
