"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  Copy,
  Film,
  Globe,
  Info,
  Loader2,
  Lock,
  Settings,
  UserPlus,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/lib/api-client";
import { cn, decodeHtmlEntities } from "@/lib/utils";
import { tmdbImage } from "@/lib/tmdb";
import { userAvatarUrl } from "@/lib/avatar";
import { getGenreColor } from "@/lib/genre-colors";
import { getProviderColorById } from "@/lib/provider-colors";
import { useFollowList, useFollowStats } from "@/hooks/use-follow";
import { getUserWatchlists, cloneWatchlist, invalidateUserWatchlists } from "@/lib/watchlist";
import { onWatchlistsInvalidated } from "@/lib/watchlist-events";
import type { Watchlist } from "@/types/watchlist";

import {
  useProfileFollow,
  useUserProfileData,
} from "@/hooks/use-user-profile";
import type { FollowingUser, UserDto } from "@/types/user";
import type { PostDto } from "@/types/post";

type ProfileViewMode = "preferences" | "following" | "followers" | "lists";

export default function UserPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const currentUser = useAuthStore((s) => s.user);
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ProfileViewMode>("preferences");
  const [userLists, setUserLists] = useState<Watchlist[] | null>(null);
  const [listsForbidden, setListsForbidden] = useState(false);
  const [listsLoading, setListsLoading] = useState(false);
  const [cloningId, setCloningId] = useState<number | null>(null);
  const [listsError, setListsError] = useState<string | null>(null);

  useEffect(() => {
    if (!username || username === "undefined") return;
    let cancelled = false;
    async function load() {
      try {
        const data = await apiClient<UserDto>(
          `/api/users/username?username=${username}`
        );
        if (!cancelled) setUser(data);
      } catch {
        // user not found
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [username]);

  const userId = user?.userId;
  const isOwnProfile = !!currentUser?.userId && currentUser.userId === userId;

  // Load the profile's lists as soon as we know whose profile this is — the
  // stat count needs it, and the server enforces visibility anyway.
  useEffect(() => {
    if (!userId || userLists !== null || listsForbidden || listsLoading) return;
    let cancelled = false;
    setListsLoading(true);
    setListsError(null);
    getUserWatchlists(userId)
      .then((lists) => {
        if (!cancelled) setUserLists(lists);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        if (e.message === "403") setListsForbidden(true);
        else setListsError(e.message || "Failed to load lists");
      })
      .finally(() => {
        // Always clear the flag — even if this run was cancelled by
        // StrictMode remounting, otherwise the next run's guard deadlocks.
        setListsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, userLists, listsForbidden, listsLoading]);

  // Live updates: any clone/create/delete anywhere drops the cache and this
  // section refetches — no manual reload needed.
  useEffect(() => {
    if (!userId) return;
    return onWatchlistsInvalidated(() => {
      invalidateUserWatchlists(userId);
      setUserLists(null);
    });
  }, [userId]);



  const { data: stats } = useFollowStats(userId);
  const {
    isFollowing,
    isPending,
    toggleFollow,
    isLoading: followLoading,
    isStatusKnown,
  } = useProfileFollow(currentUser?.userId, user ?? undefined);

  const {
    preferences,
    isLoadingPreferences,
    preferencesError,
    preferencesForbidden,
    genreNames,
    providerNames,
    topLikedPosts,
  } = useUserProfileData(userId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-muted-foreground">User not found</p>
        <Link href="/feed" className="btn-primary inline-flex">
          Back to Feed
        </Link>
      </div>
    );
  }

  // Privacy check: content is visible if it's your own profile, the account is
  // public, or you are following a private account.
  const canViewPrivateContent =
    isOwnProfile || !user.isPrivate || isFollowing;

  // Lists stay hidden until we know both privacy status and follow status.
  const canViewLists =
    canViewPrivateContent ||
    !isLoadingPreferences ||
    (!isOwnProfile && !isStatusKnown);

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="card overflow-hidden">
        {/* Blue banner — back button, follow action, name next to avatar top */}
        <div className="relative h-32 bg-gradient-to-br from-[#0D47A1] via-[#1565C0] to-[#42A5F5]">
          <button
            onClick={() => router.back()}
            className="absolute top-3 left-3 h-9 w-9 rounded-full bg-black/25 text-white flex items-center justify-center hover:bg-black/40 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {!isOwnProfile && (
            <button
              onClick={toggleFollow}
              disabled={followLoading}
              className={cn(
                "absolute top-3 right-3 inline-flex items-center justify-center gap-1.5 h-9 px-5 rounded-full text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60",
                isFollowing
                  ? "bg-[#4CAF50]"
                  : isPending
                    ? "bg-[#FF9800]"
                    : "bg-primary"
              )}
            >
              {followLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isFollowing ? (
                "Following"
              ) : isPending ? (
                "Requested"
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Follow
                </>
              )}
            </button>
          )}

          {/* Name sits level with the avatar's top half */}
          <div className="absolute bottom-2 left-28 right-4 min-w-0">
            <h1 className="text-xl font-bold text-white truncate drop-shadow-sm">
              {user.name}
            </h1>
          </div>
        </div>

        {/* White area — avatar lower half, username directly under the name */}
        <div className="px-4 pb-4">
          <div className="relative -mt-10 flex items-end">
            <Image
              src={userAvatarUrl(user.userId, 160)}
              alt={user.name}
              width={80}
              height={80}
              className="rounded-full ring-4 ring-white dark:ring-zinc-900 object-cover bg-muted shrink-0 shadow-md"
            />
            <div className="flex-1 min-w-0 pb-1 pl-4">
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-sm text-muted-foreground truncate">
                  @{user.username}
                </p>
                {user.isPrivate && (
                  <span className="badge badge-secondary text-[10px] shrink-0">
                    Private
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-8 mt-4">
            <StatButton
              count={stats?.followingCount ?? 0}
              label="Following"
              selected={viewMode === "following"}
              onClick={() => setViewMode("following")}
            />
            <StatButton
              count={stats?.followersCount ?? 0}
              label="Followers"
              selected={viewMode === "followers"}
              onClick={() => setViewMode("followers")}
            />
            <StatButton
              count={userLists?.length ?? 0}
              label="Lists"
              selected={viewMode === "lists"}
              onClick={() => setViewMode("lists")}
            />
          </div>
        </div>
      </div>

      {isOwnProfile && (
        <Link
          href="/settings/profile"
          className="btn-outline w-full h-10 gap-2 inline-flex"
        >
          <Settings className="h-4 w-4" />
          Edit Profile
        </Link>
      )}

      {viewMode === "lists" ? (
        listsLoading && userLists === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                {/* Cover strip */}
                <div className="h-16 skeleton" />
                <div className="p-4 space-y-3">
                  <div className="h-4 skeleton rounded w-2/3" />
                  <div className="h-3 skeleton rounded w-1/3" />
                  <div className="h-9 skeleton rounded-lg mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : listsForbidden ? (
          <PrivateListMessage listType="lists" userName={user.name} />
        ) : listsError ? (
          <div className="card p-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">{listsError}</p>
            <button
              onClick={() => {
                setUserLists(null);
                setListsError(null);
              }}
              className="btn-outline h-9 px-4 text-sm"
            >
              Retry
            </button>
          </div>
        ) : (userLists?.length ?? 0) === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-16">
            {isOwnProfile
              ? "You haven't created any watchlists yet"
              : `${user.name} hasn't created any public watchlists`}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(userLists ?? []).map((list) => (
                <ProfileListCard
                  key={list.id}
                  list={list}
                  isOwner={isOwnProfile}
                  cloning={cloningId === list.id}
                  onClone={async () => {
                    setCloningId(list.id);
                    try {
                      const result = await cloneWatchlist(list.id);
                      router.push(`/watchlist/${result.watchlist.id}`);
                    } catch {
                      // clone failed; keep button active
                    } finally {
                      setCloningId(null);
                    }
                  }}
                />
              ))}
            </div>
            {!isOwnProfile && (
              <p className="text-xs text-muted-foreground text-center">
                Use “Save a copy” to add a list to your account.
              </p>
            )}
          </div>
        )
      ) : viewMode === "following" || viewMode === "followers" ? (
        canViewLists ? (
          <UserListSection
            userId={userId}
            type={viewMode}
            emptyMessage={
              isOwnProfile
                ? viewMode === "following"
                  ? "You're not following anyone yet"
                  : "No one is following you yet"
                : viewMode === "following"
                  ? `${user.name} isn't following anyone yet`
                  : `No one is following ${user.name} yet`
            }
            currentUserId={currentUser?.userId ?? 0}
          />
        ) : (
          <PrivateListMessage listType={viewMode} userName={user.name} />
        )
      ) : !canViewPrivateContent && !isLoadingPreferences ? (
        <PrivateAccountMessage />
      ) : (
        <div className="space-y-4">
          {preferences ? (
            <PreferencesCard
              preferences={preferences}
              genreNames={genreNames}
              providerNames={providerNames}
            />
          ) : (
            <div className="card p-4">
              <div className="h-[150px] flex items-center justify-center">
                {preferencesForbidden || preferencesError ? (
                  <p className="text-sm text-muted-foreground">
                    This account is private
                  </p>
                ) : (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
          )}

          {canViewPrivateContent && topLikedPosts.length > 0 && (
            <TopLikedPostsGrid posts={topLikedPosts} />
          )}
        </div>
      )}

      <div className="h-2" />
    </div>
  );
}

function ProfileListCard({
  list,
  isOwner,
  cloning,
  onClone,
}: {
  list: Watchlist;
  isOwner: boolean;
  cloning: boolean;
  onClone: () => void;
}) {
  return (
    <div className="card overflow-hidden">
      <Link href={`/watchlist/${list.id}`} className="block group">
        <div
          className="h-16"
          style={{
            background: `linear-gradient(135deg, ${list.coverColor ?? "#1565C0"}, ${
              list.coverColor ?? "#1565C0"
            }99)`,
          }}
        />
        <div className="p-4 space-y-1">
          <p className="font-semibold truncate group-hover:text-primary transition-colors flex items-center gap-2">
            {list.name}
            {list.isPublic ? (
              <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
            ) : (
              <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
            )}
          </p>
          {list.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {list.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {list.itemCount} {list.itemCount === 1 ? "item" : "items"}
          </p>
        </div>
      </Link>
      {!isOwner && (
        <div className="px-4 pb-4">
          <button
            onClick={onClone}
            disabled={cloning}
            className="btn-outline w-full h-9 text-xs inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {cloning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Save a copy
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function StatButton({
  count,
  label,
  selected,
  onClick,
}: {
  count: number;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg px-4 py-2 text-center transition-colors",
        selected ? "bg-accent" : "hover:bg-accent/50"
      )}
    >
      <span className="block text-xl font-bold leading-tight">{count}</span>
      <span className="block text-xs text-muted-foreground">{label}</span>
    </button>
  );
}

function UserListSection({
  userId,
  type,
  emptyMessage,
  currentUserId,
}: {
  userId: number | undefined;
  type: "following" | "followers";
  emptyMessage: string;
  currentUserId: number;
}) {
  const { data: users, isLoading } = useFollowList(userId ?? 0, type);

  return (
    <div className="card p-4">
      {isLoading ? (
        <div className="h-[200px] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !users || users.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground text-center">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div>
          {users.map((listUser, index) => (
            <div key={listUser.userId}>
              <UserListItem
                user={listUser}
                isCurrentUser={listUser.userId === currentUserId}
              />
              {index < users.length - 1 && (
                <div className="border-t border-border my-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UserListItem({
  user,
  isCurrentUser,
}: {
  user: FollowingUser;
  isCurrentUser: boolean;
}) {
  return (
    <Link
      href={`/user/${user.username}`}
      className="flex items-center gap-3 py-2 hover:bg-accent/50 transition-colors rounded-lg px-1 -mx-1"
    >
      <Image
        src={userAvatarUrl(user.userId, 96)}
        alt={user.name}
        width={48}
        height={48}
        className="rounded-full object-cover shrink-0 bg-muted"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{user.name}</p>
        <p className="text-sm text-muted-foreground truncate">
          @{user.username}
        </p>
      </div>
      {isCurrentUser && (
        <span className="text-xs font-medium text-primary">You</span>
      )}
    </Link>
  );
}

function PreferencesCard({
  preferences: prefs,
  genreNames,
  providerNames,
}: {
  preferences: NonNullable<ReturnType<typeof useUserProfileData>["preferences"]>;
  genreNames: string[];
  providerNames: string[];
}) {
  const genreChips = (prefs.genreIds ?? []).map((id, i) => ({
    id,
    name: genreNames[i] ?? FALLBACK_GENRE_NAMES[id] ?? `Genre ${id}`,
  }));

  const providerChips = (prefs.subscriptions ?? []).map((id, i) => ({
    id,
    name: providerNames[i] ?? FALLBACK_PROVIDER_NAMES[id] ?? `Service ${id}`,
  }));

  const recentDateDisplay =
    prefs.recentDate === "CURRENT" ? "Up to Today" : prefs.recentDate?.slice(0, 4);
  const oldestDateDisplay = prefs.oldestDate?.slice(0, 4);

  const contentRatingLabel = CONTENT_RATING_LABELS[prefs.contentRatingAge ?? 99];

  return (
    <div className="card p-4 space-y-3">
      <h2 className="text-lg font-bold">Preferences</h2>

      <PreferenceRow label="Language:" value={getLanguageName(prefs.language)} />
      <PreferenceRow label="Region:" value={getCountryName(prefs.region)} />
      <PreferenceRow
        label="Movie Length:"
        value={`${prefs.minMovie ?? 0} - ${prefs.maxMovie ?? 300} min`}
      />
      <PreferenceRow
        label="TV Length:"
        value={`${prefs.minTv ?? 0} - ${prefs.maxTv ?? 120} min`}
      />
      <PreferenceRow
        label="Release Year Range:"
        value={`${oldestDateDisplay} - ${recentDateDisplay}`}
      />
      <PreferenceRow label="Content Rating:" value={contentRatingLabel} />

      {genreChips.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Genres:</p>
          <div className="flex flex-wrap gap-2">
            {genreChips.map((chip) => (
              <span
                key={chip.id}
                className="text-xs text-white px-3 py-1.5 rounded-md"
                style={{ backgroundColor: getGenreColor(chip.name) }}
              >
                {chip.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {providerChips.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Subscriptions:</p>
          <div className="flex flex-wrap gap-2">
            {providerChips.map((chip) => (
              <span
                key={chip.id}
                className="text-xs text-white px-3 py-1.5 rounded-md"
                style={{ backgroundColor: getProviderColorById(chip.id) }}
              >
                {chip.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PreferenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}

function TopLikedPostsGrid({ posts }: { posts: PostDto[] }) {
  const visible = posts.filter((p) => p.postId !== null);
  if (visible.length === 0) return null;

  return (
      <div className="card p-4">
        <h2 className="text-lg font-bold mb-3">Top Liked Posts</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
          {visible.map((post) => (
            <PosterGridItem key={post.postId} post={post} />
          ))}
        </div>
      </div>
  );
}

function PosterGridItem({ post }: { post: PostDto }) {
  const title = decodeHtmlEntities(post.title);
  return (
    <Link
      href={`/post/${post.postId}`}
      className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-muted ring-1 ring-border/60"
      title={title}
    >
      {post.posterPath ? (
        <Image
          src={tmdbImage(post.posterPath, "w342")}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform"
          sizes="(max-width: 640px) 30vw, 15vw"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Film className="h-7 w-7 text-muted-foreground/50" />
        </div>
      )}

      <span className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/50 flex items-center justify-center">
        <Info className="h-4 w-4 text-white" />
      </span>

      <span className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-1">
        <span className="block text-[10px] text-white text-center truncate">
          {title}
        </span>
      </span>
    </Link>
  );
}

function PrivateAccountMessage() {
  return (
    <div className="card p-8 text-center space-y-4">
      <Lock className="h-16 w-16 mx-auto text-muted-foreground/60" />
      <p className="font-bold">This Account is Private</p>
      <p className="text-sm text-muted-foreground">
        Follow this account to see their preferences and posts
      </p>
    </div>
  );
}

function PrivateListMessage({
  listType,
  userName,
}: {
  listType: string;
  userName: string;
}) {
  const capitalized = listType.charAt(0).toUpperCase() + listType.slice(1);
  return (
    <div className="card p-8 text-center space-y-4">
      <Lock className="h-12 w-12 mx-auto text-muted-foreground/60" />
      <p className="font-bold">{capitalized} Hidden</p>
      <p className="text-sm text-muted-foreground">
        Follow {userName} to see who they&apos;re {listType}
      </p>
    </div>
  );
}

const CONTENT_RATING_LABELS: Record<number, string> = {
  0: "Kids (Ages 0+)",
  7: "Family (Ages 7+)",
  13: "Teen (Ages 13+)",
  17: "Mature (Ages 17+)",
  99: "All (No filter)",
};

const FALLBACK_GENRE_NAMES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const FALLBACK_PROVIDER_NAMES: Record<number, string> = {
  8: "Netflix",
  1796: "Netflix",
  9: "Amazon Prime Video",
  10: "Amazon Video",
  119: "Amazon Prime Video",
  15: "Hulu",
  337: "Disney+",
  384: "HBO Max",
  1899: "Max",
  350: "Apple TV+",
  386: "Peacock",
  387: "Peacock Premium",
  531: "Paramount+",
  283: "Crunchyroll",
  2: "Apple iTunes",
  3: "Google Play Movies",
  37: "Showtime",
  43: "Starz",
  188: "YouTube Premium",
  192: "YouTube",
  207: "Roku Channel",
  257: "fuboTV",
  258: "Criterion Channel",
  300: "Pluto TV",
  390: "Discovery+",
  422: "Acorn TV",
  426: "AMC+",
  433: "MGM+",
  444: "Tubi",
  453: "BritBox",
  582: "Plex",
  613: "Freevee",
};

function getLanguageName(isoCode: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(isoCode) ?? isoCode;
  } catch {
    return isoCode;
  }
}

function getCountryName(isoCode: string): string {
  try {
    return (
      new Intl.DisplayNames(["en"], { type: "region" }).of(isoCode.toUpperCase()) ??
      isoCode
    );
  } catch {
    return isoCode;
  }
}
