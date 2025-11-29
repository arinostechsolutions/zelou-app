import api from './axios';

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  body: string;
  type: 
    | 'delivery'
    | 'delivery_retrieved'
    | 'reservation'
    | 'reservation_request'
    | 'reservation_approved'
    | 'reservation_rejected'
    | 'reservation_cancelled'
    | 'announcement'
    | 'report'
    | 'report_update'
    | 'visitor'
    | 'visitor_arrived'
    | 'document'
    | 'maintenance'
    | 'general';
  data: Record<string, any>;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  unreadCount: number;
}

export const notificationsApi = {
  // Listar notificações
  getAll: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get<NotificationsResponse>('/notifications', { params }),

  // Contar não lidas
  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count'),

  // Marcar como lida
  markAsRead: (id: string) =>
    api.put<Notification>(`/notifications/${id}/read`),

  // Marcar todas como lidas
  markAllAsRead: () =>
    api.put<{ message: string }>('/notifications/read-all'),

  // Excluir notificação
  delete: (id: string) =>
    api.delete<{ message: string }>(`/notifications/${id}`),

  // Excluir todas
  deleteAll: () =>
    api.delete<{ message: string }>('/notifications'),
};

