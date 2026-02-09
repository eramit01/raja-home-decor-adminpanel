import { api } from './api';

export interface Review {
    _id: string; // Backend ID
    id?: string; // Frontend mapping
    product: {
        _id: string;
        name: string;
        slug: string;
    };
    user: {
        _id: string;
        name: string;
        email: string;
    };
    manualName?: string;
    rating: number;
    title?: string;
    comment?: string;
    images?: string[];
    isVerified: boolean;
    isApproved: boolean;
    helpfulCount: number;
    createdAt: string;
}

export const ReviewService = {
    getAllReviews: async (status?: 'pending' | 'approved') => {
        const params = status ? { status } : {};
        const response = await api.get('/reviews/admin/all', { params });
        return response.data.data.reviews;
    },

    createReview: async (reviewData: any) => {
        const response = await api.post('/reviews/admin/create', reviewData);
        return response.data.data.review;
    },

    toggleApproval: async (id: string) => {
        const response = await api.patch(`/reviews/admin/${id}/approve`);
        return response.data.data.review;
    },

    deleteReview: async (id: string) => {
        const response = await api.delete(`/reviews/admin/${id}`);
        return response.data;
    }
};
