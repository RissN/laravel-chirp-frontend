import api from './axios';
import type { PaginatedResponse, Tweet } from '../types';

export const getBookmarks = async (page = 1): Promise<PaginatedResponse<Tweet>> => {
  const { data } = await api.get(`/bookmarks?page=${page}`);
  return data;
};
