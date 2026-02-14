import { api } from './api';

export const authService = {
  sendOTP: async (data: { phone: string }) => {
    const response = await api.post('/auth/send-otp', data);
    return response.data;
  },

  verifyOTP: async (data: { phone: string; otp: string }) => {
    const response = await api.post('/auth/verify-otp', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  updateProfile: async (data: {
    name?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string
  }) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },
};
