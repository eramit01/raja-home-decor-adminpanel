import { useState, useEffect } from 'react';
import { FiStar, FiCheck, FiX, FiTrash2, FiMessageSquare, FiPlus } from 'react-icons/fi';
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

  // Add Review State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({
    productId: '',
    manualName: '',
    rating: 5,
    comment: '',
    images: '',
    video: '',
    date: new Date().toISOString().split('T')[0] // Default today
  });

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
        date: new Date(r.createdAt).toLocaleDateString(),
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
        createdAt: newReview.date // Optional override if API supports it
      });
      setIsModalOpen(false);
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
      // Optimistic update
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: currentStatus === 'approved' ? 'pending' : 'approved' } : r));
      // toast.success(`Review ${currentStatus === 'approved' ? 'rejected' : 'approved'}`);
    } catch (error) {
      console.error("Failed to toggle status", error);
      // toast.error("Failed to update status");
      fetchReviews();
    }
  };

  const deleteReview = async (id: string) => {
    if (confirm('Delete this review permanently?')) {
      try {
        await ReviewService.deleteReview(id);
        setReviews(prev => prev.filter(r => r.id !== id));
        // toast.success("Review deleted");
      } catch (error) {
        console.error("Failed to delete review", error);
        // toast.error("Failed to delete review");
      }
    }
  };

  const filteredReviews = filter === 'all'
    ? reviews
    : reviews.filter(r => r.status === filter);

  if (isLoading) return <div>Loading reviews...</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Reviews</h1>
          <p className="text-sm text-gray-500">Moderate and manage product reviews</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <FiPlus /> Add Manual Review
          </button>
          <div className="flex bg-white p-1 rounded-lg border border-gray-200">
            {(['all', 'pending', 'approved'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === f
                  ? 'bg-black text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50'
                  }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Reviews" value={reviews.length} icon={FiMessageSquare} />
        <StatCard label="Pending" value={reviews.filter(r => r.status === 'pending').length} color="text-yellow-600" bg="bg-yellow-50" />
        <StatCard label="Avg Rating" value={(reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(1)} icon={FiStar} color="text-orange-500" />
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
        {filteredReviews.map(review => (
          <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex gap-6">
              {/* Product Image */}
              {review.productImage && (
                <img
                  src={review.productImage}
                  alt={review.productName}
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                />
              )}

              {/* Content */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{review.productName}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>by {review.userName}</span>
                      <span>•</span>
                      <span>{review.date}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${review.status === 'approved' ? 'bg-green-100 text-green-700' :
                    'bg-yellow-100 text-yellow-700'
                    }`}>
                    {review.status}
                  </span>
                </div>

                <div className="flex items-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      size={14}
                      className={`${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>

                <p className="text-gray-700 mb-4">"{review.comment}"</p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleApproval(review.id, review.status)}
                    className={`action-btn ${review.status === 'approved' ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                  >
                    {review.status === 'approved' ? <><FiX /> Reject</> : <><FiCheck /> Approve</>}
                  </button>

                  <button
                    onClick={() => deleteReview(review.id)}
                    className="action-btn text-red-600 hover:bg-red-50 ml-auto"
                  >
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredReviews.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No reviews found for this filter.
          </div>
        )}
      </div>

      <style>{`
                .action-btn { @apply flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-current; }
            `}</style>

      {/* Add Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Add Manual Review</h2>
              <button onClick={() => setIsModalOpen(false)}><FiX /></button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select
                  value={newReview.productId}
                  onChange={e => setNewReview({ ...newReview, productId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id || p._id} value={p.id || p._id}>{p.title || p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name (Manual)</label>
                <input
                  type="text"
                  value={newReview.manualName}
                  onChange={e => setNewReview({ ...newReview, manualName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className={`text-2xl ${star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Comment</label>
                <textarea
                  rows={3}
                  value={newReview.comment}
                  onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  placeholder="Great product..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URLs (comma separated)</label>
                <input
                  type="text"
                  value={newReview.images}
                  onChange={(e: any) => setNewReview({ ...newReview, images: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video URL (optional)</label>
                <input
                  type="text"
                  value={newReview.video}
                  onChange={(e: any) => setNewReview({ ...newReview, video: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  placeholder="https://example.com/video.mp4"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleCreateReview} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color = 'text-gray-900', bg = 'bg-white' }: any) => (
  <div className={`p-4 rounded-xl border border-gray-200 flex items-center justify-between ${bg}`}>
    <div>
      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
    {Icon && <Icon className={`opacity-20 ${color}`} size={32} />}
  </div>
);
