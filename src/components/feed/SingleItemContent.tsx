"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useInteractions } from "@/hooks/use-interactions";
import { apiClient } from "@/lib/api-client";
import { getLanguageRegion } from "@/lib/locale";
import { PostCard } from "@/components/feed/PostCard";
import { TrailerPager } from "@/components/feed/TrailerPager";
import type { PostDto } from "@/types/post";

export function SingleItemContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const postId = Number(params.postId);
  const languageRegion = getLanguageRegion(user);
  const isVideo = searchParams.get("video") === "1";
  const highlightCommentIds = (searchParams.get("commentIds") ?? "")
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isInteger(v) && v > 0);

  const [post, setPost] = useState<PostDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isLiked, isSaved, toggleLike, toggleSave } = useInteractions(
    user?.userId
  );

  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    apiClient<PostDto>(`/api/posts/${postId}/${languageRegion}`)
      .then((data) => {
        if (cancelled) return;
        setPost(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load post");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [postId, languageRegion]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-sm text-destructive">{error || "Post not found"}</p>
      </div>
    );
  }

  if (isVideo) {
    return (
      <TrailerPager
        posts={[post]}
        endMessage=""
        className="w-full h-[calc(100vh-8rem)] overflow-y-scroll snap-y snap-mandatory snap-scroll rounded-xl overflow-hidden"
      />
    );
  }

  return (
    <div className="max-w-md mx-auto pb-6">
      <PostCard
        post={post}
        isLiked={post.postId ? isLiked(post.postId) : false}
        isSaved={post.postId ? isSaved(post.postId) : false}
        onLike={() => post.postId && toggleLike(post.postId)}
        onSave={() => post.postId && toggleSave(post.postId)}
        initialShowComments={highlightCommentIds.length > 0}
        highlightCommentIds={
          highlightCommentIds.length > 0 ? highlightCommentIds : undefined
        }
      />
    </div>
  );
}
