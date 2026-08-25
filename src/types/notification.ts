export type NotificationType =
  | "REPLY"
  | "FOLLOW"
  | "FOLLOW_REQUEST"
  | "FOLLOW_REQUEST_ACCEPTED"
  | "NEW_FOLLOWER"
  | "SHARE"
  | "UPCOMING_RELEASE"
  | "SEQUEL_RELEASE"
  | "NEW_COLLECTION_MOVIE"
  | "NEW_SEASON"
  | "SHOW_STATUS_CHANGE"
  | "NEW_FRANCHISE_SHOW"
   | "STREAMING_AVAILABLE"
   | "WATCHLIST_SHARE"
   | "MESSAGE"
  | "comment"
  | "follow"
  | "share"
  | "new_release";

export interface NotificationEntity {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  referenceId: number;
  contentId: number;
  senderName: string;
  senderUserId: number | null;
  posterUrl: string | null;
  read: boolean;
  createdAt: number;
}

export interface NotificationHistoryResponse {
  notifications: NotificationEntity[];
  totalCount: number;
  unreadCount: number;
  page: number;
  pageSize: number;
}

export interface UnreadCountResponse {
  count: number;
  timestamp: number;
}

export const POST_NOTIFICATION_TYPES = [
  "REPLY",
  "SHARE",
  "UPCOMING_RELEASE",
  "SEQUEL_RELEASE",
  "NEW_COLLECTION_MOVIE",
  "NEW_SEASON",
  "SHOW_STATUS_CHANGE",
  "NEW_FRANCHISE_SHOW",
  "STREAMING_AVAILABLE",
  "comment",
  "share",
  "new_release",
] as const;

export function isPostNotification(type: string): boolean {
  return (POST_NOTIFICATION_TYPES as readonly string[]).includes(type);
}