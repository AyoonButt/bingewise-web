export interface UserDto {
  userId: number;
  name: string;
  username: string;
  email: string;
  language?: string;
  region?: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface FollowingUser {
  userId: number;
  username: string;
  name: string;
}

export interface FollowRecommendation {
  userId: number;
  username: string;
  name: string | null;
  mutualConnectionCount: number;
}

export interface FollowStats {
  userId: number;
  followingCount: number;
  followersCount: number;
}

export interface FollowingListResponse {
  success: boolean;
  following: FollowingUser[];
  count: number;
  message: string | null;
}

export interface FollowersListResponse {
  success: boolean;
  followers: FollowingUser[];
  count: number;
  message: string | null;
}

export interface FollowStatsResponse {
  success: boolean;
  stats: FollowStats | null;
  message: string | null;
}

export interface FollowStatusResponse {
  success: boolean;
  following: boolean;
  followedAt: unknown;
  message: string | null;
}

export interface FollowActionResponse {
  success: boolean;
  message: string;
  following: boolean;
}

export interface FollowRecommendationsResponse {
  success: boolean;
  recommendations: FollowRecommendation[];
  count: number;
  message: string | null;
}

export interface UserSearchResult {
  userId: number;
  username: string;
  name: string;
}

export interface UserSearchResponse {
  success: boolean;
  users: UserSearchResult[];
  count: number;
  message: string | null;
}

export interface PrivacyStatusResponse {
  success: boolean;
  isPrivate: boolean;
  message: string | null;
}

export interface UpdatePrivacyResponse {
  success: boolean;
  isPrivate: boolean;
  message: string | null;
}

export interface SessionDto {
  id: number;
  userId: number;
  deviceInfo: string | null;
  lastUpdated: number | null;
}
