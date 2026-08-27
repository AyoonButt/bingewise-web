import { apiClient } from "./api-client";
import {
  notifyWatchlistChanged,
  notifyWatchlistsInvalidated,
} from "./watchlist-events";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiResponse } from "@/types/post";
import type {
  AddWatchlistItemRequest,
  CloneWatchlistResult,
  CreateWatchlistRequest,
  UpdateWatchlistRequest,
  Watchlist,
  WatchlistDetailResponse,
  WatchlistItem,
  WatchlistShareInfo,
  WatchlistCollaborator,
} from "@/types/watchlist";

interface WatchlistDTO extends Omit<Watchlist, "isPublic" | "isOwner" | "collaboratorCount"> {
  isPublic?: boolean;
  isOwner?: boolean;
  public?: boolean;
  owner?: boolean;
  collaboratorCount?: number;
}

interface WatchlistDetailDTO {
  watchlist: WatchlistDTO;
  items: WatchlistItem[];
  collaborators?: WatchlistCollaborator[];
}

interface CloneWatchlistDTO {
  watchlist: WatchlistDTO;
  addedItems: number;
  alreadyPresent: number;
}

function normalizeWatchlist(dto: WatchlistDTO): Watchlist {
  return {
    id: dto.id,
    userId: dto.userId,
    name: dto.name,
    description: dto.description ?? null,
    coverColor: dto.coverColor ?? null,
    isPublic: dto.isPublic ?? dto.public ?? false,
    isOwner: dto.isOwner ?? dto.owner ?? false,
    ownerId: dto.ownerId,
    ownerUsername: dto.ownerUsername ?? null,
    ownerName: dto.ownerName ?? null,
    ownerAvatarUrl: dto.ownerAvatarUrl ?? null,
    itemCount: dto.itemCount,
    collaboratorCount: dto.collaboratorCount ?? 0,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function normalizeWatchlists(dtos: WatchlistDTO[]): Watchlist[] {
  return dtos.map(normalizeWatchlist);
}

function normalizeDetail(dto: WatchlistDetailDTO): WatchlistDetailResponse {
  return {
    watchlist: normalizeWatchlist(dto.watchlist),
    items: dto.items,
    collaborators: dto.collaborators ?? [],
  };
}

function toWriteBody(
  data: CreateWatchlistRequest | UpdateWatchlistRequest
): Record<string, unknown> {
  const body: Record<string, unknown> = { ...data };
  if (data.isPublic !== undefined) {
    body.isPublic = data.isPublic;
    body.public = data.isPublic;
  }
  return body;
}

export function getWatchlists(userId: number): Promise<Watchlist[]> {
  return apiClient<WatchlistDTO[]>(`/api/watchlists?userId=${userId}`).then(
    normalizeWatchlists
  );
}

// In-flight + settled promise cache so repeated/concurrent calls for the same
// user share one request (guards against effect re-fire loops).
const userListPromises = new Map<number, Promise<Watchlist[]>>();

export async function getUserWatchlists(userId: number): Promise<Watchlist[]> {
  const existing = userListPromises.get(userId);
  if (existing) return existing;

  const promise = doFetchUserWatchlists(userId).catch((err: unknown) => {
    // Allow retry after failures.
    userListPromises.delete(userId);
    throw err;
  });
  userListPromises.set(userId, promise);
  return promise;
}

async function doFetchUserWatchlists(userId: number): Promise<Watchlist[]> {
  const doFetch = () => fetch(`/api/guest/watchlists/user/${userId}`);

  let res = await doFetch();

  // Expired access token: refresh once, then retry with the new cookie.
  if (res.status === 401) {
    const { getRefreshResult } = await import("./token-refresh");
    const refreshed = await getRefreshResult();
    if (refreshed.status === "ok") {
      res = await doFetch();
    }
  }

  if (!res.ok) {
    console.error("[watchlists] load failed:", res.status);
    throw new Error(res.status === 403 ? "403" : `Failed: ${res.status}`);
  }
  return normalizeWatchlists((await res.json()) as WatchlistDTO[]);
}

/** Drops the cached listing (e.g. after cloning/deleting) to force a refetch. */
export function invalidateUserWatchlists(userId: number): void {
  userListPromises.delete(userId);
}

/** Clears the signed-in user's cached collection and signals all views. */
export function invalidateCurrentUserWatchlists(): void {
  const uid = useAuthStore.getState().user?.userId;
  if (uid) invalidateUserWatchlists(uid);
  notifyWatchlistsInvalidated();
}

export function getPublicWatchlists(
  q?: string,
  limit?: number
): Promise<Watchlist[]> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  // Public data — served through the unauthenticated guest proxy so signed-out
  // visitors can browse the discovery feed.
  return fetch(`/api/guest/watchlists${qs ? `?${qs}` : ""}`).then(async (r) => {
    if (!r.ok) throw new Error("Failed to load public watchlists");
    return normalizeWatchlists((await r.json()) as WatchlistDTO[]);
  });
}

export function createWatchlist(
  data: CreateWatchlistRequest
): Promise<Watchlist> {
  return apiClient<WatchlistDTO>("/api/watchlists", {
    method: "POST",
    body: JSON.stringify(toWriteBody(data)),
  }).then((dto) => {
    const watchlist = normalizeWatchlist(dto);
    notifyWatchlistChanged(watchlist.id);
    return watchlist;
  });
}

export function getWatchlistDetail(
  watchlistId: number,
  shareToken?: string | null
): Promise<WatchlistDetailResponse> {
  // Optional-auth route: guests can view public lists signed-out; secret
  // share-link tokens (st) grant access to private shared lists.
  const qs = shareToken ? `?st=${encodeURIComponent(shareToken)}` : "";
  return fetch(`/api/guest/watchlists/${watchlistId}${qs}`).then(async (r) => {
    if (!r.ok) throw new Error("Failed to load watchlist");
    return normalizeDetail((await r.json()) as WatchlistDetailDTO);
  });
}

export function updateWatchlist(
  watchlistId: number,
  data: UpdateWatchlistRequest
): Promise<Watchlist> {
  return apiClient<WatchlistDTO>(`/api/watchlists/${watchlistId}`, {
    method: "PUT",
    body: JSON.stringify(toWriteBody(data)),
  }).then((dto) => {
    const watchlist = normalizeWatchlist(dto);
    notifyWatchlistChanged(watchlistId);
    return watchlist;
  });
}

export function deleteWatchlist(watchlistId: number): Promise<ApiResponse> {
  return apiClient<ApiResponse>(`/api/watchlists/${watchlistId}`, {
    method: "DELETE",
  }).then((res) => {
    notifyWatchlistChanged(watchlistId);
    // Collection changed — refresh My Lists everywhere.
    invalidateCurrentUserWatchlists();
    return res;
  });
}

export function addWatchlistItem(
  watchlistId: number,
  item: AddWatchlistItemRequest
): Promise<WatchlistItem> {
  return apiClient<WatchlistItem>(`/api/watchlists/${watchlistId}/items`, {
    method: "POST",
    body: JSON.stringify(item),
  }).then((created) => {
    notifyWatchlistChanged(watchlistId);
    return created;
  });
}

export function removeWatchlistItem(
  watchlistId: number,
  itemId: number
): Promise<ApiResponse> {
  return apiClient<ApiResponse>(
    `/api/watchlists/${watchlistId}/items/${itemId}`,
    { method: "DELETE" }
  ).then(async (res) => {
    notifyWatchlistChanged(watchlistId);
    return res;
  });
}

export function cloneWatchlist(
  watchlistId: number,
  shareToken?: string
): Promise<CloneWatchlistResult> {
  const qs = shareToken ? `?st=${encodeURIComponent(shareToken)}` : "";
  return apiClient<CloneWatchlistDTO>(
    `/api/watchlists/${watchlistId}/clone${qs}`,
    { method: "POST" }
  ).then(async (result) => {
    notifyWatchlistChanged(result.watchlist.id);
    // The clone adds a new list to the caller's collection — refresh any
    // mounted My Lists / profile-list views immediately.
    invalidateCurrentUserWatchlists();
    return { ...result, watchlist: normalizeWatchlist(result.watchlist) };
  });
}

export function getWatchlistShareInfo(
  watchlistId: number
): Promise<WatchlistShareInfo> {
  return apiClient<WatchlistShareInfo>(`/api/watchlists/${watchlistId}/share`);
}

// ── Collaborator management ──────────────────────────────────────────

export function getCollaborators(
  watchlistId: number
): Promise<WatchlistCollaborator[]> {
  return apiClient<WatchlistCollaborator[]>(
    `/api/watchlists/${watchlistId}/collaborators`
  );
}

export function addCollaborator(
  watchlistId: number,
  payload: { userId: number } | { username: string }
): Promise<WatchlistCollaborator> {
  return apiClient<WatchlistCollaborator>(
    `/api/watchlists/${watchlistId}/collaborators`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  ).then((result) => {
    notifyWatchlistChanged(watchlistId);
    // Refresh the cached "My Lists" collections so shared state stays accurate
    // for the owner and the newly-added collaborator.
    invalidateCurrentUserWatchlists();
    const addedUserId = "userId" in payload ? payload.userId : undefined;
    if (addedUserId) invalidateUserWatchlists(addedUserId);
    return result;
  });
}

export function removeCollaborator(
  watchlistId: number,
  userId: number
): Promise<ApiResponse> {
  return apiClient<ApiResponse>(
    `/api/watchlists/${watchlistId}/collaborators/${userId}`,
    { method: "DELETE" }
  ).then((res) => {
    notifyWatchlistChanged(watchlistId);
    // Drop the cached collections so the list no longer shows as shared after
    // the collaborator is removed. The owner's and the removed user's caches
    // are cleared so neither view keeps a stale "Shared by" entry.
    invalidateCurrentUserWatchlists();
    invalidateUserWatchlists(userId);
    return res;
  });
}
