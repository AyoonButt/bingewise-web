"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, Bookmark, MessageCircle, Share2, EyeOff } from "lucide-react";
import { tmdbImage } from "@/lib/tmdb";
import { cn } from "@/lib/utils";
import type { PostDto } from "@/types/post";
import { useEffect, useRef, useState } from "react";
import { CommentBottomSheet } from "@/components/comments/CommentBottomSheet";
import { ShareDialog } from "@/components/share/ShareDialog";

interface PostCardProps {
  post: PostDto;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onSave: () => void;
  onNotInterested?: () => void;
  enablePosterDoubleTap?: boolean;
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
  enablePosterDoubleTap = true,
  initialShowComments = false,
  highlightCommentIds,
}: PostCardProps) {
  const router = useRouter();
  const [showComments, setShowComments] = useState(initialShowComments);
  const [showShare, setShowShare] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const commentAnchorRef = useRef<HTMLElement | null>(null);
  const posterClickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const likeAnimationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const posterLikeTriggeredRef = useRef(false);
  const posterHref = `/post/${post.tmdbId ?? post.postId ?? ""}?type=${post.type}`;

  useEffect(() => {
    return () => {
      if (posterClickTimeoutRef.current) clearTimeout(posterClickTimeoutRef.current);
      if (likeAnimationTimeoutRef.current) clearTimeout(likeAnimationTimeoutRef.current);
    };
  }, []);

  const showLikeFeedback = () => {
    setShowLikeAnimation(true);
    if (likeAnimationTimeoutRef.current) clearTimeout(likeAnimationTimeoutRef.current);
    likeAnimationTimeoutRef.current = setTimeout(() => {
      setShowLikeAnimation(false);
      posterLikeTriggeredRef.current = false;
    }, 700);
  };

  const likeFromPoster = () => {
    if (!isLiked && !posterLikeTriggeredRef.current) {
      posterLikeTriggeredRef.current = true;
      onLike();
    }
    showLikeFeedback();
  };

  const handlePosterClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!enablePosterDoubleTap) return;
    e.preventDefault();
    if (posterClickTimeoutRef.current) {
      clearTimeout(posterClickTimeoutRef.current);
      posterClickTimeoutRef.current = null;
      likeFromPoster();
      return;
    }
    posterClickTimeoutRef.current = setTimeout(() => {
      posterClickTimeoutRef.current = null;
      router.push(posterHref);
    }, 280);
  };

  const handlePosterDoubleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!enablePosterDoubleTap) return;
    e.preventDefault();
    e.stopPropagation();
    if (posterClickTimeoutRef.current) {
      clearTimeout(posterClickTimeoutRef.current);
      posterClickTimeoutRef.current = null;
    }
    likeFromPoster();
  };

  const openComments = (e: React.MouseEvent) => {
    commentAnchorRef.current =
      (e.currentTarget as HTMLElement).closest("[data-post-card]") ?? null;
    setShowComments(true);
  };

  return (
    <article data-post-card className="rounded-xl border border-border bg-card overflow-hidden">
      <Link
        href={posterHref}
        onClick={handlePosterClick}
        onDoubleClick={handlePosterDoubleClick}
      >
        <div className="relative aspect-[2/3]">
          <Image
            src={tmdbImage(post.posterPath ?? "", "w500")}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
          {showLikeAnimation && (
            <Heart
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 text-white fill-[var(--heart-red)] drop-shadow-lg animate-in zoom-in-50 fade-in duration-200"
            />
          )}
        </div>
      </Link>
      <div className="p-4 space-y-3">
        <div>
          <Link href={posterHref}>
            <h3 className="font-semibold text-lg hover:underline">{post.title}</h3>
          </Link>
          {post.overview && <p className="text-sm text-muted-foreground line-clamp-3 mt-1">{post.overview}</p>}
        </div>
        <div className="flex items-center gap-4 pt-2 border-t border-border">
          <button
            onClick={onLike}
            className="flex items-center gap-1.5 text-sm hover:text-[var(--heart-red)] active:scale-90 transition-all"
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            <Heart className={cn("h-5 w-5 transition-colors", isLiked && "fill-[var(--heart-red)] text-[var(--heart-red)]")} />
          </button>
          <button
            onClick={openComments}
            className="flex items-center gap-1.5 text-sm hover:text-primary active:scale-90 transition-all"
            aria-label="Comments"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-1.5 text-sm ml-auto active:scale-90 transition-all"
            style={{ color: isSaved ? "var(--saved-bookmark)" : undefined }}
          >
            <Bookmark className={cn("h-5 w-5 transition-colors", isSaved && "fill-[var(--saved-bookmark)]")} />
          </button>
          {onNotInterested && (
            <button onClick={onNotInterested} className="p-1.5 rounded hover:bg-accent active:scale-90 transition-all" aria-label="Not interested" title="Not interested">
              <EyeOff className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
          <button onClick={() => setShowShare(true)} className="p-1.5 rounded hover:bg-accent active:scale-90 transition-all" aria-label="Share">
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
        <ShareDialog postId={post.postId ?? 0} postTitle={post.title} onClose={() => setShowShare(false)} />
      )}
    </article>
  );
}
