import api from './axios';
import type { PaginatedResponse, Notification } from '../types';

export const getNotifications = async (page = 1): Promise<PaginatedResponse<Notification>> => {
  const { data } = await api.get(`/notifications?page=${page}`);
  return data;
};

export const markNotificationsAsRead = async () => {
  const { data } = await api.post('/notifications/read-all');
  return data;
};

export const getUnreadCount = async (): Promise<{count: number}> => {
  const { data } = await api.get('/notifications/unread-count');
  return data;
};
