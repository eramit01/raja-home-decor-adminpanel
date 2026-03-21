import { api } from './api';

export const adminService = {
  getDashboardStats: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/admin/dashboard', { params });
    return response.data;
  },
};
