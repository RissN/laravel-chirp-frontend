import api from './axios';
import type { ApiResponse, PaginatedResponse, User, Tweet } from '../types';

export const getUserProfile = async (username: string): Promise<ApiResponse<User>> => {
  const { data } = await api.get(`/users/${username}`);
  return data;
};

export const getUserTweets = async (username: string, page = 1): Promise<PaginatedResponse<Tweet>> => {
  const { data } = await api.get(`/users/${username}/tweets?page=${page}`);
  return data;
};

export const getUserLikes = async (username: string, page = 1): Promise<PaginatedResponse<Tweet>> => {
  const { data } = await api.get(`/users/${username}/likes?page=${page}`);
  return data;
};

export const toggleFollowUser = async (username: string): Promise<ApiResponse<{is_following: boolean}>> => {
  const { data } = await api.post(`/users/${username}/follow`);
  return data;
};

export const getUserFollowers = async (username: string, page = 1): Promise<PaginatedResponse<User>> => {
  const { data } = await api.get(`/users/${username}/followers?page=${page}`);
  return data;
};

export const getUserFollowing = async (username: string, page = 1): Promise<PaginatedResponse<User>> => {
  const { data } = await api.get(`/users/${username}/following?page=${page}`);
  return data;
};

export const updateProfile = async (profileData: any): Promise<ApiResponse<User>> => {
  const { data } = await api.put('/users/profile', profileData);
  return data;
};

export const updateSettings = async (settingsData: any): Promise<ApiResponse<User>> => {
  const { data } = await api.put('/users/settings', settingsData);
  return data;
};

export const getSuggestedUsers = async (): Promise<ApiResponse<User[]>> => {
  const { data } = await api.get('/users/suggestions');
  return data;
};
