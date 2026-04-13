import api from './axios';
import type { ApiResponse } from '../types';

export const getConversations = async (): Promise<ApiResponse<any>> => {
  const { data } = await api.get('/conversations');
  return data;
};

export const getMessages = async (conversationId: number): Promise<ApiResponse<any>> => {
  const { data } = await api.get(`/conversations/${conversationId}/messages`);
  return data;
};

export const sendMessage = async (userId: number, content: string): Promise<ApiResponse<any>> => {
  const { data } = await api.post(`/conversations/${userId}/send`, { content });
  return data;
};

export const markAsRead = async (conversationId: number): Promise<ApiResponse<any>> => {
  const { data } = await api.post(`/conversations/${conversationId}/read`);
  return data;
};
