import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface Story {
    id: string;
    _id?: string;
    title: string;
    videoUrl: string;
    logoUrl: string;
    isActive: boolean;
    order: number;
    views: number;
    createdAt: string;
}

export const StoryService = {
    async getAllStories(): Promise<Story[]> {
        const response = await axios.get(`${API_URL}/stories/all`, { withCredentials: true });
        return response.data.data.stories.map((s: any) => ({ ...s, id: s._id }));
    },

    async createStory(formData: FormData): Promise<Story> {
        const response = await axios.post(`${API_URL}/stories`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true
        });
        return response.data.data.story;
    },

    async updateStory(id: string, formData: FormData | any): Promise<Story> {
        const isFormData = formData instanceof FormData;
        const response = await axios.put(`${API_URL}/stories/${id}`, formData, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
            withCredentials: true
        });
        return response.data.data.story;
    },

    async deleteStory(id: string): Promise<void> {
        await axios.delete(`${API_URL}/stories/${id}`, { withCredentials: true });
    },

    async reorderStories(stories: { id: string; order: number }[]): Promise<void> {
        await axios.post(`${API_URL}/stories/reorder`, stories, { withCredentials: true });
    }
};
