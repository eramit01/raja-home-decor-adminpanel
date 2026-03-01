import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiToggleLeft, FiToggleRight, FiX, FiEdit2 } from 'react-icons/fi';
import { BannerService, Banner } from '../services/banner.service';
import { categoryService, Category } from '../services/category.service';

export const BannersPage = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Banner>>({
    title: '',
    image: '',
    link: '',
    isActive: true,
    order: 0,
    startDate: '',
    endDate: ''
  });

  const fetchBanners = async () => {
    try {
      const data = await BannerService.getAllBanners();
      const mapped = data.map((b: any) => ({
        ...b,
        id: b._id,
        startDate: b.startDate ? new Date(b.startDate).toISOString().split('T')[0] : '',
        endDate: b.endDate ? new Date(b.endDate).toISOString().split('T')[0] : ''
      }));
      setBanners(mapped);
    } catch (error) {
      console.error("Failed to fetch banners", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      if (data && data.categories) {
        setCategories(data.categories);
      } else if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  useEffect(() => {
    fetchBanners();
    fetchCategories();
  }, []);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      };

      if (editingBanner && editingBanner.id) {
        await BannerService.updateBanner(editingBanner.id, payload);
      } else {
        await BannerService.createBanner(payload);
      }

      setIsPanelOpen(false);
      setEditingBanner(null);
      setFormData({ title: '', image: '', link: '', isActive: true, order: 0, startDate: '', endDate: '' });
      fetchBanners();
    } catch (error) {
      console.error("Failed to save banner", error);
      alert("Failed to save banner");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this banner?')) {
      try {
        await BannerService.deleteBanner(id);
        setBanners(prev => prev.filter(b => b.id !== id));
      } catch (error) {
        console.error("Failed to delete banner", error);
      }
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      // Optimistic update
      setBanners(prev => prev.map(b => b.id === id ? { ...b, isActive: newStatus } : b));
      await BannerService.updateBanner(id, { isActive: newStatus });
    } catch (error) {
      console.error("Failed to update status", error);
      fetchBanners(); // Revert
    }
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      image: banner.image,
      link: banner.link,
      isActive: banner.isActive,
      order: banner.order,
      startDate: banner.startDate,
      endDate: banner.endDate
    });
    setIsPanelOpen(true);
  };

  if (isLoading) return <div>Loading banners...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banners & Promotions</h1>
          <p className="text-sm text-gray-500">Manage homepage sliders and promotional banners</p>
        </div>
        <button
          onClick={() => {
            setEditingBanner(null);
            setFormData({ title: '', image: '', link: '', isActive: true, order: 0, startDate: '', endDate: '' });
            setIsPanelOpen(true);
          }}
          className="flex items-center gap-2 bg-accent text-primary-900 px-4 py-2 rounded-lg hover:bg-accent-hover transition-all shadow-md font-bold active:scale-95"
        >
          <FiPlus /> Add Banner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map(banner => (
          <div key={banner.id} className={`bg-white rounded-xl border ${banner.isActive ? 'border-gray-200' : 'border-gray-100 bg-gray-50'} shadow-sm overflow-hidden group`}>
            {/* Banner Preview */}
            <div className="h-40 bg-gray-100 relative overflow-hidden">
              <img
                src={banner.image}
                alt={banner.title}
                className={`w-full h-full object-cover transition-opacity ${banner.isActive ? 'opacity-100' : 'opacity-50 grayscale'}`}
              />
              {!banner.isActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-gray-800/80 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Inactive</span>
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(banner)}
                  className="p-2 bg-white/90 text-blue-500 hover:text-blue-600 rounded-lg shadow-sm"
                  title="Edit"
                >
                  <FiEdit2 />
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="p-2 bg-white/90 text-red-500 hover:text-red-600 rounded-lg shadow-sm"
                  title="Delete"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>

            {/* Banner Details */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-900 line-clamp-1" title={banner.title}>{banner.title}</h3>
                <button
                  onClick={() => toggleStatus(banner.id, banner.isActive)}
                  className={`text-2xl transition-colors ${banner.isActive ? 'text-accent' : 'text-gray-300'}`}
                  title={banner.isActive ? "Deactivate" : "Activate"}
                >
                  {banner.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                </button>
              </div>

              <div className="space-y-2 text-sm text-gray-500">
                {banner.link && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase text-gray-400">Link:</span>
                    <a href={banner.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate block flex-1">
                      {banner.link}
                    </a>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span>Order: {banner.order}</span>
                  {(banner.startDate || banner.endDate) && (
                    <span title={`From: ${banner.startDate || 'N/A'} To: ${banner.endDate || 'N/A'}`}>
                      Scheduled
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Slide-over Panel for Creation */}
      {isPanelOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsPanelOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl p-6 overflow-y-auto transform transition-transform duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">{editingBanner ? 'Edit Banner' : 'New Banner'}</h2>
              <button onClick={() => setIsPanelOpen(false)}><FiX size={24} /></button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="space-y-6">
              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Summer Sale"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Image URL</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://..."
                  required
                  value={formData.image}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Recommended size: 1900x650px</p>
              </div>

              <div>
                <label className="label font-bold text-accent uppercase tracking-wider text-xs">Link Options</label>
                <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Link to Category</label>
                    <select
                      className="input !py-2 bg-white"
                      value={formData.link?.startsWith('/category/') ? formData.link.split('/').pop() : ''}
                      onChange={e => {
                        const slug = e.target.value;
                        if (slug) setFormData({ ...formData, link: `/category/${slug}` });
                        else setFormData({ ...formData, link: '' });
                      }}
                    >
                      <option value="">-- No Category Selection --</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat.slug}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-gray-50 px-2 text-gray-400 font-bold">OR</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Custom Target Link</label>
                    <input
                      type="text"
                      className="input !py-2 bg-white"
                      placeholder="e.g. /shop or /products/ID"
                      value={formData.link}
                      onChange={e => setFormData({ ...formData, link: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Display Order</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.order}
                    onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">&nbsp;</label>
                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-accent rounded focus:ring-accent"
                      checked={formData.isActive}
                      onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-gray-700">Active Status</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Scheduling (Optional)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Start Date</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.startDate}
                      onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">End Date</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.endDate}
                      onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button type="submit" className="w-full bg-accent text-primary-900 font-bold py-3 text-lg rounded-xl hover:bg-accent-hover transition-all shadow-lg active:scale-95">
                  {editingBanner ? 'Update Banner' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
                .label { @apply block text-sm font-medium text-gray-700 mb-1.5; }
                .input { @apply w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all outline-none; }
            `}</style>
    </div>
  );
};
