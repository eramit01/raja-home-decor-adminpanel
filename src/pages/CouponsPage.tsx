import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiTag, FiCopy, FiX } from 'react-icons/fi';
import { CouponService, Coupon } from '../services/coupon.service';
export const CouponsPage = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Simple form state
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    code: '',
    type: 'percentage', // Default matches backend enum
    value: 0,
    minCartValue: 0,
    expiryDate: '',
    isActive: true
  });

  const fetchCoupons = async () => {
    try {
      const data = await CouponService.getAllCoupons();
      // Map backend fields to frontend interface if needed
      const mapped = data.map((c: any) => ({
        ...c,
        id: c._id,
        minCartValue: c.minPurchase,
        expiryDate: c.validUntil ? new Date(c.validUntil).toISOString().split('T')[0] : '',
        isActive: c.status === 'active'
      }));
      setCoupons(mapped);
    } catch (error) {
      console.error("Failed to fetch coupons", error);
      // toast.error("Failed to load coupons");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Map frontend form to backend expectations
      const payload = {
        code: newCoupon.code,
        type: newCoupon.type, // 'percentage' or 'fixed' matches backend
        value: newCoupon.value, // number matches
        minPurchase: newCoupon.minCartValue,
        validFrom: new Date().toISOString(), // Start now
        validUntil: newCoupon.expiryDate ? new Date(newCoupon.expiryDate).toISOString() : new Date(Date.now() + 86400000 * 30).toISOString(),
        status: newCoupon.isActive ? 'active' : 'inactive'
      };

      await CouponService.createCoupon(payload);
      // toast.success("Coupon created successfully");
      setIsPanelOpen(false);
      setNewCoupon({ code: '', type: 'percentage', value: 0, minCartValue: 0, expiryDate: '', isActive: true });
      fetchCoupons(); // Refresh list
    } catch (error) {
      console.error("Failed to create coupon", error);
      alert("Failed to create coupon");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this coupon?')) {
      try {
        await CouponService.deleteCoupon(id);
        // toast.success("Coupon deleted");
        setCoupons(prev => prev.filter(c => c.id !== id));
      } catch (error) {
        console.error("Failed to delete coupon", error);
      }
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      // Optimistic update
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: newStatus } : c));

      await CouponService.updateCoupon(id, { status: newStatus ? 'active' : 'inactive' });
    } catch (error) {
      console.error("Failed to update status", error);
      fetchCoupons(); // Revert on failure
    }
  };

  if (isLoading) return <div>Loading coupons...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons & Discounts</h1>
          <p className="text-sm text-gray-500">Create global or specific discount codes</p>
        </div>
        <button
          onClick={() => setIsPanelOpen(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <FiPlus /> Create Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coupon Cards */}
        <div className="lg:col-span-2 space-y-4">
          {coupons.map(coupon => (
            <div key={coupon.id} className={`bg-white p-5 rounded-xl border ${coupon.isActive ? 'border-gray-200' : 'border-gray-100 bg-gray-50'} shadow-sm flex items-center justify-between group`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                  <FiTag size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-mono font-bold text-lg text-gray-900 tracking-wide">{coupon.code}</h3>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {coupon.isActive ? 'Active' : 'Expired'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {coupon.type === 'fixed' ? '₹' : ''}{coupon.value}{coupon.type === 'percentage' ? '% OFF' : ' OFF'}
                    {' • '}
                    Min Spend: ₹{coupon.minCartValue || 0}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Expires: {coupon.expiryDate} • Used: {coupon.usedCount}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleStatus(coupon.id, !!coupon.isActive)}
                  className="text-sm font-medium text-gray-500 hover:text-black"
                >
                  {coupon.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(coupon.id)}
                  className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}

          {coupons.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-500">No active coupons</p>
            </div>
          )}
        </div>

        {/* Quick Stats or Info */}
        <div className="bg-gradient-to-br from-primary-900 to-primary-800 text-white p-6 rounded-2xl h-fit">
          <h3 className="font-bold text-lg mb-4">Discount Strategy</h3>
          <ul className="space-y-4 text-sm text-primary-100">
            <li className="flex gap-3">
              <span className="bg-white/20 p-1 rounded h-fit mt-0.5">💡</span>
              <p>Percentage discounts (e.g., 20% Off) work best for lower-ticket items to increase volume.</p>
            </li>
            <li className="flex gap-3">
              <span className="bg-white/20 p-1 rounded h-fit mt-0.5">💡</span>
              <p>Fixed value discounts (e.g., ₹500 Off) are better for high-value items to protect margins.</p>
            </li>
          </ul>
        </div>
      </div>

      {/* Slide-over Panel for Creation */}
      {isPanelOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsPanelOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl p-6 overflow-y-auto transform transition-transform duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">New Coupon</h2>
              <button onClick={() => setIsPanelOpen(false)}><FiX size={24} /></button>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="label">Coupon Code</label>
                <div className="relative">
                  <input
                    type="text"
                    className="input uppercase tracking-wider font-mono bg-gray-50"
                    placeholder="e.g. SUMMER25"
                    required
                    value={newCoupon.code}
                    onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setNewCoupon({ ...newCoupon, code: Math.random().toString(36).substring(7).toUpperCase() })}
                    className="absolute right-2 top-2 text-xs text-primary-600 font-bold hover:underline"
                  >
                    AUTOGEN
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select
                    className="input"
                    value={newCoupon.type}
                    onChange={e => setNewCoupon({ ...newCoupon, type: e.target.value as any })}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Value</label>
                  <input
                    type="number"
                    className="input"
                    required
                    value={newCoupon.value}
                    onChange={e => setNewCoupon({ ...newCoupon, value: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Minimum Cart Value (₹)</label>
                <input
                  type="number"
                  className="input"
                  required
                  value={newCoupon.minCartValue}
                  onChange={e => setNewCoupon({ ...newCoupon, minCartValue: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="label">Expiry Date</label>
                <input
                  type="date"
                  className="input"
                  required
                  value={newCoupon.expiryDate}
                  onChange={e => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                />
              </div>

              <div className="pt-8">
                <button type="submit" className="w-full btn-primary py-3 text-lg">
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
                .label { @apply block text-sm font-medium text-gray-700 mb-1.5; }
                .input { @apply w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none; }
                .btn-primary { @apply bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-all shadow-md active:scale-95; }
            `}</style>
    </div>
  );
};
