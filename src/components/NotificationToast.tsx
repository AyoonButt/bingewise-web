"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { usePushToastStore } from "@/stores/push-toast-store";
import { isPostNotification } from "@/types/notification";

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
          senderName={toast.senderName}
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
  senderName,
  onDismiss,
}: {
  id: number;
  type: string;
  title: string;
  message: string;
  referenceId: number;
  senderName: string;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const href = isPostNotification(type) && referenceId
    ? `/post/${referenceId}`
    : type === "MESSAGE" || type.startsWith("FOLLOW") || type === "NEW_FOLLOWER"
      ? `/user/${senderName}`
      : null;

  return (
    <div className="pointer-events-auto card p-3 shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Bell className="h-4 w-4 text-primary" />
      </div>
      {href ? (
        <Link
          href={href}
          onClick={() => onDismiss(id)}
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