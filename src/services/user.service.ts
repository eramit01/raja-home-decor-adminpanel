import { api } from './api';

export interface User {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    createdAt: string;
}

export interface GetUsersResponse {
    users: User[];
    pagination: {
        total: number;
        pages: number;
        page: number;
        limit: number;
    };
}

export const UserService = {
    getAllUsers: async (page = 1, limit = 10, search = '') => {
        const response = await api.get<any>(`/users?page=${page}&limit=${limit}&search=${search}`);
        return response.data.data;
    },

    deleteUser: async (id: string) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    }
};
