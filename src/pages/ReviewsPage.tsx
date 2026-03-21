import { useState, useEffect } from 'react';
import { FiStar, FiCheck, FiX, FiTrash2, FiMessageSquare, FiPlus, FiCalendar, FiUser, FiPackage, FiVideo, FiImage, FiFilter, FiSearch, FiArrowLeft, FiEdit } from 'react-icons/fi';
import { ReviewService } from '../services/review.service';
import { productService } from '../services/product.service';
import { categoryService, Category } from '../services/category.service';

interface Review {
  id: string;
  productName: string;
  productImage: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  status: 'pending' | 'approved';
}

export const ReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  // Panel State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelStep, setPanelStep] = useState<'select_product' | 'write_review'>('select_product');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newReview, setNewReview] = useState({
    productId: '',
    manualName: '',
    rating: 5,
    comment: '',
    images: '',
    video: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [hoverRating, setHoverRating] = useState(0);

  const fetchReviews = async () => {
    try {
      const data = await ReviewService.getAllReviews();
      const mapped = data.map((r: any) => ({
        id: r._id,
        productName: r.product?.name || 'Unknown Product',
        productImage: r.product?.images?.[0] || '',
        userName: r.manualName || r.user?.name || 'Anonymous',
        rating: r.rating,
        comment: r.comment,
        date: new Date(r.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
        status: r.isApproved ? 'approved' : 'pending'
      }));
      setReviews(mapped);
    } catch (error) {
      console.error("Failed to fetch reviews", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [resProducts, resCategories] = await Promise.all([
        productService.getProducts({ limit: 1000 }),
        categoryService.getCategories()
      ]);
      setProducts(resProducts.data?.products || resProducts.data || []);
      setCategories(resCategories.categories || resCategories || []);
    } catch (err) {
      console.error("Failed to load data", err);
    }
  };

  useEffect(() => {
    fetchReviews();
    loadData();
  }, []);

  const handleSubmitReview = async () => {
    if (!newReview.productId || !newReview.manualName || !newReview.comment) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const payload = {
        product: newReview.productId,
        manualName: newReview.manualName,
        rating: newReview.rating,
        comment: newReview.comment,
        images: newReview.images ? newReview.images.split(',').map((url: any) => url.trim()).filter((url: any) => url) : [],
        video: newReview.video,
        createdAt: newReview.date
      };

      if (editingReviewId) {
        await ReviewService.updateReview(editingReviewId, payload);
      } else {
        await ReviewService.createReview(payload);
      }

      setIsPanelOpen(false);
      setPanelStep('select_product');
      setEditingReviewId(null);
      setNewReview({ productId: '', manualName: '', rating: 5, comment: '', images: '', video: '', date: new Date().toISOString().split('T')[0] });
      fetchReviews();
    } catch (error) {
      console.error(editingReviewId ? "Failed to update review" : "Failed to create review", error);
      alert(editingReviewId ? "Failed to update review" : "Failed to create review");
    }
  };

  const toggleApproval = async (id: string, currentStatus: string) => {
    try {
      await ReviewService.toggleApproval(id);
      setReviews(prev => prev.map((r: Review) => r.id === id ? { ...r, status: currentStatus === 'approved' ? 'pending' : 'approved' } : r));
    } catch (error) {
      console.error("Failed to toggle status", error);
      fetchReviews();
    }
  };

  const deleteReview = async (id: string) => {
    if (confirm('Delete this review permanently?')) {
      try {
        await ReviewService.deleteReview(id);
        setReviews(prev => prev.filter((r: Review) => r.id !== id));
      } catch (error) {
        console.error("Failed to delete review", error);
      }
    }
  };

  const handleEditClick = (review: Review) => {
    // Find the actual product to get its ID if possible, or use name matching
    const product = products.find(p => (p.title || p.name) === review.productName);

    setNewReview({
      productId: product?.id || product?._id || '',
      manualName: review.userName,
      rating: review.rating,
      comment: review.comment,
      images: '', // Images and video URLs aren't easily mapped back from the joined data yet, but we can load them if needed. 
      video: '',  // For now, let's keep it simple or fetch the full review data
      date: new Date().toISOString().split('T')[0] // Default to today or parse review.date
    });
    setEditingReviewId(review.id);
    setPanelStep('write_review');
    setIsPanelOpen(true);
  };

  const handleCleanOrphans = async () => {
    const orphans = reviews.filter(r => r.productName === 'Unknown Product');
    if (orphans.length === 0) {
      alert("No orphaned reviews found.");
      return;
    }
    if (confirm(`Are you sure you want to permanently delete ${orphans.length} orphaned reviews?`)) {
      try {
        await Promise.all(orphans.map((r: Review) => ReviewService.deleteReview(r.id)));
        setReviews(prev => prev.filter((r: Review) => r.productName !== 'Unknown Product'));
      } catch (error) {
        console.error("Failed to clean orphaned reviews", error);
        alert("Some reviews failed to delete. Please try again.");
        fetchReviews();
      }
    }
  };

  const filteredReviews = filter === 'all'
    ? reviews
    : reviews.filter(r => r.status === filter);

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>;

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto font-outfit">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customer Reviews</h1>
          <p className="text-gray-500 text-sm mt-0.5 font-medium">Moderate and manage your community feedback</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleCleanOrphans}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-50 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all text-xs font-bold border border-gray-100"
          >
            <FiTrash2 size={14} /> Clean Orphans
          </button>
          <button
            onClick={() => {
              setEditingReviewId(null);
              setNewReview({ productId: '', manualName: '', rating: 5, comment: '', images: '', video: '', date: new Date().toISOString().split('T')[0] });
              setPanelStep('select_product');
              setIsPanelOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-all text-xs font-bold"
          >
            <FiPlus size={14} /> Add Review
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Feedback" value={reviews.length} icon={FiMessageSquare} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Awaiting Approval" value={reviews.filter((r: Review) => r.status === 'pending').length} icon={FiFilter} color="text-amber-600" bg="bg-amber-50" />
        <StatCard label="Average Rating" value={(reviews.reduce((acc: number, r: Review) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(1)} icon={FiStar} color="text-orange-600" bg="bg-orange-50" />
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {(['all', 'pending', 'approved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {filteredReviews.map((review: Review) => {
          const isUnknown = review.productName === 'Unknown Product';

          return (
            <div
              key={review.id}
              className={`bg-white rounded-xl border transition-all duration-300 group ${isUnknown ? 'border-red-100 bg-red-50/10' : 'border-gray-100 hover:shadow-md'
                }`}
            >
              <div className="flex flex-col lg:flex-row">
                {/* Product Section */}
                <div className="p-4 lg:w-1/4 flex items-center gap-3 border-b lg:border-b-0 lg:border-r border-gray-50">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                    {review.productImage ? (
                      <img src={review.productImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${isUnknown ? 'text-red-300' : 'text-gray-300'}`}>
                        <FiPackage size={20} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    {isUnknown && <div className="text-[8px] font-bold uppercase text-red-500 tracking-wider mb-0.5">Deleted Item</div>}
                    <h3 className="text-sm font-bold text-gray-900 truncate">{review.productName}</h3>
                    <div className={`mt-1 h-5 px-2 rounded flex items-center text-[9px] font-bold uppercase tracking-tight w-fit ${review.status === 'approved' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                      {review.status}
                    </div>
                  </div>
                </div>

                {/* Review Content Section */}
                <div className="p-4 lg:w-2/4 flex flex-col justify-center min-h-[90px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} size={12} className={i < review.rating ? 'fill-current' : 'text-gray-200'} />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded leading-none uppercase tracking-wide">{review.rating}.0</span>
                  </div>
                  <p className="text-gray-600 text-[13px] leading-relaxed line-clamp-2 italic font-medium mb-2">
                    "{review.comment}"
                  </p>
                  <div className="flex items-center gap-4 text-[10px] font-bold">
                    <div className="flex items-center gap-1.5 text-gray-900">
                      <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[9px] font-black uppercase">
                        {review.userName.charAt(0)}
                      </div>
                      <span className="truncate">{review.userName}</span>
                    </div>
                    <div className="text-gray-400 flex items-center gap-1 font-medium">
                      <FiCalendar size={12} />
                      {review.date}
                    </div>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="p-3 lg:w-1/4 flex items-center justify-end gap-2 border-t lg:border-t-0 lg:border-l border-gray-50 bg-gray-50/30">
                  <div className="flex gap-1.5 w-full lg:w-auto">
                    {review.status === 'pending' ? (
                      <button
                        onClick={() => toggleApproval(review.id, review.status)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-green-600 bg-white border border-green-100 hover:bg-green-600 hover:text-white transition-all shadow-sm"
                      >
                        <FiCheck size={14} /> Approve
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleApproval(review.id, review.status)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-white border border-amber-100 hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                      >
                        <FiX size={14} /> Reject
                      </button>
                    )}
                    <button
                      onClick={() => handleEditClick(review)}
                      className="flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                      title="Edit Review"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={() => deleteReview(review.id)}
                      className="flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                      title="Delete Review"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredReviews.length === 0 && (
        <div className="mt-12 text-center bg-white rounded-3xl p-16 border-2 border-dashed border-gray-100">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
            <FiMessageSquare size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">No matching reviews</h3>
          <p className="text-gray-500 max-w-xs mx-auto mt-2">Try changing your filter or add a manual review to populate this list.</p>
        </div>
      )}

      {/* Slide-over Panel for Manual Review */}
      {isPanelOpen && (
        <div className="fixed inset-0 z-[60] overflow-hidden">
          <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-[2px] transition-opacity" onClick={() => setIsPanelOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl overflow-y-auto transform transition-transform duration-500 border-l border-gray-100 font-outfit">
            <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 px-5 py-3.5 flex justify-between items-center border-b border-gray-100">
              <div>
                {panelStep === 'write_review' ? (
                  <div className="flex items-center gap-2.5">
                    <button onClick={() => setPanelStep('select_product')} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-900">
                      <FiArrowLeft size={18} />
                    </button>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{editingReviewId ? 'Edit Review' : 'Write Review'}</h2>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{editingReviewId ? 'Modify feedback details' : 'Step 2: Add Customer Feedback'}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Select Product</h2>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Step 1: Choose a product to review</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsPanelOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-900"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {panelStep === 'select_product' ? (
                <div className="space-y-4">
                  {/* Filters */}
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black font-medium text-xs"
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-1/3 px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black font-medium text-xs appearance-none"
                    >
                      <option value="">All Categories</option>
                      {categories.map((c: Category) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Product List */}
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {products
                      .filter((p: any) => !selectedCategory || p.category === selectedCategory || p.categoryId === selectedCategory || p.category?._id === selectedCategory)
                      .filter((p: any) => !productSearch || p.name?.toLowerCase().includes(productSearch.toLowerCase()) || p.title?.toLowerCase().includes(productSearch.toLowerCase()))
                      .map((p: any) => {
                        const pId = p.id || p._id;
                        const productReviewCount = reviews.filter((r: Review) => r.productName === (p.name || p.title)).length;
                        return (
                          <div
                            key={pId}
                            onClick={() => {
                              setNewReview({ ...newReview, productId: pId });
                              setPanelStep('write_review');
                            }}
                            className="flex items-center gap-3 p-2.5 bg-white border border-gray-100 rounded-lg hover:border-black cursor-pointer group transition-all"
                          >
                            <div className="w-10 h-10 bg-gray-50 rounded border border-gray-100 overflow-hidden flex-shrink-0">
                              {p.images?.[0] ? (
                                <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300"><FiPackage size={14} /></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 text-xs truncate">{p.title || p.name}</h4>
                              <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
                                <FiMessageSquare size={10} /> {productReviewCount} reviews
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1.5 ml-1">
                        <FiUser size={12} /> Customer Name
                      </label>
                      <input
                        type="text"
                        value={newReview.manualName}
                        onChange={e => setNewReview({ ...newReview, manualName: e.target.value })}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none transition-all font-medium text-xs leading-none"
                        placeholder="e.g. Rahul S."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1.5 ml-1">
                        <FiCalendar size={12} /> Posting Date
                      </label>
                      <input
                        type="date"
                        value={newReview.date}
                        onChange={e => setNewReview({ ...newReview, date: e.target.value })}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none transition-all font-medium text-xs leading-none"
                      />
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2.5 block text-center">Satisfaction Level</label>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className={`text-2xl transition-all duration-200 ${star <= (hoverRating || newReview.rating) ? 'text-amber-400 scale-110' : 'text-gray-200 scale-100 hover:scale-105'}`}
                        >
                          <FiStar className={(star <= (hoverRating || newReview.rating)) ? 'fill-current' : ''} />
                        </button>
                      ))}
                    </div>
                    <p className="text-center text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-widest">
                      {['Terrible', 'Poor', 'Average', 'Very Good', 'Excellent'][(hoverRating || newReview.rating) - 1]}
                    </p>
                  </div>

                  {/* Comment */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block ml-1">Review Content</label>
                    <textarea
                      rows={4}
                      value={newReview.comment}
                      onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none transition-all font-medium text-xs leading-relaxed"
                      placeholder="Share the customer's experience here..."
                    />
                  </div>

                  {/* Multimedia */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1.5 ml-1">
                        <FiImage size={12} /> Image URLs (comma separated)
                      </label>
                      <input
                        type="text"
                        value={newReview.images}
                        onChange={(e: any) => setNewReview({ ...newReview, images: e.target.value })}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none transition-all text-[10px] font-mono"
                        placeholder="https://...jpg, https://...png"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1.5 ml-1">
                        <FiVideo size={12} /> Video URL
                      </label>
                      <input
                        type="text"
                        value={newReview.video}
                        onChange={(e: any) => setNewReview({ ...newReview, video: e.target.value })}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none transition-all text-[10px] font-mono"
                        placeholder="https://...mp4"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {panelStep === 'write_review' && (
              <div className="p-5 border-t border-gray-100 bg-white sticky bottom-0 z-10 space-y-2">
                <button
                  onClick={handleSubmitReview}
                  className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-all text-xs uppercase tracking-widest active:scale-[0.98]"
                >
                  {editingReviewId ? 'Save Changes' : 'Publish Review'}
                </button>
                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="w-full py-2 text-gray-400 font-bold hover:text-gray-900 transition-colors text-[10px] uppercase tracking-wider"
                >
                  Discard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, bg }: any) => (
  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
    <div className={`w-12 h-12 ${bg} ${color} rounded-lg flex items-center justify-center`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
    </div>
  </div>
);
