import { api } from './api';

export interface Category {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    banner?: string;
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string;
    };
    isActive: boolean;
    order: number;
}

export const categoryService = {
    getCategories: async () => {
        const response = await api.get('/categories');
        return response.data.data; // Assuming { start: 'success', data: { categories: [] } } or similar
    },

    getCategoryById: async (id: string) => {
        const response = await api.get(`/categories/${id}`);
        return response.data.data.category;
    },

    createCategory: async (data: Partial<Category>) => {
        const response = await api.post('/categories', data);
        return response.data.data.category;
    },

    updateCategory: async (id: string, data: Partial<Category>) => {
        const response = await api.put(`/categories/${id}`, data);
        return response.data.data.category;
    },

    deleteCategory: async (id: string) => {
        const response = await api.delete(`/categories/${id}`);
        return response.data;
    }
};
