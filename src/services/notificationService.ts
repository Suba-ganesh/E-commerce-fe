import { api } from './api';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface NotificationListResponse {
  success: boolean;
  message: string;
  data: {
    notifications: Notification[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  };
}

export interface UnreadCountResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
  };
}

export interface NotificationStatsResponse {
  success: boolean;
  message: string;
  data: {
    total: number;
    unread: number;
  };
}

export const notificationService = {
  // ─── User-facing ──────────────────────────────────────────
  getMyNotifications: (params?: { page?: number; limit?: number; unread_only?: boolean }) =>
    api.get<NotificationListResponse>('/notifications', { params: params as Record<string, string> }),

  getUnreadCount: () =>
    api.get<UnreadCountResponse>('/notifications/unread-count'),

  markAsRead: (ids: string[]) =>
    api.patch<any>('/notifications/mark-read', { ids }),

  markAllAsRead: () =>
    api.patch<any>('/notifications/mark-all-read'),

  deleteNotification: (id: string) =>
    api.delete<any>(`/notifications/${id}`),

  deleteAllNotifications: () =>
    api.delete<any>('/notifications'),

  // ─── Admin ────────────────────────────────────────────────
  getAdminNotifications: (params?: { page?: number; limit?: number; search?: string; unread_only?: boolean; user_id?: string }) =>
    api.get<NotificationListResponse>('/notifications/admin/all', { params: params as Record<string, string> }),

  getAdminStats: () =>
    api.get<NotificationStatsResponse>('/notifications/admin/stats'),

  adminCreateNotification: (data: { user_id?: string; title: string; message?: string; broadcast?: boolean }) =>
    api.post<any>('/notifications/admin/create', data),

  adminDeleteNotification: (id: string) =>
    api.delete<any>(`/notifications/admin/${id}`),
};

export default notificationService;