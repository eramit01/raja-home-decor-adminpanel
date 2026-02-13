import { useState, useEffect } from 'react';
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiCheck,
  FiPackage, FiDollarSign, FiImage, FiList, FiGlobe, FiLayers, FiMessageSquare
} from 'react-icons/fi';
import { productService, Product } from '../services/product.service';
import { categoryService, Category } from '../services/category.service';

// --- Types ---
type Tab = 'general' | 'pricing' | 'media' | 'specs' | 'seo' | 'linked' | 'faqs' | 'configuration';

interface ProductFormData extends Omit<Partial<Product>, 'addOns'> {
  newImage?: string;
  newTag?: string;
  showOnHome?: boolean;
  isBestSeller?: boolean;

  // Universal Form Data
  variants?: Array<{
    _id?: string;
    label: string;
    sku?: string;
    price: number;
    originalPrice?: number;
    stock?: number;
    image?: string;
    isDefault?: boolean;
    packs?: Array<{
      _id?: string;
      label: string;
      quantity: number;
      price: number;
      originalPrice?: number;
      isDefault?: boolean;
    }>;
  }>;

  styles?: Array<{
    _id?: string;
    label: string;
    priceAdjustment: number;
    image?: string;
  }>;

  addOns?: Array<{
    _id?: string;
    label: string;
    price: number;
    description?: string;
    required?: boolean;
  }>;

  // Legacy (Keep for fallback if needed, or remove if fully replacing)
  sizes?: Array<{ name: string; price: number }>;
  fragrances?: string[];
  packs?: Array<{ label: string; quantity: number; pricingType: 'auto' | 'fixed' | 'discount'; fixedPrice?: number; discountPercent?: number }>;
  allowMixedFragrance?: boolean;
}

// --- Product Hook ---
const useAdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts({ limit: 100 });
      setProducts(response.data.products);
    } catch (error) {
      console.error("Failed to load products", error);
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, refetch: loadProducts };
};

export const ProductsPage = () => {
  const { products, refetch: loadProducts } = useAdminProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [categories, setCategories] = useState<Category[]>([]);

  // Form State
  const [formData, setFormData] = useState<ProductFormData>({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      if (data && data.categories) {
        setCategories(data.categories);
      } else if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  const handleEdit = (product: Product) => {
    // Prefer categoryId for the form value if available (set by service)
    let categoryId = '';

    if (product.categoryId) {
      categoryId = product.categoryId;
    } else if (typeof product.category === 'object' && product.category !== null) {
      categoryId = (product.category as any)._id; // Fallback if raw object
    } else if (typeof product.category === 'string') {
      categoryId = product.category; // Fallback if string ID (or arguably name if normalized, but ID expected)
    }

    setFormData({ ...product, category: categoryId } as any);
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setFormData({
      status: 'draft',
      images: [],
      tags: [],
      dimensions: {},
      // attributes: {},
      isBestSeller: false,
      seo: {},
      faqs: [],
      sections: []
    });
    setActiveTab('general');
    setIsModalOpen(true);
  };

  // --- Logic Helpers ---
  const calculateDiscount = () => {
    if (formData.originalPrice && formData.price) {
      const discount = ((formData.originalPrice - formData.price) / formData.originalPrice) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  const handleAddTag = () => {
    if (formData.newTag && !formData.tags?.includes(formData.newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), prev.newTag!],
        newTag: ''
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tagToRemove)
    }));
  };

  const handleAddImage = () => {
    if (formData.newImage) {
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), prev.newImage!],
        newImage: ''
      }));
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index)
    }));
  };

  // --- FAQ Helpers ---
  const handleAddFaq = () => {
    setFormData(prev => ({
      ...prev,
      faqs: [...(prev.faqs || []), { question: '', answer: '' }]
    }));
  };

  const handleRemoveFaq = (index: number) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs?.filter((_, i) => i !== index)
    }));
  };


  const handleUpdateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...(formData.faqs || [])];
    newFaqs[index] = { ...newFaqs[index], [field]: value };
    setFormData(prev => ({ ...prev, faqs: newFaqs }));
  };

  // --- Configuration Helpers ---


  const handleAddFragrance = () => {
    const frag = prompt("Enter Fragrance Name:");
    if (frag && !formData.fragrances?.includes(frag)) {
      setFormData(prev => ({
        ...prev,
        fragrances: [...(prev.fragrances || []), frag]
      }));
    }
  };

  const handleRemoveFragrance = (frag: string) => {
    setFormData(prev => ({
      ...prev,
      fragrances: prev.fragrances?.filter(f => f !== frag)
    }));
  };




  const handleSave = async () => {
    try {
      const errors: string[] = [];
      if (!formData.title) errors.push("Title");
      if (!formData.category) errors.push("Category");
      if (formData.price === undefined || formData.price === null) errors.push("Price");

      if (errors.length > 0) {
        alert(`Please fill required fields: ${errors.join(", ")}`);

        // Auto-switch tabs to help user
        if (!formData.title || !formData.category) {
          setActiveTab('general');
        } else if (formData.price === undefined || formData.price === null) {
          setActiveTab('pricing');
        }
        return;
      }

      // Sanitize Data
      const sanitizedVariants = formData.variants?.filter(v => v.label && v.label.trim() !== '').map(v => ({
        ...v,
        packs: v.packs?.filter(p => p.label && p.label.trim() !== '') // Remove empty packs
      }));

      // if variants exist but are all empty/filtered out, send empty array or keep? 
      // If user intended to have variants but left them blank, they are removed here.

      const payload = {
        ...formData,
        variants: sanitizedVariants,
        name: formData.title,
        description: formData.description || formData.shortDescription || formData.title,
      };

      if (formData.id || formData._id) {
        await productService.updateProduct((formData.id || formData._id) as string, payload);
      } else {
        await productService.createProduct(payload);
      }
      setIsModalOpen(false);
      loadProducts(); // Refresh list
    } catch (error: any) {
      console.error("Failed to save product", error);

      let errorMessage = "Failed to save product";

      // Try to extract backend error message
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message; // Fallback
      } else if (error.message) {
        errorMessage = error.message;
      }

      // If it's still an object (unlikely with above checks, but safety first)
      if (typeof errorMessage === 'object') {
        errorMessage = JSON.stringify(errorMessage);
      }

      alert(`Error: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await productService.deleteProduct(id);
        loadProducts();
      } catch (error) {
        console.error("Failed to delete product", error);
        alert("Failed to delete product");
      }
    }
  };

  const filteredProducts = products.filter(p =>
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Render Tabs ---
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Premium Glass Candle Jar"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                <input
                  type="text"
                  value={formData.slug || ''}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                  placeholder="auto-generated-from-title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={formData.category || ''}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              {/* Product Type Selector Removed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status || 'draft'}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div >

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Description (Required)</label>
              <textarea
                rows={4}
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter detailed product description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
              <textarea
                rows={2}
                value={formData.shortDescription || ''}
                onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={formData.showOnHome || false}
                  onChange={e => setFormData({ ...formData, showOnHome: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <span className="text-gray-700">Show on Home Page</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={formData.isBestSeller || false}
                  onChange={e => setFormData({ ...formData, isBestSeller: e.target.checked })}
                  className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                />
                <span className="text-gray-700 font-medium">Mark as Best Seller</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (Badges)</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {formData.tags?.map(tag => (
                  <span key={tag} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)}><FiX /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.newTag || ''}
                  onChange={e => setFormData({ ...formData, newTag: e.target.value })}
                  placeholder="Add tag (e.g. Best Seller)"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
                />
                <button onClick={handleAddTag} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Add</button>
              </div>
            </div>
          </div >
        );

      case 'pricing':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-bold text-gray-700 mb-1">Selling Price (₹)</label>
                <input
                  type="number"
                  value={formData.price || ''}
                  onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
                />
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-bold text-gray-700 mb-1">Original Price (MRP)</label>
                <input
                  type="number"
                  value={formData.originalPrice || ''}
                  onChange={e => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-center bg-green-50 p-4 rounded-lg border border-green-100 flex-col">
                <span className="text-sm text-green-600 font-medium">Auto-Calculated Discount</span>
                <span className="text-3xl font-bold text-green-700">{calculateDiscount()}% OFF</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (Internal)</label>
                <input
                  type="number"
                  value={formData.costPrice || ''}
                  onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  placeholder="For profit calculation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                <select
                  value={formData.taxRate || 18}
                  onChange={e => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="5">5% (GST)</option>
                  <option value="12">12% (GST)</option>
                  <option value="18">18% (GST)</option>
                  <option value="28">28% (GST)</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-800 mb-3">Inventory</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku || ''}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={formData.stock || ''}
                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    checked={formData.allowBackorders || false}
                    onChange={e => setFormData({ ...formData, allowBackorders: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="text-gray-700">Allow Backorders</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'media':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-100 transition-colors cursor-pointer">
              <FiImage className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Drag and drop images here, or click to browse</p>
              <p className="text-gray-400 text-sm mt-1">Supports JPG, PNG, WEBP</p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={formData.newImage || ''}
                onChange={e => setFormData({ ...formData, newImage: e.target.value })}
                placeholder="Or paste Image URL here..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
              />
              <button onClick={handleAddImage} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add URL</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {formData.images?.map((img, idx) => (
                <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-100">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">Primary</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'specs':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                <input
                  type="text"
                  value={formData.material || ''}
                  onChange={e => setFormData({ ...formData, material: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  placeholder="e.g. Borosilicate Glass"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Finish / Color</label>
                <input
                  type="text"
                  value={formData.finish || ''}
                  onChange={e => setFormData({ ...formData, finish: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  placeholder="e.g. Gold Plated"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-800 mb-3">Dimensions & Capacity</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (in)</label>
                  <input
                    type="number"
                    value={formData.dimensions?.height || ''}
                    onChange={e => setFormData({ ...formData, dimensions: { ...formData.dimensions, height: Number(e.target.value) } })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Width/Dia (in)</label>
                  <input
                    type="number"
                    value={formData.dimensions?.width || ''}
                    onChange={e => setFormData({ ...formData, dimensions: { ...formData.dimensions, width: Number(e.target.value) } })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (ml)</label>
                  <input
                    type="number"
                    value={formData.capacity || ''}
                    onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={formData.dimensions?.weight || ''}
                    onChange={e => setFormData({ ...formData, dimensions: { ...formData.dimensions, weight: Number(e.target.value) } })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'seo':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold text-blue-900 text-sm mb-2">Search Preview</h4>
              <div className="bg-white p-3 rounded shadow-sm border border-blue-100 max-w-xl">
                <div className="text-xl text-blue-600 truncate">{formData.seo?.metaTitle || formData.title}</div>
                <div className="text-sm text-green-700">yoursite.com/products/{formData.slug || 'product-url'}</div>
                <div className="text-sm text-gray-600 line-clamp-2">{formData.seo?.metaDescription || formData.shortDescription}</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
              <input
                type="text"
                value={formData.seo?.metaTitle || ''}
                onChange={e => setFormData({ ...formData, seo: { ...formData.seo, metaTitle: e.target.value } })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                placeholder="Recommended: 60 chars"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
              <textarea
                rows={3}
                value={formData.seo?.metaDescription || ''}
                onChange={e => setFormData({ ...formData, seo: { ...formData.seo, metaDescription: e.target.value } })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                placeholder="Recommended: 160 chars"
              />
            </div>
          </div>
        );

      case 'faqs':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Frequently Asked Questions</h3>
              <button
                onClick={handleAddFaq}
                className="text-sm bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 font-medium flex items-center gap-1"
              >
                <FiPlus className="w-4 h-4" /> Add Question
              </button>
            </div>

            <div className="space-y-4">
              {formData.faqs?.map((faq, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 p-4 rounded-xl relative group hover:shadow-sm transition-shadow">
                  <button
                    onClick={() => handleRemoveFaq(index)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 bg-white p-1 rounded-full shadow-sm"
                  >
                    <FiTrash2 size={14} />
                  </button>
                  <div className="space-y-3 pr-8">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Question</label>
                      <input
                        placeholder="e.g. Is this dishwasher safe?"
                        value={faq.question}
                        onChange={e => handleUpdateFaq(index, 'question', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Answer</label>
                      <textarea
                        placeholder="e.g. Yes, it is top-rack dishwasher safe."
                        value={faq.answer}
                        onChange={e => handleUpdateFaq(index, 'answer', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {(!formData.faqs || formData.faqs.length === 0) && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <FiMessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No FAQs added for this product.</p>
                <button onClick={handleAddFaq} className="text-blue-600 font-medium text-sm mt-2 hover:underline">Add the first question</button>
              </div>
            )}
          </div>
        );

      case 'configuration':
        return (
          <div className="space-y-8">

            {/* --- VARIANTS SECTION (Universal) --- */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Variants</h3>
                  <p className="text-sm text-gray-500">Add sizes, colors, or other variations.</p>
                </div>
                <button
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    variants: [...(prev.variants || []), {
                      label: '', price: prev.price || 0, stock: 0, packs: []
                    }]
                  }))}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                >
                  <FiPlus /> Add Variant
                </button>
              </div>

              <div className="space-y-4">
                {formData.variants?.map((variant, vIndex) => (
                  <div key={vIndex} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex gap-4 items-start mb-4">
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
                        <input
                          placeholder="Label (e.g. Small, Red)"
                          value={variant.label}
                          onChange={e => {
                            const newVariants = [...(formData.variants || [])];
                            newVariants[vIndex].label = e.target.value;
                            setFormData({ ...formData, variants: newVariants });
                          }}
                          className="px-3 py-2 border rounded-lg"
                        />
                        <input
                          placeholder="SKU"
                          value={variant.sku || ''}
                          onChange={e => {
                            const newVariants = [...(formData.variants || [])];
                            newVariants[vIndex].sku = e.target.value;
                            setFormData({ ...formData, variants: newVariants });
                          }}
                          className="px-3 py-2 border rounded-lg"
                        />
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                          <input
                            type="number"
                            placeholder="Price"
                            value={variant.price}
                            onChange={e => {
                              const newVariants = [...(formData.variants || [])];
                              newVariants[vIndex].price = Number(e.target.value);
                              setFormData({ ...formData, variants: newVariants });
                            }}
                            className="w-full pl-6 px-3 py-2 border rounded-lg"
                          />
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">MRP</span>
                          <input
                            type="number"
                            placeholder="Org Price"
                            value={variant.originalPrice || ''}
                            onChange={e => {
                              const newVariants = [...(formData.variants || [])];
                              newVariants[vIndex].originalPrice = e.target.value ? Number(e.target.value) : undefined;
                              setFormData({ ...formData, variants: newVariants });
                            }}
                            className="w-full pl-8 px-3 py-2 border rounded-lg text-sm"
                          />
                        </div>
                        <input
                          type="number"
                          placeholder="Stock"
                          value={variant.stock}
                          onChange={e => {
                            const newVariants = [...(formData.variants || [])];
                            newVariants[vIndex].stock = Number(e.target.value);
                            setFormData({ ...formData, variants: newVariants });
                          }}
                          className="px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newVariants = formData.variants?.filter((_, i) => i !== vIndex);
                          setFormData({ ...formData, variants: newVariants });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <FiTrash2 />
                      </button>
                    </div>

                    {/* Variant Packs */}
                    <div className="pl-4 border-l-2 border-gray-200 ml-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Packs for {variant.label || 'Variant'}</span>
                        <button
                          onClick={() => {
                            const newVariants = [...(formData.variants || [])];
                            if (!newVariants[vIndex].packs) newVariants[vIndex].packs = [];
                            newVariants[vIndex].packs!.push({ label: 'Pack of ', quantity: 2, price: 0 });
                            setFormData({ ...formData, variants: newVariants });
                          }}
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <FiPlus size={10} /> Add Pack
                        </button>
                      </div>
                      <div className="space-y-2">
                        {variant.packs?.map((pack, pIndex) => (
                          <div key={pIndex} className="flex gap-2 items-center">
                            <input
                              placeholder="Pack Label"
                              value={pack.label}
                              onChange={e => {
                                const newVariants = [...(formData.variants || [])];
                                newVariants[vIndex].packs![pIndex].label = e.target.value;
                                setFormData({ ...formData, variants: newVariants });
                              }}
                              className="flex-1 px-2 py-1 border rounded text-sm"
                            />
                            <input
                              type="number"
                              placeholder="Qty"
                              value={pack.quantity}
                              onChange={e => {
                                const newVariants = [...(formData.variants || [])];
                                newVariants[vIndex].packs![pIndex].quantity = Number(e.target.value);
                                setFormData({ ...formData, variants: newVariants });
                              }}
                              className="w-16 px-2 py-1 border rounded text-sm"
                            />
                            <div className="relative w-24">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₹</span>
                              <input
                                type="number"
                                placeholder="Price"
                                value={pack.price}
                                onChange={e => {
                                  const newVariants = [...(formData.variants || [])];
                                  newVariants[vIndex].packs![pIndex].price = Number(e.target.value);
                                  setFormData({ ...formData, variants: newVariants });
                                }}
                                className="w-full pl-4 px-2 py-1 border rounded text-sm"
                              />
                            </div>
                            <div className="relative w-24">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">MRP</span>
                              <input
                                type="number"
                                placeholder="MRP"
                                value={pack.originalPrice || ''}
                                onChange={e => {
                                  const newVariants = [...(formData.variants || [])];
                                  newVariants[vIndex].packs![pIndex].originalPrice = e.target.value ? Number(e.target.value) : undefined;
                                  setFormData({ ...formData, variants: newVariants });
                                }}
                                className="w-full pl-8 px-2 py-1 border rounded text-sm"
                              />
                            </div>
                            <button
                              onClick={() => {
                                const newVariants = [...(formData.variants || [])];
                                newVariants[vIndex].packs = newVariants[vIndex].packs?.filter((_, i) => i !== pIndex);
                                setFormData({ ...formData, variants: newVariants });
                              }}
                              className="text-red-400 hover:text-red-600"
                            >
                              <FiX />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {(!formData.variants || formData.variants.length === 0) && (
                  <div className="text-center p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 mb-2">No variants added. Product will use Base Price.</p>
                  </div>
                )}
              </div>
            </div>

            {/* --- STYLES SECTION --- */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Styles</h3>
                <button
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    styles: [...(prev.styles || []), { label: '', priceAdjustment: 0 }]
                  }))}
                  className="text-sm bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 font-medium flex items-center gap-1"
                >
                  <FiPlus className="w-4 h-4" /> Add Style
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.styles?.map((style, index) => (
                  <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg">
                    <input
                      placeholder="Style Name (e.g. Gold Lid)"
                      value={style.label}
                      onChange={e => {
                        const newStyles = [...(formData.styles || [])];
                        newStyles[index].label = e.target.value;
                        setFormData({ ...formData, styles: newStyles });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">+₹</span>
                      <input
                        type="number"
                        placeholder="Adj."
                        value={style.priceAdjustment}
                        onChange={e => {
                          const newStyles = [...(formData.styles || [])];
                          newStyles[index].priceAdjustment = Number(e.target.value);
                          setFormData({ ...formData, styles: newStyles });
                        }}
                        className="w-20 pl-7 pr-2 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, styles: prev.styles?.filter((_, i) => i !== index) }))}
                      className="text-red-500 p-2 hover:bg-red-50 rounded"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* --- ADD-ONS SECTION --- */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Add-Ons</h3>
                <button
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    addOns: [...(prev.addOns || []), { label: '', price: 0 }]
                  }))}
                  className="text-sm bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 font-medium flex items-center gap-1"
                >
                  <FiPlus className="w-4 h-4" /> Add Add-On
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.addOns?.map((addon, index) => (
                  <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg">
                    <input
                      placeholder="Add-On Name (e.g. Gift Wrap)"
                      value={addon.label}
                      onChange={e => {
                        const newAddOns = [...(formData.addOns || [])];
                        newAddOns[index].label = e.target.value;
                        setFormData({ ...formData, addOns: newAddOns });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₹</span>
                      <input
                        type="number"
                        placeholder="Price"
                        value={addon.price}
                        onChange={e => {
                          const newAddOns = [...(formData.addOns || [])];
                          newAddOns[index].price = Number(e.target.value);
                          setFormData({ ...formData, addOns: newAddOns });
                        }}
                        className="w-20 pl-6 pr-2 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, addOns: prev.addOns?.filter((_, i) => i !== index) }))}
                      className="text-red-500 p-2 hover:bg-red-50 rounded"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Fragrances (Legacy/Specific - Keep optional) */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex justify-between items-center cursor-pointer" onClick={() => {
                // Toggle visibility if we want, or just always show
              }}>
                <h3 className="text-base font-semibold text-gray-600">Fragrances (Optional)</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.fragrances?.map(frag => (
                  <span key={frag} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    {frag}
                    <button onClick={() => handleRemoveFragrance(frag)}><FiX size={14} /></button>
                  </span>
                ))}
                <button onClick={handleAddFragrance} className="px-3 py-1 border border-dashed border-gray-300 rounded-full text-gray-500 hover:border-blue-500 hover:text-blue-500 flex items-center gap-1 text-sm">
                  <FiPlus size={14} /> Add Fragrance
                </button>
              </div>
            </div>
          </div>
        );



      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Price</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                        <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{product.title}</div>
                        <div className="text-xs text-gray-500 uppercase">{product.status}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{product.category}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{product.price}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.stock > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {product.stock} in stock
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-2"><FiEdit2 /></button>
                    <button onClick={() => handleDelete(product.id || product._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><FiTrash2 /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Screen Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{formData.id ? 'Edit Product' : 'Create New Product'}</h2>
                <p className="text-sm text-gray-500">Manage all product details, images, and inventory.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
                <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2">
                  <FiCheck /> Save Changes
                </button>
              </div>
            </div>

            {/* Main Layout */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar Tabs */}
              <div className="w-64 bg-gray-50 border-r border-gray-100 p-4 space-y-1 overflow-y-auto">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <FiPackage className="w-4 h-4" /> General Info
                </button>
                <button
                  onClick={() => setActiveTab('pricing')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pricing' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <FiDollarSign className="w-4 h-4" /> Pricing & Stock
                </button>
                <button
                  onClick={() => setActiveTab('media')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'media' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <FiImage className="w-4 h-4" /> Images & Media
                </button>
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'specs' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <FiList className="w-4 h-4" /> Specifications
                </button>
                <button
                  onClick={() => setActiveTab('seo')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'seo' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <FiGlobe className="w-4 h-4" /> SEO & Marketing
                </button>
                <button
                  onClick={() => setActiveTab('faqs')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'faqs' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <FiMessageSquare className="w-4 h-4" /> FAQs
                </button>
                <button
                  onClick={() => setActiveTab('configuration')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'configuration' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <FiLayers className="w-4 h-4" /> Configuration
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 p-8 overflow-y-auto">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
