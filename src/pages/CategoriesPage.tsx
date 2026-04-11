import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
import { categoryService, Category } from '../services/category.service';

export const CategoriesPage = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    // const [loading, setLoading] = useState(true); // Unused
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Category>>({});

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            // setLoading(true);
            const response = await categoryService.getCategories();
            // Adjust based on actual API response structure. 
            // If response is { categories: [] }, use response.categories
            // If response is [], use response
            setCategories(response.categories || response || []);
        } catch (error) {
            console.error("Failed to load categories", error);
        } finally {
            // setLoading(false);
        }
    };

    const handleAddNew = () => {
        setFormData({ isActive: true, order: 0 });
        setIsModalOpen(true);
    };

    const handleEdit = (category: Category) => {
        setFormData({ ...category });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            try {
                await categoryService.deleteCategory(id);
                loadCategories();
            } catch (error) {
                console.error("Failed to delete category", error);
                alert("Failed to delete category");
            }
        }
    };

    const handleSave = async () => {
        try {
            if (!formData.name || !formData.slug) {
                alert("Name and Slug are required");
                return;
            }

            if (formData._id) {
                await categoryService.updateCategory(formData._id, formData);
            } else {
                await categoryService.createCategory(formData);
            }
            setIsModalOpen(false);
            loadCategories();
        } catch (error) {
            console.error("Failed to save category", error);
            alert("Failed to save category");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-hover font-bold transition-all shadow-md active:scale-95"
                >
                    <FiPlus /> Add Category
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Image</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Banner</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Slug</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {categories.map((category) => (
                            <tr key={category._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                                        {category.image && <img src={category.image} alt="" className="w-full h-full object-cover" />}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="w-20 h-8 rounded bg-gray-100 overflow-hidden">
                                        {category.banner && <img src={category.banner} alt="" className="w-full h-full object-cover" />}
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">{category.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{category.slug}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleEdit(category)} className="p-2 text-accent hover:bg-accent/10 rounded-lg mr-2"><FiEdit2 /></button>
                                    <button onClick={() => handleDelete(category._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">{formData._id ? 'Edit Category' : 'New Category'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><FiX /></button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                                <input
                                    type="text"
                                    value={formData.slug || ''}
                                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail Image URL</label>
                                <input
                                    type="text"
                                    value={formData.image || ''}
                                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image URL (Category Page)</label>
                                <input
                                    type="text"
                                    value={formData.banner || ''}
                                    onChange={e => setFormData({ ...formData, banner: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none transition-all"
                                />
                                <p className="text-xs text-gray-500 mt-1">This banner will be shown at the top of the category page.</p>
                            </div>



                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive ?? true}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-5 h-5 text-accent rounded focus:ring-accent"
                                />
                                <span className="text-sm font-medium text-gray-700">Active Status</span>
                            </div>

                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-accent text-white font-bold rounded-lg hover:bg-accent-hover transition-all flex items-center gap-2 shadow-md active:scale-95">
                                <FiCheck /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
