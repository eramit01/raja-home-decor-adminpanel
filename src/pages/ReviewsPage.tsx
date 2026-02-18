import { useState, useEffect } from 'react';
import { FiStar, FiCheck, FiX, FiTrash2, FiMessageSquare, FiPlus, FiCalendar, FiUser, FiPackage, FiVideo, FiImage, FiFilter } from 'react-icons/fi';
import { ReviewService } from '../services/review.service';
import { productService } from '../services/product.service';

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
  const [products, setProducts] = useState<any[]>([]);
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
        userName: r.user?.name || r.manualName || 'Anonymous',
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

  const loadProducts = async () => {
    try {
      const res = await productService.getProducts({ limit: 100 });
      setProducts(res.data.products);
    } catch (err) {
      console.error("Failed to load products", err);
    }
  };

  useEffect(() => {
    fetchReviews();
    loadProducts();
  }, []);

  const handleCreateReview = async () => {
    if (!newReview.productId || !newReview.manualName || !newReview.comment) {
      alert("Please fill all required fields");
      return;
    }

    try {
      await ReviewService.createReview({
        product: newReview.productId,
        manualName: newReview.manualName,
        rating: newReview.rating,
        comment: newReview.comment,
        images: newReview.images ? newReview.images.split(',').map((url: any) => url.trim()).filter((url: any) => url) : [],
        video: newReview.video,
        createdAt: newReview.date
      });
      setIsPanelOpen(false);
      setNewReview({ productId: '', manualName: '', rating: 5, comment: '', images: '', video: '', date: new Date().toISOString().split('T')[0] });
      fetchReviews();
    } catch (error) {
      console.error("Failed to create review", error);
      alert("Failed to create review");
    }
  };

  const toggleApproval = async (id: string, currentStatus: string) => {
    try {
      await ReviewService.toggleApproval(id);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: currentStatus === 'approved' ? 'pending' : 'approved' } : r));
    } catch (error) {
      console.error("Failed to toggle status", error);
      fetchReviews();
    }
  };

  const deleteReview = async (id: string) => {
    if (confirm('Delete this review permanently?')) {
      try {
        await ReviewService.deleteReview(id);
        setReviews(prev => prev.filter(r => r.id !== id));
      } catch (error) {
        console.error("Failed to delete review", error);
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
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Customer Reviews</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <FiMessageSquare className="text-primary-500" />
            Moderate and manage your community feedback
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsPanelOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 active:scale-95 font-semibold"
          >
            <FiPlus /> Add Review
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <StatCard label="Total Feedback" value={reviews.length} icon={FiMessageSquare} color="text-blue-600" />
        <StatCard label="Awaiting Approval" value={reviews.filter(r => r.status === 'pending').length} icon={FiFilter} color="text-amber-500" />
        <StatCard label="Average Rating" value={(reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(1)} icon={FiStar} color="text-orange-500" />
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
          {(['all', 'pending', 'approved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${filter === f
                ? 'bg-black text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredReviews.map(review => (
          <div key={review.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  {/* Product Thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                    {review.productImage ? (
                      <img src={review.productImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <FiPackage size={24} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 line-clamp-1">{review.productName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex text-orange-400">
                        {[...Array(5)].map((_, i) => (
                          <FiStar key={i} size={14} className={i < review.rating ? 'fill-current' : 'text-gray-200'} />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full uppercase tracking-wider">{review.rating}.0</span>
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${review.status === 'approved' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                  {review.status}
                </div>
              </div>

              <div className="relative">
                <span className="absolute -left-2 -top-1 text-4xl text-gray-100 font-serif opacity-50">"</span>
                <p className="text-gray-600 text-sm leading-relaxed mb-4 pl-3 relative z-10 italic">
                  {review.comment}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-4 border-t border-gray-50 mt-auto">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-gray-900 font-bold">
                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-[10px]">
                      {review.userName.charAt(0)}
                    </div>
                    {review.userName}
                  </span>
                  <span className="text-gray-400 flex items-center gap-1">
                    <FiCalendar size={12} />
                    {review.date}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="px-6 py-3 bg-gray-50/50 flex justify-between items-center border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => toggleApproval(review.id, review.status)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${review.status === 'approved'
                  ? 'text-amber-600 border-amber-200 hover:bg-amber-100'
                  : 'text-green-600 border-green-200 hover:bg-green-100'
                  }`}
              >
                {review.status === 'approved' ? <><FiX /> Mark Pending</> : <><FiCheck /> Approve Now</>}
              </button>
              <button
                onClick={() => deleteReview(review.id)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold text-red-500 border border-red-100 hover:bg-red-50 transition-all"
              >
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        ))}
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
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsPanelOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl overflow-y-auto transform transition-transform duration-500 border-l border-gray-100">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-6 py-4 flex justify-between items-center border-b border-gray-100">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Manual Review</h2>
                <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-widest font-bold">Add customer feedback</p>
              </div>
              <button
                onClick={() => setIsPanelOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Product Selection */}
              <div>
                <label className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2 block flex items-center gap-2">
                  <FiPackage /> Target Product
                </label>
                <select
                  value={newReview.productId}
                  onChange={e => setNewReview({ ...newReview, productId: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all font-medium appearance-none"
                >
                  <option value="">Choose a product...</option>
                  {products.map(p => (
                    <option key={p.id || p._id} value={p.id || p._id}>{p.title || p.name}</option>
                  ))}
                </select>
              </div>

              {/* Author & Date Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2 block flex items-center gap-2">
                    <FiUser /> Customer Name
                  </label>
                  <input
                    type="text"
                    value={newReview.manualName}
                    onChange={e => setNewReview({ ...newReview, manualName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all font-medium"
                    placeholder="e.g. Rahul S."
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2 block flex items-center gap-2">
                    <FiCalendar /> Posting Date
                  </label>
                  <input
                    type="date"
                    value={newReview.date}
                    onChange={e => setNewReview({ ...newReview, date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all font-medium"
                  />
                </div>
              </div>

              {/* Enhanced Rating */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <label className="text-xs font-black uppercase text-gray-400 tracking-wider mb-3 block text-center">Satisfaction Level</label>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className={`text-3xl transition-all duration-200 ${star <= (hoverRating || newReview.rating) ? 'text-orange-400 scale-125' : 'text-gray-200 scale-100 hover:scale-110'}`}
                    >
                      <FiStar className={(star <= (hoverRating || newReview.rating)) ? 'fill-current' : ''} />
                    </button>
                  ))}
                </div>
                <p className="text-center text-[10px] font-bold text-gray-400 mt-3 uppercase tracking-widest">
                  {['Terrible', 'Poor', 'Average', 'Very Good', 'Excellent'][(hoverRating || newReview.rating) - 1]}
                </p>
              </div>

              {/* Comment Area */}
              <div>
                <label className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2 block">Review Narrative</label>
                <textarea
                  rows={4}
                  value={newReview.comment}
                  onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all font-medium"
                  placeholder="Share the customer's experience here..."
                />
              </div>

              {/* Multimedia */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2 block flex items-center gap-2">
                    <FiImage /> Image URLs
                  </label>
                  <input
                    type="text"
                    value={newReview.images}
                    onChange={(e: any) => setNewReview({ ...newReview, images: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all text-xs font-mono"
                    placeholder="https://...jpg, https://...png"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2 block flex items-center gap-2">
                    <FiVideo /> Video URL
                  </label>
                  <input
                    type="text"
                    value={newReview.video}
                    onChange={(e: any) => setNewReview({ ...newReview, video: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all text-xs font-mono"
                    placeholder="https://...mp4"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-gray-50 bg-white sticky bottom-0 z-10">
              <button
                onClick={handleCreateReview}
                className="w-full bg-black text-white font-black py-4 rounded-2xl hover:bg-gray-800 transition-all shadow-xl shadow-gray-200 active:scale-95 uppercase tracking-widest"
              >
                Publish Review
              </button>
              <button
                onClick={() => setIsPanelOpen(false)}
                className="w-full mt-3 py-3 text-gray-400 font-bold hover:text-gray-900 transition-colors text-sm"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-200/50 shadow-sm flex items-center justify-between group hover:border-gray-300 transition-all">
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <p className={`text-3xl font-black text-gray-900 tracking-tighter`}>{value}</p>
      </div>
    </div>
    <div className={`p-3 rounded-2xl bg-gray-50 ${color} group-hover:scale-110 transition-transform`}>
      <Icon size={24} />
    </div>
  </div>
);
