import api from './axios';
import type { ApiResponse, Tweet, User } from '../types';

export const searchAll = async (query: string): Promise<ApiResponse<{users: User[], tweets: Tweet[]}>> => {
  const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
  return data;
};

export const getTrending = async (): Promise<ApiResponse<any>> => {
  const { data } = await api.get('/trending');
  return data;
};
