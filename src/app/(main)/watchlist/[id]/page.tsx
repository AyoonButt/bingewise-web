"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Bookmark,
  ChevronLeft,
  Clapperboard,
  Copy,
  Globe,
  LayoutGrid,
  Loader2,
  Lock,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { useWatchlistDetail } from "@/hooks/use-watchlist-detail";
import { useInteractions } from "@/hooks/use-interactions";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { useWatchlistFeed } from "@/hooks/use-watchlist-feed";
import { WatchlistItemCard } from "@/components/watchlist/WatchlistItemCard";
import { EditWatchlistDialog } from "@/components/watchlist/EditWatchlistDialog";
import { PostCard } from "@/components/feed/PostCard";
import { TrailerPager } from "@/components/feed/TrailerPager";
import { parseCoverColor } from "@/components/watchlist/palette";
import { cloneWatchlist, getWatchlistShareInfo } from "@/lib/watchlist";
import { ShareDialog } from "@/components/share/ShareDialog";
import { Send as SendIcon } from "lucide-react";
import { cn, siteUrl } from "@/lib/utils";
import { MobileAppBanner } from "@/components/mobile-app-banner";
import { CollaboratorsRow } from "@/components/watchlist/CollaboratorsRow";
import { ManageMembersModal } from "@/components/watchlist/ManageMembersModal";

export default function WatchlistDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <WatchlistDetailInner />
    </Suspense>
  );
}

function WatchlistDetailInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const watchlistId = Number(params.id);
  // View and selected item live in the URL so that navigating from a grid item
  // (same route, new query string) updates correctly - the component is not
  // remounted on query-string changes.
  const view: "grid" | "feed" =
    searchParams.get("view") === "feed" ? "feed" : "grid";
  const selectedItemId = Number(searchParams.get("itemId")) || null;
  // Secret share-link token — grants access to private shared lists.
  const shareToken = searchParams.get("st");
  const [feedContentType, setFeedContentType] = useState<"POSTS" | "VIDEOS">(
    "POSTS"
  );

  const setView = (next: "grid" | "feed") => {
    const urlParams = new URLSearchParams(searchParams.toString());
    if (next === "feed") {
      urlParams.set("view", "feed");
    } else {
      urlParams.delete("view");
      urlParams.delete("itemId");
    }
    const queryString = urlParams.toString();
    router.push(`/watchlist/${watchlistId}${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });
  };
  const {
    detail,
    isLoading,
    isDeleting,
    error,
    updateError,
    metaSaving,
    removeItem,
    togglePublic,
    updateMeta,
    deleteList,
    refresh,
  } = useWatchlistDetail(watchlistId, shareToken);
  const [showEdit, setShowEdit] = useState(false);

  const items = useMemo(() => detail?.items ?? [], [detail]);
  const { posts: feedPosts, isLoading: isLoadingFeedPosts } = useWatchlistFeed(
    items,
    view === "feed"
  );

  const { isLiked, isSaved, toggleLike, toggleSave } = useInteractions(
    user?.userId
  );

  // Move the selected item to the top, like the mobile watchlist items feed
  const displayPosts = useMemo(() => {
    if (!selectedItemId || feedPosts.length === 0) return feedPosts;
    const index = items.findIndex((item) => item.id === selectedItemId);
    if (index <= 0) return feedPosts;
    const next = [...feedPosts];
    const [post] = next.splice(index, 1);
    next.unshift(post);
    return next;
  }, [feedPosts, items, selectedItemId]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showManage, setShowManage] = useState(false);

  const watchlist = detail?.watchlist;
  const collaborators = detail?.collaborators ?? [];
  const isOwner =
    !!watchlist &&
    (watchlist.isOwner ||
      watchlist.userId === user?.userId ||
      watchlist.ownerId === user?.userId);
  const isCollaborator =
    !!user && collaborators.some((c) => c.userId === user.userId);
  const isMember = isOwner || isCollaborator;

  // Resolves the share URL for notifications: owners mint a secret link;
  // other viewers reuse the current URL (which already carries ?st=).
  const getShareLink = useCallback(async () => {
    const currentPath = window.location.pathname + window.location.search;
    if (isOwner) {
      // Owners MUST get a secret-link token for private lists. No silent
      // fallback — a token-less link would 403 for recipients.
      const info = await getWatchlistShareInfo(watchlistId);
      return info?.deepLink || siteUrl(currentPath);
    }
    // Non-owners share their own access context (URL already carries ?st=).
    return siteUrl(currentPath);
  }, [isOwner, watchlistId]);
  const [isCloning, setIsCloning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Preserve feed scroll when navigating into a poster detail and back. The
  // VIDEOS branch (TrailerPager) restores its own reel; here we cover POSTS.
  useScrollRestoration(
    feedContentType === "VIDEOS" ? "" : `/watchlist:${watchlistId}:POSTS`,
    { ready: displayPosts.length > 0 }
  );

  const showNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(null), 2500);
  };

  const handleShare = async () => {
    try {
      let url = siteUrl(window.location.pathname + window.location.search);
      try {
        const info = await getWatchlistShareInfo(watchlistId);
        if (info?.deepLink) url = info.deepLink;
      } catch {
        // fall back to current URL
      }
      if (navigator.share) {
        await navigator.share({
          title: watchlist?.name ?? "Watchlist",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        showNotice("Link copied to clipboard");
      }
    } catch {
      // user cancelled share
    }
  };

  const handleClone = async () => {
    // Guest mode: prompt sign-up instead of cloning
    if (!user) {
      useUiStore.getState().openSignupPrompt();
      return;
    }
    setIsCloning(true);
    try {
      const result = await cloneWatchlist(watchlistId, shareToken ?? undefined);
      router.push(`/watchlist/${result.watchlist.id}`);
    } catch {
      showNotice("Failed to clone watchlist");
    } finally {
      setIsCloning(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteList();
      router.push("/watchlists");
    } catch {
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
        <div className="h-32 rounded-2xl bg-muted animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[2/3] rounded-xl bg-muted animate-pulse" />
              <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !detail || !watchlist) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-muted-foreground">{error || "Watchlist not found"}</p>
        <Link href="/watchlists" className="btn-primary inline-flex">
          Back to Watchlists
        </Link>
      </div>
    );
  }

  const color = parseCoverColor(watchlist.coverColor);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/watchlists"
          className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-xl font-bold tracking-tight flex-1">Watchlist</h2>
        <div className="flex gap-1 p-1 rounded-xl bg-muted">
          <button
            onClick={() => setView("grid")}
            aria-label="Grid view"
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              view === "grid"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("feed")}
            aria-label="Feed view"
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              view === "feed"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Clapperboard className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Cover banner */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}99)`,
        }}
      >
        <div className="p-5 sm:p-6 space-y-1">
          <h1 className="text-2xl font-bold text-white">{watchlist.name}</h1>
          {watchlist.description && (
            <p className="text-sm text-white/80">{watchlist.description}</p>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {!isOwner && watchlist.ownerName && (
          <span>by {watchlist.ownerName}</span>
        )}
        <span>
          {watchlist.itemCount} {watchlist.itemCount === 1 ? "item" : "items"}
        </span>
        {isOwner ? (
          <button
            onClick={togglePublic}
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            {watchlist.isPublic ? (
              <Globe className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            {watchlist.isPublic ? "Public. Make private" : "Private. Make public"}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            {watchlist.isPublic ? (
              <Globe className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            {watchlist.isPublic ? "Public" : "Private"}
          </span>
        )}
      </div>

      {/* Collaborators row */}
      <CollaboratorsRow
        ownerName={watchlist.ownerName}
        ownerAvatarUrl={watchlist.ownerAvatarUrl}
        collaborators={detail.collaborators ?? []}
        onManageClick={() => setShowManage(true)}
      />

      <ManageMembersModal
        open={showManage}
        onOpenChange={setShowManage}
        watchlistId={watchlistId}
        isOwner={isOwner}
        ownerName={watchlist.ownerName}
        ownerAvatarUrl={watchlist.ownerAvatarUrl}
        collaborators={detail.collaborators ?? []}
        onChanged={refresh}
      />

      {updateError && (
        <p className="text-sm text-destructive">{updateError}</p>
      )}

      {/* Actions */}
      {isMember ? (
        <div className="flex gap-3">
          {isOwner && (
            <button
              onClick={() => setShowEdit(true)}
              className="btn-outline flex-1 h-10 flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          )}
          <button
            onClick={handleShare}
            className="btn-outline flex-1 h-10 flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap"
          >
            <Share2 className="h-4 w-4" />
            Share Link
          </button>
          {isOwner && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="flex-1 h-10 rounded-xl border border-destructive/30 text-destructive text-xs sm:text-sm font-medium flex items-center justify-center gap-2 hover:bg-destructive/5 transition-colors disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={handleClone}
          disabled={isCloning}
          className="btn-primary w-full h-10 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          {isCloning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          Add to My Watchlists
        </button>
      )}

      {notice && <p className="text-sm text-center text-primary">{notice}</p>}
      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      {/* Send via notification — any signed-in viewer */}
      {user && (
        <button
          onClick={() => setShowSend(true)}
          className="btn-outline w-full h-10 flex items-center justify-center gap-2 text-sm"
        >
          <SendIcon className="h-4 w-4" />
          Send to a friend
        </button>
      )}

      {showSend && watchlist && (
        <ShareDialog
          postId={0}
          postTitle={watchlist.name}
          onClose={() => setShowSend(false)}
          watchlistTarget={{
            id: watchlistId,
            name: watchlist.name,
            getLink: getShareLink,
          }}
        />
      )}

      {/* Items */}
      {detail.items.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-muted mx-auto flex items-center justify-center">
            <Bookmark className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {isMember
              ? "Nothing in this list yet. Add titles from any poster page."
              : "This watchlist is empty."}
          </p>
          {isMember && (
            <Link href="/explore" className="btn-primary inline-flex">
              Explore titles
            </Link>
          )}
        </div>
      ) : view === "feed" ? (
        <div className="space-y-4">
          {/* Posts / Trailers toggle */}
          <div className="card p-1 flex gap-1 max-w-md mx-auto">
            {(["POSTS", "VIDEOS"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setFeedContentType(option)}
                className={cn(
                  "flex-1 h-9 rounded-lg text-sm font-medium transition-colors",
                  feedContentType === option
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                {option === "POSTS" ? "Posts" : "Trailers"}
              </button>
            ))}
          </div>

          {isLoadingFeedPosts && feedPosts.length === 0 ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : feedContentType === "VIDEOS" ? (
            <TrailerPager
              posts={displayPosts}
              loadingMore={isLoadingFeedPosts}
              hasMore={false}
              endMessage="End of watchlist"
              emptyMessage="No trailers available for these titles yet."
              scrollRestorationKey={`/watchlist:${watchlistId}:VIDEOS`}
              className="w-full h-[calc(100dvh-8rem-env(safe-area-inset-bottom,0px))] lg:h-[calc(100vh-8rem)] overflow-y-scroll snap-y snap-mandatory snap-scroll rounded-xl overflow-hidden"
            />
          ) : (
            <div className="max-w-md mx-auto space-y-6 pb-6">
              {displayPosts.map((post, index) => (
                <PostCard
                  key={`${post.postId ?? "stub"}_${post.tmdbId}_${index}`}
                  post={post}
                  isLiked={post.postId ? isLiked(post.postId) : false}
                  isSaved={post.postId ? isSaved(post.postId) : false}
                  onLike={() => post.postId && toggleLike(post.postId)}
                  onSave={() => post.postId && toggleSave(post.postId)}
                  enablePosterDoubleTap
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {detail.items.map((item) => {
            const canRemove = isOwner || (!!user && item.addedBy === user.userId);
            return (
              <WatchlistItemCard
                key={item.id}
                item={item}
                canRemove={canRemove}
                onRemove={removeItem}
                feedHref={`/watchlist/${watchlistId}?view=feed&itemId=${item.id}`}
              />
            );
          })}
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
            onClick={() => !isDeleting && setShowDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-sm bg-background border border-border rounded-2xl p-5 space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="font-semibold">Delete watchlist?</h3>
            <p className="text-sm text-muted-foreground">
              &ldquo;{watchlist.name}&rdquo; and its {watchlist.itemCount}{" "}
              {watchlist.itemCount === 1 ? "item" : "items"} will be permanently
              deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="btn-outline flex-1 h-10"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <EditWatchlistDialog
        open={showEdit}
        name={detail?.watchlist.name ?? ""}
        coverColor={detail?.watchlist.coverColor ?? null}
        isSaving={metaSaving}
        error={updateError}
        onClose={() => setShowEdit(false)}
        onSave={(patch) => {
          updateMeta(patch)
            .then(() => setShowEdit(false))
            .catch(() => {});
        }}
      />
      {(shareToken || !isOwner) && <MobileAppBanner />}
    </div>
  );
}
