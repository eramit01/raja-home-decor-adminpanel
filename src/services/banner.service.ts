import { api } from './api';

export interface Banner {
    id: string;
    _id?: string;
    title: string;
    image: string;
    link?: string;
    order: number;
    isActive: boolean;
    startDate?: string;
    endDate?: string;
}

export const BannerService = {
    getAllBanners: async () => {
        const response = await api.get('/banners/all'); // Backend Admin route
        return response.data.data.banners;
    },

    createBanner: async (data: any) => {
        const response = await api.post('/banners', data);
        return response.data.data.banner;
    },

    updateBanner: async (id: string, data: any) => {
        const response = await api.patch(`/banners/${id}`, data);
        return response.data.data.banner;
    },

    deleteBanner: async (id: string) => {
        const response = await api.delete(`/banners/${id}`);
        return response.data;
    }
};
