import api from './axios';

export interface ReportPayload {
  reportable_id: number;
  reportable_type: 'tweet' | 'user';
  reason: string;
  description?: string;
}

export const createReport = async (payload: ReportPayload) => {
  const { data } = await api.post('/reports', payload);
  return data;
};
