export interface Watchlist {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  coverColor: string | null;
  isPublic: boolean;
  isOwner: boolean;
  ownerId: number;
  ownerUsername: string | null;
  ownerName: string | null;
  ownerAvatarUrl: string | null;
  itemCount: number;
  collaboratorCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface WatchlistItem {
  id: number;
  watchlistId: number;
  tmdbId: number;
  mediaType: string;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string | null;
  releaseYear: number | null;
  addedAt: number;
  addedBy: number | null;
}

export interface WatchlistCollaborator {
  userId: number;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  addedBy: number | null;
  addedAt: number;
}

export interface WatchlistDetailResponse {
  watchlist: Watchlist;
  items: WatchlistItem[];
  collaborators: WatchlistCollaborator[];
}

export interface CreateWatchlistRequest {
  name: string;
  description?: string | null;
  coverColor?: string | null;
  isPublic?: boolean;
}

export interface UpdateWatchlistRequest {
  name?: string;
  description?: string | null;
  coverColor?: string | null;
  isPublic?: boolean;
}

export interface AddWatchlistItemRequest {
  tmdbId: number;
  mediaType: string;
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  overview?: string | null;
  releaseYear?: number | null;
}

export interface WatchlistShareInfo {
  watchlistId: number;
  name: string;
  deepLink: string;
  shareText: string;
}

export interface CloneWatchlistResult {
  watchlist: Watchlist;
  addedItems: number;
  alreadyPresent: number;
}
