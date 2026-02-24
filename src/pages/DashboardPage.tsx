import { useState, useEffect } from 'react';
import { FiShoppingBag, FiDollarSign, FiClock, FiTrendingUp } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { adminService } from '../services/admin.service';

const DashboardCard = ({ title, value, trend, trendUp, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between hover:shadow-md hover:border-accent/10 transition-all duration-300 group cursor-pointer">
    <div>
      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{value}</h3>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${trendUp ? 'text-accent' : 'text-red-500'}`}>
          <span>{trend}</span>
          {trendUp ? <span>&#8679;</span> : <span>&#8681;</span>}
          <span className="text-gray-400 ml-1 font-normal">vs last week</span>
        </div>
      )}
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon size={24} />
    </div>
  </div>
);

export const DashboardPage = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getDashboardStats();
        setStats(data.data);
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8">Loading dashboard...</div>;
  if (!stats) return <div className="p-8">Failed to load dashboard.</div>;

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of your store's performance today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue?.toLocaleString() || 0}`}
          trend="Live"
          trendUp={true}
          icon={FiDollarSign}
          color="bg-accent/10 text-accent"
        />
        <DashboardCard
          title="Total Orders"
          value={stats.totalOrders}
          trend={stats.pendingOrders > 0 ? `${stats.pendingOrders} Pending` : "All Processed"}
          trendUp={true}
          icon={FiShoppingBag}
          color="bg-accent/10 text-accent"
        />
        <DashboardCard
          title="Total Products"
          value={stats.totalProducts}
          trend="active"
          trendUp={true}
          icon={FiShoppingBag}
          color="bg-accent/10 text-accent"
        />
        <DashboardCard
          title="Enquiries"
          value={stats.pendingEnquiries}
          trend="Pending"
          trendUp={stats.pendingEnquiries === 0}
          icon={FiClock}
          color="bg-accent/10 text-accent"
        />
      </div>

      {/* Quick Links / Recent Activity Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders - Takes up 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
          <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <Link to="/orders" className="text-primary-900 hover:text-accent bg-accent/10 hover:bg-accent/20 px-5 py-2.5 rounded-xl font-bold transition-all border border-accent/10">View Orders</Link>
            <Link to="/products" className="text-primary-900 hover:text-accent bg-accent/10 hover:bg-accent/20 px-5 py-2.5 rounded-xl font-bold transition-all border border-accent/10">Manage Products</Link>
            <Link to="/bulk-enquiries" className="text-primary-900 hover:text-accent bg-accent/10 hover:bg-accent/20 px-5 py-2.5 rounded-xl font-bold transition-all border border-accent/10">B2B Enquiries</Link>
          </div>
        </div>

        {/* Top Products - Takes up 1/3 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-gray-900">Analytics</h2>
            <FiTrendingUp className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">More analytics coming soon.</p>
        </div>
      </div>
    </div>
  );
};
