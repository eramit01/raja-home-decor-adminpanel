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
};
