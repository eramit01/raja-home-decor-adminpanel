import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiToggleLeft, FiToggleRight, FiX, FiEdit2, FiVideo, FiImage } from 'react-icons/fi';
import { StoryService, Story } from '../services/story.service';
import { toast } from 'react-hot-toast';

export const StoriesPage = () => {
    const [stories, setStories] = useState<Story[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [editingStory, setEditingStory] = useState<Story | null>(null);
    
    // Helper to get YouTube Embed URL
    const getYoutubeEmbedUrl = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            const videoId = match[2];
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1`;
        }
        return null;
    };

    // Form State
    const [formData, setFormData] = useState<any>({
        title: '',
        isActive: true,
        order: 0,
        videoUrl: '',
        logoUrl: '',
    });
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);

    const fetchStories = async () => {
        try {
            const data = await StoryService.getAllStories();
            setStories(data);
        } catch (error) {
            console.error("Failed to fetch stories", error);
            toast.error("Failed to fetch stories");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStories();
    }, []);

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = new FormData();
        data.append('title', formData.title);
        data.append('isActive', String(formData.isActive));
        data.append('order', String(formData.order));

        if (videoFile) data.append('story-video', videoFile);
        if (logoFile) data.append('story-logo', logoFile);
        
        // Add direct URLs if provided
        if (formData.videoUrl) data.append('videoUrl', formData.videoUrl);
        if (formData.logoUrl) data.append('logoUrl', formData.logoUrl);

        try {
            if (editingStory) {
                await StoryService.updateStory(editingStory.id, data);
                toast.success("Story updated successfully");
            } else {
                if ((!videoFile && !formData.videoUrl) || (!logoFile && !formData.logoUrl)) {
                    toast.error("Video and Logo (File or Link) are required for new stories");
                    return;
                }
                await StoryService.createStory(data);
                toast.success("Story created successfully");
            }

            setIsPanelOpen(false);
            setEditingStory(null);
            resetForm();
            fetchStories();
        } catch (error) {
            console.error("Failed to save story", error);
            toast.error("Failed to save story");
        }
    };

    const resetForm = () => {
        setFormData({ title: '', isActive: true, order: 0, videoUrl: '', logoUrl: '' });
        setVideoFile(null);
        setLogoFile(null);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Delete this story?')) {
            try {
                await StoryService.deleteStory(id);
                toast.success("Story deleted");
                setStories(prev => prev.filter(s => s.id !== id));
            } catch (error) {
                console.error("Failed to delete story", error);
                toast.error("Failed to delete story");
            }
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const newStatus = !currentStatus;
            setStories(prev => prev.map(s => s.id === id ? { ...s, isActive: newStatus } : s));
            await StoryService.updateStory(id, { isActive: newStatus });
        } catch (error) {
            console.error("Failed to update status", error);
            fetchStories();
        }
    };

    const openEdit = (story: Story) => {
        setEditingStory(story);
        setFormData({
            title: story.title,
            isActive: story.isActive,
            order: story.order,
            videoUrl: story.videoUrl,
            logoUrl: story.logoUrl,
        });
        setIsPanelOpen(true);
    };

    if (isLoading) return <div className="p-6">Loading stories...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manufacturing Stories</h1>
                    <p className="text-sm text-gray-500">Manage vertical video stories for the homepage</p>
                </div>
                <button
                    onClick={() => {
                        setEditingStory(null);
                        resetForm();
                        setIsPanelOpen(true);
                    }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all shadow-md font-bold"
                >
                    <FiPlus /> Add Story
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stories.map(story => (
                    <div key={story.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
                        <div className="relative aspect-[9/16] bg-gray-100">
                            {getYoutubeEmbedUrl(story.videoUrl) ? (
                                <iframe
                                    src={getYoutubeEmbedUrl(story.videoUrl) || ''}
                                    className={`w-full h-full object-cover pointer-events-none ${story.isActive ? '' : 'grayscale opacity-50'}`}
                                    frameBorder="0"
                                    allow="autoplay; encrypted-media"
                                    allowFullScreen
                                    title={story.title}
                                />
                            ) : (
                                <video
                                    src={story.videoUrl}
                                    className={`w-full h-full object-cover ${story.isActive ? '' : 'grayscale opacity-50'}`}
                                    muted
                                    loop
                                />
                            )}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(story)} className="p-2 bg-white/90 text-blue-500 rounded-lg shadow-sm"><FiEdit2 /></button>
                                <button onClick={() => handleDelete(story.id)} className="p-2 bg-white/90 text-red-500 rounded-lg shadow-sm"><FiTrash2 /></button>
                            </div>
                            {!story.isActive && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold">INACTIVE</span>
                                </div>
                            )}
                        </div>
                        <div className="p-4 flex justify-between items-center">
                            <div className="overflow-hidden">
                                <h3 className="font-bold text-gray-900 truncate" title={story.title}>{story.title}</h3>
                                <p className="text-xs text-gray-500">Views: {story.views} | Order: {story.order}</p>
                            </div>
                            <button
                                onClick={() => toggleStatus(story.id, story.isActive)}
                                className={`text-2xl ${story.isActive ? 'text-green-500' : 'text-gray-300'}`}
                            >
                                {story.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Slide-over Panel */}
            {isPanelOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsPanelOpen(false)} />
                    <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl p-6 overflow-y-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold">{editingStory ? 'Edit Story' : 'New Story'}</h2>
                            <button onClick={() => setIsPanelOpen(false)}><FiX size={24} /></button>
                        </div>

                        <form onSubmit={handleCreateOrUpdate} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                                        value={formData.order}
                                        onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="flex items-end pb-1">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-indigo-600 rounded"
                                            checked={formData.isActive}
                                            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        <span className="text-sm font-medium">Active Status</span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <FiVideo /> Video Source
                                    </label>
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            placeholder="Paste video URL here..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            value={formData.videoUrl}
                                            onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                                        />
                                        <div className="flex items-center gap-2 text-xs text-gray-400 my-1">
                                            <div className="h-[1px] flex-1 bg-gray-200"></div>
                                            <span>OR UPLOAD</span>
                                            <div className="h-[1px] flex-1 bg-gray-200"></div>
                                        </div>
                                        <input
                                            type="file"
                                            accept="video/*"
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                            onChange={e => setVideoFile(e.target.files?.[0] || null)}
                                        />
                                    </div>
                                    {editingStory && !videoFile && !formData.videoUrl && <p className="text-[10px] text-gray-400 mt-1">Both empty will keep current video</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <FiImage /> Brand Logo Source
                                    </label>
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            placeholder="Paste logo URL here..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                                            value={formData.logoUrl}
                                            onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                                        />
                                        <div className="flex items-center gap-2 text-xs text-gray-400 my-1">
                                            <div className="h-[1px] flex-1 bg-gray-200"></div>
                                            <span>OR UPLOAD</span>
                                            <div className="h-[1px] flex-1 bg-gray-200"></div>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                                            onChange={e => setLogoFile(e.target.files?.[0] || null)}
                                        />
                                    </div>
                                    {editingStory && !logoFile && !formData.logoUrl && <p className="text-[10px] text-gray-400 mt-1">Both empty will keep current logo</p>}
                                </div>
                            </div>

                            <div className="pt-8">
                                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg">
                                    {editingStory ? 'Update Story' : 'Create Story'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
