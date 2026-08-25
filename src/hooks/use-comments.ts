"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { connectComments, subscribeToPost, unsubscribeFromPost } from "@/lib/websocket";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import type { CommentDto, CommentEvent, CommentResponse, ReplyCountDto } from "@/types/comment";

const REPLIES_PAGE_SIZE = 20;

function getCommentId(c: CommentDto): number {
  return c.commentId ?? 0;
}

export function useComments(postId: number) {
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyCounts, setReplyCounts] = useState<Record<number, number>>({});
  const [repliesCache, setRepliesCache] = useState<Record<number, CommentDto[]>>({});
  const [visibleReplySections, setVisibleReplySections] = useState<Set<number>>(new Set());
  const [loadingReplies, setLoadingReplies] = useState<Set<number>>(new Set());
  const [deletingComments, setDeletingComments] = useState<Set<number>>(new Set());
  const [isPosting, setIsPosting] = useState(false);
  const connectedRef = useRef(false);

  const fetchReplyCounts = useCallback(async (ids: number[]) => {
    if (ids.length === 0) return;
    const params = ids.map((id) => `parentIds=${id}`).join("&");
    try {
      const counts = (await apiClient<ReplyCountDto[]>(
        `/api/comments/reply-counts?${params}`
      )) ?? [];
      const map: Record<number, number> = {};
      counts.forEach((c) => {
        map[c.parentId] = c.replyCount;
      });
      setReplyCounts((prev) => ({ ...prev, ...map }));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!postId) return;
    setIsLoading(true);
    setError(null);
    apiClient<CommentDto[]>(`/api/comments/post/${postId}`)
      .then((data) => {
        const list = data ?? [];
        setComments(list);
        fetchReplyCounts(list.map(getCommentId));
      })
      .catch(() => setError("Failed to load comments"))
      .finally(() => setIsLoading(false));
  }, [postId, fetchReplyCounts]);

  useEffect(() => {
    if (typeof window === "undefined" || connectedRef.current) return;

    const token = document.cookie
      .split("; ")
      .find((c) => c.startsWith("accessToken="))
      ?.split("=")[1];

    if (!token) return;

    const disconnect = connectComments(token, (event: CommentEvent) => {
      if (event.postId !== postId) return;

      switch (event.type) {
        case "NEW_ROOT_COMMENT":
          if (event.commentId) {
            apiClient<CommentDto>(`/api/comments/data/${event.commentId}`).then(
              (newComment) => setComments((prev) => [newComment, ...prev])
            );
          }
          break;
        case "NEW_REPLY":
          if (event.commentId && event.postId) {
            apiClient<CommentDto>(`/api/comments/data/${event.commentId}`).then(
              (newReply) => {
                const parentId = newReply.parentCommentId;
                if (parentId) {
                  setRepliesCache((prev) => ({
                    ...prev,
                    [parentId]: [...(prev[parentId] || []), newReply],
                  }));
                  setVisibleReplySections((prev) => new Set([...prev, parentId]));
                  setReplyCounts((prev) => ({
                    ...prev,
                    [parentId]: (prev[parentId] || 0) + 1,
                  }));
                }
              }
            );
          }
          break;
        case "REPLY_COUNT_UPDATE":
          if (event.commentId && event.replyCount !== undefined) {
            setReplyCounts((prev) => ({
              ...prev,
              [event.commentId!]: event.replyCount!,
            }));
          }
          break;
        case "COMMENT_DELETED":
          if (event.commentId) {
            setComments((prev) =>
              prev.filter((c) => getCommentId(c) !== event.commentId)
            );
            setRepliesCache((prev) => {
              const next = { ...prev };
              for (const key of Object.keys(next)) {
                next[Number(key)] = next[Number(key)].filter(
                  (r) => getCommentId(r) !== event.commentId
                );
              }
              return next;
            });
          }
          break;
      }
    });
    connectedRef.current = true;

    subscribeToPost(postId);

    return () => {
      unsubscribeFromPost(postId);
      disconnect();
      connectedRef.current = false;
    };
  }, [postId]);

  const toggleReplySection = useCallback(
    async (commentId: number) => {
      if (visibleReplySections.has(commentId)) {
        setVisibleReplySections((prev) => {
          const next = new Set(prev);
          next.delete(commentId);
          return next;
        });
        setRepliesCache((prev) => {
          const next = { ...prev };
          delete next[commentId];
          return next;
        });
      } else {
        setLoadingReplies((prev) => new Set([...prev, commentId]));
        try {
          const offset = repliesCache[commentId]?.length ?? 0;
          const replies = (await apiClient<CommentDto[]>(
            `/api/comments/${commentId}/all-replies?limit=${REPLIES_PAGE_SIZE}&offset=${offset}`
          )) ?? [];
          setRepliesCache((prev) => ({
            ...prev,
            [commentId]: offset === 0 ? replies : [...(prev[commentId] || []), ...replies],
          }));
          setVisibleReplySections((prev) => new Set([...prev, commentId]));
        } catch {
          // ignore
        } finally {
          setLoadingReplies((prev) => {
            const next = new Set(prev);
            next.delete(commentId);
            return next;
          });
        }
      }
    },
    [visibleReplySections, repliesCache]
  );

  const loadMoreReplies = useCallback(
    async (commentId: number) => {
      setLoadingReplies((prev) => new Set([...prev, commentId]));
      try {
        const offset = repliesCache[commentId]?.length || 0;
        const replies = (await apiClient<CommentDto[]>(
          `/api/comments/${commentId}/all-replies?limit=${REPLIES_PAGE_SIZE}&offset=${offset}`
        )) ?? [];
        setRepliesCache((prev) => ({
          ...prev,
          [commentId]: [...(prev[commentId] || []), ...replies],
        }));
      } catch {
        // ignore
      } finally {
        setLoadingReplies((prev) => {
          const next = new Set(prev);
          next.delete(commentId);
          return next;
        });
      }
    },
    [repliesCache]
  );

  const hasMoreReplies = useCallback(
    (commentId: number) => {
      const cached = repliesCache[commentId]?.length || 0;
      const total = replyCounts[commentId] || 0;
      return cached < total;
    },
    [repliesCache, replyCounts]
  );

  const deleteComment = useCallback(async (commentId: number) => {
    setDeletingComments((prev) => new Set([...prev, commentId]));
    try {
      await apiClient(`/api/comments/${commentId}`, { method: "DELETE" });
      setComments((prev) => prev.filter((c) => getCommentId(c) !== commentId));
      setRepliesCache((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          next[Number(key)] = next[Number(key)].filter(
            (r) => getCommentId(r) !== commentId
          );
        }
        return next;
      });
    } catch {
      // ignore
    } finally {
      setDeletingComments((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  }, []);

  const postComment = useCallback(
    async (content: string, parentCommentId?: number) => {
      const { user } = useAuthStore.getState();
      // Guest mode: prompt sign-up instead of throwing
      if (!user) {
        const { useUiStore } = await import("@/stores/ui-store");
        useUiStore.getState().openSignupPrompt();
        return;
      }
      setIsPosting(true);
      try {
        const body: Record<string, unknown> = {
          commentId: null,
          userId: user.userId,
          username: user.username,
          postId,
          content,
          timestamp: Date.now(),
          parentCommentId: parentCommentId ?? null,
          commentType: "post",
        };
        const res = await apiClient<CommentResponse>("/api/comments/insert", {
          method: "POST",
          body: JSON.stringify(body),
        });
        if (res.commentId) {
          const optimistic: CommentDto = {
            commentId: res.commentId,
            userId: user.userId,
            username: user.username,
            postId,
            content,
            timestamp: Date.now(),
            parentCommentId: parentCommentId ?? null,
            commentType: "post",
          };
          if (parentCommentId) {
            setRepliesCache((prev) => ({
              ...prev,
              [parentCommentId]: [
                ...(prev[parentCommentId] || []).filter(
                  (r) => getCommentId(r) !== res.commentId
                ),
                optimistic,
              ],
            }));
            setVisibleReplySections(
              (prev) => new Set([...prev, parentCommentId])
            );
            setReplyCounts((prev) => ({
              ...prev,
              [parentCommentId]: (prev[parentCommentId] || 0) + 1,
            }));
          } else {
            setComments((prev) => [
              optimistic,
              ...prev.filter((c) => getCommentId(c) !== res.commentId),
            ]);
          }
        }
        return res;
      } finally {
        setIsPosting(false);
      }
    },
    [postId]
  );

  return {
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
  };
}
