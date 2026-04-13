import adminApi from './adminAxios';

export const adminLogin = async (credentials: { email: string; password: string }) => {
  const { data } = await adminApi.post('/login', credentials);
  return data;
};

export const adminLogout = async () => {
  const { data } = await adminApi.post('/logout');
  return data;
};

export const getAdminMe = async () => {
  const { data } = await adminApi.get('/me');
  return data;
};

export const getDashboardStats = async () => {
  const { data } = await adminApi.get('/dashboard');
  return data;
};

export const getAdminUsers = async (params?: { q?: string; status?: string; page?: number }) => {
  const { data } = await adminApi.get('/users', { params });
  return data;
};

export const banUser = async (id: number, reason: string, duration?: number) => {
  const { data } = await adminApi.post(`/users/${id}/ban`, { reason, duration });
  return data;
};

export const suspendUser = async (id: number, reason: string, duration?: number) => {
  const { data } = await adminApi.post(`/users/${id}/suspend`, { reason, duration });
  return data;
};

export const unbanUser = async (id: number) => {
  const { data } = await adminApi.post(`/users/${id}/unban`);
  return data;
};

export const deleteUser = async (id: number) => {
  const { data } = await adminApi.delete(`/users/${id}`);
  return data;
};

export const getAdminTweets = async (params?: { q?: string; page?: number }) => {
  const { data } = await adminApi.get('/tweets', { params });
  return data;
};

export const deleteTweet = async (id: number) => {
  const { data } = await adminApi.delete(`/tweets/${id}`);
  return data;
};

export const getReports = async (params?: { status?: string; page?: number }) => {
  const { data } = await adminApi.get('/reports', { params });
  return data;
};

export const resolveReport = async (id: number, payload: { status: string; admin_note?: string }) => {
  const { data } = await adminApi.post(`/reports/${id}/resolve`, payload);
  return data;
};

export const getAuditLogs = async (params?: { page?: number }) => {
  const { data } = await adminApi.get('/logs', { params });
  return data;
};
