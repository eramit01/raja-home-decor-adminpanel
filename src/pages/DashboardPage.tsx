import { useState, useEffect } from 'react';
import { FiShoppingBag, FiDollarSign, FiClock, FiTrendingUp, FiCalendar } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { adminService } from '../services/admin.service';

const DashboardCard = ({ title, value, meta, icon: Icon, iconClassName }: any) => (
  <div className="bg-white rounded-2xl border border-gray-200/60 p-5 flex items-start justify-between transition-shadow hover:shadow-sm">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-gray-600">{title}</p>
      <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">{value}</h3>
      {meta && (
        <div className="mt-3 inline-flex items-center gap-2">
          {meta.badge && (
            <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badge.className}`}>
              {meta.badge.dotClassName && <span className={`h-1.5 w-1.5 rounded-full ${meta.badge.dotClassName}`} />}
              <span>{meta.badge.text}</span>
            </span>
          )}
          {meta.helper && <span className="text-xs text-gray-500">{meta.helper}</span>}
        </div>
      )}
    </div>
    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${iconClassName}`}>
      <Icon size={18} />
    </div>
  </div>
);

export const DashboardPage = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState('all');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        let params: any = { _t: new Date().getTime() };

        const now = new Date();
        if (dateRange === 'today') {
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          params.startDate = start.toISOString();
          params.endDate = end.toISOString();
        } else if (dateRange === '7days') {
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0);
          const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          params.startDate = start.toISOString();
          params.endDate = end.toISOString();
        } else if (dateRange === '30days') {
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 0, 0, 0, 0);
          const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          params.startDate = start.toISOString();
          params.endDate = end.toISOString();
        } else if (dateRange === 'custom') {
          if (!customDates.start || !customDates.end) {
            setLoading(false);
            return;
          }
          const [startYear, startMonth, startDay] = customDates.start.split('-').map(Number);
          const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
          const [endYear, endMonth, endDay] = customDates.end.split('-').map(Number);
          const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
          params.startDate = start.toISOString();
          params.endDate = end.toISOString();
        }

        const data = await adminService.getDashboardStats(params);
        setStats(data.data);
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [dateRange, customDates.start, customDates.end]);

  if (loading && !stats) return <div className="p-8">Loading dashboard...</div>;
  if (!stats && !loading) return <div className="p-8">Failed to load dashboard.</div>;

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of your store's performance.</p>
        </div>

        {/* Date Filter */}
        <div className="flex flex-wrap items-center gap-3 bg-white px-3 py-2 rounded-xl border border-gray-200/60 shadow-sm">
          <FiCalendar className="text-gray-400" />
          <select
            className="bg-transparent border-none text-sm font-semibold text-gray-700 outline-none cursor-pointer pr-4"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 text-sm border-l pl-3 border-gray-200">
              <input
                type="date"
                className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 outline-none focus:border-accent text-gray-600"
                value={customDates.start}
                onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 outline-none focus:border-accent text-gray-600"
                value={customDates.end}
                onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue?.toLocaleString() || 0}`}
          icon={FiDollarSign}
          iconClassName="bg-accent/10 text-accent"
          meta={{
            badge: {
              text: 'Live',
              className: 'bg-emerald-50 text-emerald-700',
              dotClassName: 'bg-emerald-500'
            },
            helper: 'vs selected range'
          }}
        />
        <DashboardCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={FiShoppingBag}
          iconClassName="bg-accent/10 text-accent"
          meta={{
            badge: stats.pendingOrders > 0
              ? {
                text: `${stats.pendingOrders} Pending`,
                className: 'bg-amber-50 text-amber-700',
                dotClassName: 'bg-amber-500'
              }
              : {
                text: 'All processed',
                className: 'bg-emerald-50 text-emerald-700',
                dotClassName: 'bg-emerald-500'
              },
            helper: 'vs selected range'
          }}
        />
        <DashboardCard
          title="Total Products"
          value={stats.totalProducts}
          icon={FiShoppingBag}
          iconClassName="bg-accent/10 text-accent"
          meta={{
            badge: {
              text: 'Active',
              className: 'bg-slate-100 text-slate-700'
            },
            helper: 'vs selected range'
          }}
        />
        <DashboardCard
          title="Enquiries"
          value={stats.pendingEnquiries}
          icon={FiClock}
          iconClassName="bg-accent/10 text-accent"
          meta={{
            badge: stats.pendingEnquiries > 0
              ? {
                text: `${stats.pendingEnquiries} Pending`,
                className: 'bg-rose-50 text-rose-700',
                dotClassName: 'bg-rose-500'
              }
              : {
                text: 'None pending',
                className: 'bg-emerald-50 text-emerald-700',
                dotClassName: 'bg-emerald-500'
              },
            helper: 'vs selected range'
          }}
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
