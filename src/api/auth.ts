import api from './axios';
import type { ApiResponse, User } from '../types';

export const login = async (credentials: any): Promise<ApiResponse<{user: User; token: string}>> => {
  const { data } = await api.post('/auth/login', credentials);
  return data;
};

export const register = async (userData: any): Promise<ApiResponse<{user: User; token: string}>> => {
  const { data } = await api.post('/auth/register', userData);
  return data;
};

export const logout = async (): Promise<ApiResponse<null>> => {
  const { data } = await api.post('/auth/logout');
  return data;
};

export const getMe = async (): Promise<ApiResponse<User>> => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const updateProfile = async (userData: any): Promise<ApiResponse<User>> => {
  const { data } = await api.put('/users/profile', userData);
  return data;
};
