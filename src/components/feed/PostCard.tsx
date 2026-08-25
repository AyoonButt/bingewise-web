"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Bookmark, MessageCircle, Share2, EyeOff } from "lucide-react";
import { tmdbImage } from "@/lib/tmdb";
import { cn } from "@/lib/utils";
import type { PostDto } from "@/types/post";
import { useRef, useState } from "react";
import { CommentBottomSheet } from "@/components/comments/CommentBottomSheet";
import { ShareDialog } from "@/components/share/ShareDialog";

interface PostCardProps {
  post: PostDto;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onSave: () => void;
  onNotInterested?: () => void;
  initialShowComments?: boolean;
  highlightCommentIds?: number[];
}

export function PostCard({
  post,
  isLiked,
  isSaved,
  onLike,
  onSave,
  onNotInterested,
  initialShowComments = false,
  highlightCommentIds,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(initialShowComments);
  const [showShare, setShowShare] = useState(false);
  const commentAnchorRef = useRef<HTMLElement | null>(null);

  const handleDoubleClick = () => {
    if (!isLiked) {
      onLike();
    }
  };

  const openComments = (e: React.MouseEvent) => {
    commentAnchorRef.current =
      (e.currentTarget as HTMLElement).closest("[data-post-card]") ?? null;
    setShowComments(true);
  };

  return (
    <article
      data-post-card
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
          <Link href={`/post/${post.tmdbId ?? post.postId ?? ""}?type=${post.type}`}>
        <div className="relative aspect-[2/3]">
          <Image
            src={tmdbImage(post.posterPath ?? "", "w500")}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
        </div>
      </Link>
      <div className="p-4 space-y-3">
        <div>
      <Link href={`/post/${post.tmdbId ?? post.postId ?? ""}?type=${post.type}`}>
            <h3 className="font-semibold text-lg hover:underline">{post.title}</h3>
          </Link>
          {post.overview && (
            <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
              {post.overview}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4 pt-2 border-t border-border">
          <button
            onClick={handleDoubleClick}
            className="flex items-center gap-1.5 text-sm hover:text-[var(--heart-red)] transition-colors"
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-colors",
                isLiked && "fill-[var(--heart-red)] text-[var(--heart-red)]"
              )}
            />
          </button>
          <button
            onClick={openComments}
            className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors"
            aria-label="Comments"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-1.5 text-sm ml-auto transition-colors"
            style={{ color: isSaved ? "var(--saved-bookmark)" : undefined }}
          >
            <Bookmark
              className={cn(
                "h-5 w-5 transition-colors",
                isSaved && "fill-[var(--saved-bookmark)]"
              )}
            />
          </button>
          {onNotInterested && (
            <button
              onClick={onNotInterested}
              className="p-1.5 rounded hover:bg-accent transition-colors"
              aria-label="Not interested"
              title="Not interested"
            >
              <EyeOff className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={() => setShowShare(true)}
            className="p-1.5 rounded hover:bg-accent transition-colors"
            aria-label="Share"
          >
            <Share2 className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>
      {showComments && (
        <CommentBottomSheet
          postId={post.postId ?? 0}
          anchorRef={commentAnchorRef}
          onClose={() => setShowComments(false)}
          highlightCommentIds={highlightCommentIds}
        />
      )}
      {showShare && (
        <ShareDialog
          postId={post.postId ?? 0}
          postTitle={post.title}
          onClose={() => setShowShare(false)}
        />
      )}
    </article>
  );
}
