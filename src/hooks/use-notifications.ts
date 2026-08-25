"use client";

import { useCallback, useEffect } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotificationHistory,
  getUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/notifications";
import { useUnreadStore } from "@/stores/unread-store";
import type { NotificationEntity, NotificationHistoryResponse } from "@/types/notification";

const HISTORY_PAGE_SIZE = 20;

interface NotificationsPages {
  pages: NotificationHistoryResponse[];
  pageParams: number[];
}

export function useNotifications(userId?: number) {
  const queryClient = useQueryClient();
  const { setCount } = useUnreadStore();

  const query = useInfiniteQuery({
    queryKey: ["notifications", userId],
    queryFn: async ({ pageParam }) => {
      if (!userId) throw new Error("No user");
      return getNotificationHistory(userId, pageParam, HISTORY_PAGE_SIZE);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const loaded = (lastPage.page + 1) * lastPage.pageSize;
      return loaded < lastPage.totalCount ? lastPage.page + 1 : undefined;
    },
    enabled: !!userId,
  });

  const notifications: NotificationEntity[] =
    query.data?.pages.flatMap((p) => p.notifications ?? []) ?? [];

  useEffect(() => {
    const unread = query.data?.pages[0]?.unreadCount;
    if (typeof unread === "number") setCount(unread);
  }, [query.data, setCount]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query]);

  const refresh = useCallback(() => {
    query.refetch();
  }, [query]);

  const markAsRead = useMutation({
    mutationFn: async (notification: NotificationEntity) => {
      if (notification.read) return;
      await markNotificationAsRead(notification.id);
    },
    onMutate: async (notification) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", userId] });
      const previous = queryClient.getQueryData<NotificationsPages>([
        "notifications",
        userId,
      ]);
      queryClient.setQueryData<NotificationsPages>(["notifications", userId], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            unreadCount: Math.max(0, page.unreadCount - 1),
            notifications: page.notifications.map((n) =>
              n.id === notification.id ? { ...n, read: true } : n
            ),
          })),
        };
      });
      useUnreadStore.getState().setCount(Math.max(0, useUnreadStore.getState().count - 1));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications", userId], context.previous);
      }
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      await markAllNotificationsAsRead(userId);
    },
    onSuccess: () => {
      queryClient.setQueryData<NotificationsPages>(["notifications", userId], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            unreadCount: 0,
              notifications: page.notifications.map((n) => ({ ...n, read: true })),
          })),
        };
      });
      useUnreadStore.getState().setCount(0);
    },
  });

  return {
    notifications,
    totalCount: query.data?.pages[0]?.totalCount ?? 0,
    unreadCount: query.data?.pages[0]?.unreadCount ?? 0,
    loadMore,
    refresh,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    isRefreshing: query.isFetching && (query.data?.pages.length ?? 0) > 0,
    hasNextPage: query.hasNextPage,
    markAsRead: markAsRead.mutate,
    markAllRead: markAllRead.mutate,
    isMarkingAll: markAllRead.isPending,
  };
}

export function useUnreadCount(userId?: number) {
  const { setCount } = useUnreadStore();

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const data = await getUnreadCount(userId);
        if (active) setCount(data.count);
      } catch {
        // ignore
      }
    };
    load();
    const interval = setInterval(load, 60_000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [userId, setCount]);

  return useUnreadStore((s) => s.count);
}