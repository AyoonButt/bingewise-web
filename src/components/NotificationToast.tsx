"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import { usePushToastStore } from "@/stores/push-toast-store";
import { isPostNotification } from "@/types/notification";
import { resolvePostNotificationHref } from "@/lib/notification-navigation";

const TOAST_DURATION_MS = 6000;

export function NotificationToastHost() {
  const { toasts, dismiss } = usePushToastStore();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <NotificationToast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          referenceId={toast.referenceId}
          contentId={toast.contentId}
          senderName={toast.senderName}
          mediaType={toast.mediaType}
          onDismiss={dismiss}
        />
      ))}
    </div>
  );
}

function NotificationToast({
  id,
  type,
  title,
  message,
  referenceId,
  contentId,
  senderName,
  mediaType,
  onDismiss,
}: {
  id: number;
  type: string;
  title: string;
  message: string;
  referenceId: number;
  contentId?: number;
  senderName: string;
  mediaType?: string;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const router = useRouter();

  let href: string | null = null;
  if (isPostNotification(type)) {
    if (contentId && contentId > 0) {
      const typeParam = mediaType === "movie" ? "movie" : "tv";
      href = `/post/${contentId}?type=${typeParam}`;
    } else if (referenceId > 0) {
      href = `/activity/item/${referenceId}`;
    } else {
      href = null;
    }
  } else if (type === "MESSAGE" || type.startsWith("FOLLOW") || type === "NEW_FOLLOWER") {
    href = `/user/${senderName}`;
  } else {
    href = null;
  }

  // Content taps always open poster detail: resolve the referenced post to its
  // tmdbId/type when the notification payload doesn't carry one.
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onDismiss(id);
    if (!href) return;
    const fallback = href;
    if (isPostNotification(type)) {
      e.preventDefault();
      resolvePostNotificationHref({ referenceId, contentId, mediaType }).then(
        (target) => {
          router.push(target ?? fallback);
        }
      );
    }
  };

  return (
    <div className="pointer-events-auto card p-3 shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Bell className="h-4 w-4 text-primary" />
      </div>
      {href ? (
        <Link
          href={href}
          onClick={handleClick}
          className="flex-1 min-w-0 block"
        >
          <NotificationContent title={title} message={message} />
        </Link>
      ) : (
        <div className="flex-1 min-w-0">
          <NotificationContent title={title} message={message} />
        </div>
      )}
      <button
        onClick={() => onDismiss(id)}
        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function NotificationContent({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <>
      <p className="text-sm font-medium truncate">{title}</p>
      <p className="text-xs text-muted-foreground line-clamp-2">{message}</p>
    </>
  );
}