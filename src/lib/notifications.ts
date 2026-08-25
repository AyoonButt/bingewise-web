import { apiClient } from "./api-client";
import type {
  NotificationHistoryResponse,
  UnreadCountResponse,
} from "@/types/notification";

export async function getNotificationHistory(
  userId: number,
  page: number,
  pageSize = 20
): Promise<NotificationHistoryResponse> {
  return apiClient<NotificationHistoryResponse>(
    `/api/notifications/user/${userId}/history?page=${page}&size=${pageSize}`
  );
}

export async function getUnreadCount(userId: number): Promise<UnreadCountResponse> {
  return apiClient<UnreadCountResponse>(
    `/api/notifications/user/${userId}/unread-count`
  );
}

export async function markNotificationAsRead(id: number): Promise<void> {
  await apiClient(`/api/notifications/${id}/read`, {
    method: "PUT",
  });
}

export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  await apiClient(`/api/notifications/user/${userId}/read-all`, {
    method: "PUT",
  });
}

export async function deleteNotification(id: number): Promise<void> {
  await apiClient(`/api/notifications/${id}`, { method: "DELETE" });
}