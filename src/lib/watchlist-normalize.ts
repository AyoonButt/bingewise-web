import type {
  Watchlist,
  WatchlistDetailResponse,
  WatchlistItem,
  WatchlistCollaborator,
} from "@/types/watchlist";

/**
 * Pure DTO → domain mapping shared by the client API layer (lib/watchlist.ts)
 * and the server-rendered SEO pages (lib/watchlist-server.ts). It never
 * imports browser-only modules so it can run on the server for SSR.
 */

export interface WatchlistDTO
  extends Omit<Watchlist, "isPublic" | "isOwner" | "collaboratorCount"> {
  isPublic?: boolean;
  isOwner?: boolean;
  public?: boolean;
  owner?: boolean;
  collaboratorCount?: number;
}

export interface WatchlistDetailDTO {
  watchlist: WatchlistDTO;
  items: WatchlistItem[];
  collaborators?: WatchlistCollaborator[];
}

export function normalizeWatchlist(dto: WatchlistDTO): Watchlist {
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

export function normalizeWatchlists(dtos: WatchlistDTO[]): Watchlist[] {
  return dtos.map(normalizeWatchlist);
}

export function normalizeDetail(dto: WatchlistDetailDTO): WatchlistDetailResponse {
  return {
    watchlist: normalizeWatchlist(dto.watchlist),
    items: dto.items,
    collaborators: dto.collaborators ?? [],
  };
}