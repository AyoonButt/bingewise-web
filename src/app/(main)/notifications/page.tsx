"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { useNotifications } from "@/hooks/use-notifications";
import { apiClient } from "@/lib/api-client";
import { removePendingFollowRequest } from "@/hooks/use-user-profile";
import {
  Bell,
  BellOff,
  CalendarClock,
  CheckCheck,
  ChevronLeft,
  Film,
  List,
  Loader2,
  MessageCircle,
  RefreshCw,
  Share2,
  Sparkles,
  Tv,
  User,
  UserPlus,
} from "lucide-react";
import { isPostNotification } from "@/types/notification";
import type { NotificationEntity } from "@/types/notification";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, { icon: typeof Bell; className: string }> = {
  REPLY: { icon: MessageCircle, className: "bg-blue-500/10 text-blue-500" },
  FOLLOW_REQUEST: { icon: UserPlus, className: "bg-orange-500/10 text-orange-500" },
  FOLLOW_REQUEST_ACCEPTED: { icon: UserPlus, className: "bg-green-500/10 text-green-500" },
  NEW_FOLLOWER: { icon: User, className: "bg-green-500/10 text-green-500" },
  SHARE: { icon: Share2, className: "bg-purple-500/10 text-purple-500" },
  UPCOMING_RELEASE: { icon: CalendarClock, className: "bg-green-500/10 text-green-500" },
  SEQUEL_RELEASE: { icon: Sparkles, className: "bg-purple-500/10 text-purple-500" },
  NEW_SEASON: { icon: Tv, className: "bg-indigo-500/10 text-indigo-500" },
  STREAMING_AVAILABLE: { icon: Film, className: "bg-cyan-500/10 text-cyan-500" },
  WATCHLIST_SHARE: { icon: List, className: "bg-amber-500/10 text-amber-500" },
  MESSAGE: { icon: MessageCircle, className: "bg-pink-500/10 text-pink-500" },
};

function notificationHref(notification: NotificationEntity): string | null {
  // Shared watchlists: posterUrl carries the relative link (incl. secret
  // share token) so recipients land straight into the list.
  if (
    notification.type === "WATCHLIST_SHARE" &&
    notification.posterUrl?.startsWith("/")
  ) {
    return notification.posterUrl;
  }
  if (isPostNotification(notification.type) && notification.referenceId > 0) {
    return `/post/${notification.referenceId}`;
  }
  // Follow-type notifications: senderName is a display name, not a username.
  // The app embeds the username in the message ("Jane (@jane) started following you"),
  // so extract it from there; otherwise don't link (there is no user-by-ID endpoint).
  const match = notification.message.match(/@([A-Za-z0-9._-]+)/);
  if (match) {
    return `/user/${match[1]}`;
  }
  return null;
}

function NotificationItem({
  notification,
  onClick,
  onAcceptRequest,
  onRejectRequest,
  requestState,
}: {
  notification: NotificationEntity;
  onClick: () => void;
  onAcceptRequest?: (notification: NotificationEntity) => void;
  onRejectRequest?: (notification: NotificationEntity) => void;
  requestState?: "idle" | "accepting";
}) {
  const typeConfig = TYPE_ICONS[notification.type] ?? {
    icon: Bell,
    className: "bg-primary/10 text-primary",
  };
  const Icon = typeConfig.icon;
  const href =
    notification.type === "FOLLOW_REQUEST" ? null : notificationHref(notification);

  const content = (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
          typeConfig.className
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{notification.title}</p>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        {/* Inline accept/reject for follow requests (mobile parity) */}
        {notification.type === "FOLLOW_REQUEST" &&
          !notification.read &&
          onAcceptRequest &&
          onRejectRequest && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAcceptRequest(notification);
                }}
                disabled={requestState === "accepting"}
                className="inline-flex items-center gap-1 h-7 px-3 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {requestState === "accepting" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3 w-3" />
                )}
                Accept
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRejectRequest(notification);
                }}
                disabled={requestState === "accepting"}
                className="inline-flex items-center h-7 px-3 rounded-full text-xs font-medium border border-border hover:bg-accent disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          )}
      </div>
      {!notification.read && (
        <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
      )}
    </div>
  );

  const classes = cn(
    "block w-full text-left p-4 hover:bg-accent/50 transition-colors",
    !notification.read && "bg-primary/[0.03]"
  );

  return href ? (
    <Link href={href} onClick={onClick} className={classes}>
      {content}
    </Link>
  ) : (
    <button onClick={onClick} className={classes}>
      {content}
    </button>
  );
}

export default function NotificationsPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const {
    notifications,
    totalCount,
    unreadCount,
    loadMore,
    refresh,
    isLoading,
    isFetchingNextPage,
    isRefreshing,
    hasNextPage,
    markAsRead,
    markAllRead,
    isMarkingAll,
  } = useNotifications(user?.userId);

  const handleClick = useCallback(
    (notification: NotificationEntity) => {
      markAsRead(notification);
    },
    [markAsRead]
  );

  // When a sent request is accepted, clear the local pending flag for that user.
  useEffect(() => {
    notifications.forEach((n) => {
      if (n.type === "FOLLOW_REQUEST_ACCEPTED" && n.senderUserId) {
        removePendingFollowRequest(n.senderUserId);
      }
    });
  }, [notifications]);

  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  const handleAcceptRequest = useCallback(
    async (notification: NotificationEntity) => {
      const me = useAuthStore.getState().user;
      const requesterId = notification.senderUserId;
      if (!me || !requesterId) return;
      setAcceptingId(notification.id);
      try {
        // Create the follow edge, then notify the requester (mobile parity).
        await apiClient(`/api/users/${me.userId}/following/${requesterId}`, {
          method: "POST",
        });
        await apiClient("/api/notifications/send", {
          method: "POST",
          body: JSON.stringify({
            userId: requesterId,
            type: "FOLLOW_REQUEST_ACCEPTED",
            title: "Follow request accepted",
            message: `${me.name || me.username} (@${me.username}) accepted your follow request`,
            referenceId: me.userId,
            contentId: me.userId,
            senderName: me.name || me.username,
            senderUserId: me.userId,
          }),
        }).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ["followStats"] });
        markAsRead(notification);
      } finally {
        setAcceptingId(null);
      }
    },
    [markAsRead, queryClient]
  );

  const handleRejectRequest = useCallback(
    (notification: NotificationEntity) => {
      // Rejection is silent — no notification sent (mobile parity).
      markAsRead(notification);
    },
    [markAsRead]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/feed"
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-xl font-bold tracking-tight flex-1">Notifications</h2>
        <button
          onClick={() => refresh()}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label="Refresh notifications"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        </button>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            disabled={isMarkingAll}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-80 disabled:opacity-50 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            {isMarkingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-4 skeleton w-1/3" />
                <div className="h-3 skeleton w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-muted mx-auto flex items-center justify-center">
            <BellOff className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No notifications yet</p>
          <p className="text-xs text-muted-foreground">
            Replies, follows, shares and release alerts will show up here
          </p>
        </div>
      ) : (
        <>
          <div className="card divide-y divide-border">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleClick(notification)}
                onAcceptRequest={handleAcceptRequest}
                onRejectRequest={handleRejectRequest}
                requestState={
                  acceptingId === notification.id ? "accepting" : "idle"
                }
              />
            ))}
          </div>

          {hasNextPage && (
            <button
              onClick={loadMore}
              disabled={isFetchingNextPage}
              className="btn-outline w-full h-10"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load more"
              )}
            </button>
          )}

          {!hasNextPage && notifications.length > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              {totalCount} notification{totalCount === 1 ? "" : "s"} total
            </p>
          )}
        </>
      )}
    </div>
  );
}