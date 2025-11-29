import api from './axios';

export interface Announcement {
  _id: string;
  title: string;
  description: string;
  photo?: string;
  createdBy: {
    _id: string;
    name: string;
    role: string;
  };
  target: 'all' | 'blockA' | 'blockB' | 'blockC';
  priority: boolean;
  category: string;
  createdAt: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  description: string;
  photo?: string;
  target: 'all' | 'blockA' | 'blockB' | 'blockC';
  priority?: boolean;
  category?: string;
}

export const announcementsApi = {
  getAll: (params?: { category?: string; priority?: string }) =>
    api.get<Announcement[]>('/announcements', { params }),
  getById: (id: string) => api.get<Announcement>(`/announcements/${id}`),
  create: (data: CreateAnnouncementRequest) => api.post<Announcement>('/announcements', data),
};



