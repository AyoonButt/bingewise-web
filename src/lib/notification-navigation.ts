import { apiClient } from "@/lib/api-client";
import { getLanguageRegion } from "@/lib/locale";
import { useAuthStore } from "@/stores/auth-store";
import type { PostDto } from "@/types/post";

export interface PostNotificationTarget {
  /** Post id carried by content notifications. */
  referenceId: number;
  /** TMDB id, when the backend attached one to the notification. */
  contentId?: number | null;
  mediaType?: string | null;
}

/**
 * Resolves the URL a content (post) notification should open.
 *
 * Notification taps must land on poster detail, never the post card. The
 * TMDB id comes from `contentId` when present; otherwise the referenced post
 * is fetched and its `tmdbId`/`type` are used — the same resolution the post
 * card performs before linking to poster detail. Falls back to the post card
 * (`/activity/item/{referenceId}`) only when the post cannot be resolved.
 */
export async function resolvePostNotificationHref({
  referenceId,
  contentId,
  mediaType,
}: PostNotificationTarget): Promise<string | null> {
  if (contentId && contentId > 0) {
    const typeParam = mediaType === "movie" ? "movie" : "tv";
    return `/post/${contentId}?type=${typeParam}`;
  }
  if (referenceId > 0) {
    try {
      const user = useAuthStore.getState().user;
      const post = await apiClient<PostDto>(
        `/api/posts/${referenceId}/${getLanguageRegion(user)}`
      );
      if (post?.tmdbId && post.tmdbId > 0) {
        const typeParam = (post.type || mediaType) === "movie" ? "movie" : "tv";
        return `/post/${post.tmdbId}?type=${typeParam}`;
      }
    } catch {
      // fall through to the post card
    }
    return `/activity/item/${referenceId}`;
  }
  return null;
}
