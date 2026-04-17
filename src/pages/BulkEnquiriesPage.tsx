import { useState, useEffect } from 'react';
import {
  FiMail, FiPhone, FiCalendar, FiCheckCircle,
  FiClock, FiArchive, FiPackage,
  FiTrendingUp,
  FiBriefcase, FiMessageSquare, FiCopy,
  FiX
} from 'react-icons/fi';
import { bulkEnquiryService, BulkEnquiry } from '../services/bulkEnquiry.service';
import { toast } from 'react-hot-toast';

export const BulkEnquiriesPage = () => {
  const [enquiries, setEnquiries] = useState<BulkEnquiry[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState<BulkEnquiry | null>(null);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const data = await bulkEnquiryService.getAllEnquiries(filter);
      const mapped = data.map((e: any) => ({
        ...e,
        id: e._id,
      }));
      setEnquiries(mapped);
    } catch (error) {
      console.error("Failed to load enquiries", error);
      toast.error("Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [filter]);

  const updateStatus = async (id: string, newStatus: BulkEnquiry['status']) => {
    try {
      setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
      await bulkEnquiryService.updateStatus(id, newStatus);
      toast.success(`Lead marked as ${newStatus}`);
      if (selectedEnquiry?.id === id) {
        setSelectedEnquiry(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error("Failed to update status", error);
      fetchEnquiries(); // Revert
      toast.error("Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'contacted': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'archived': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto font-outfit">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bulk Enquiry Inbox</h1>
          <p className="text-gray-500 text-sm mt-0.5 font-medium">Nurture B2B leads and manage corporate relationships</p>
        </div>

        <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
          {['all', 'pending', 'contacted', 'confirmed', 'rejected', 'archived'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${filter === f
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total Enquiries"
          value={enquiries.length}
          icon={FiMessageSquare}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          label="Pending Actions"
          value={enquiries.filter(e => e.status === 'pending' || e.status === 'contacted').length}
          icon={FiClock}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <StatCard
          label="Conversion Rate"
          value={enquiries.length ? `${Math.round((enquiries.filter(e => e.status === 'confirmed').length / enquiries.length) * 100)}%` : '0%'}
          icon={FiTrendingUp}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
      </div>

      {/* Content List */}
      <div className="space-y-3">
        {loading && enquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="w-12 h-12 border-4 border-gray-100 border-t-black rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 text-sm font-medium">Synchronizing enquiry data...</p>
          </div>
        ) : enquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-100">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <FiArchive className="text-gray-300 text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No enquiries found</h3>
            <p className="text-gray-500 text-sm font-medium text-center px-4">There are no {filter !== 'all' ? filter : ''} enquiries to display.</p>
          </div>
        ) : (
          enquiries.map(enquiry => (
            <div
              key={enquiry.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
              onClick={() => setSelectedEnquiry(enquiry)}
            >
              <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center">
                {/* User Info */}
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-center gap-3 mb-3 sm:mb-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black border whitespace-nowrap ${getStatusColor(enquiry.status)}`}>
                      {enquiry.status.toUpperCase()}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">{enquiry.name}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-[11px] sm:text-xs text-gray-500 font-medium">
                    <div className="flex items-center gap-2 min-w-0">
                      <FiBriefcase className="flex-shrink-0 text-indigo-500" size={14} />
                      <span className="truncate">{enquiry.company || 'Private Lead'}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <FiPhone className="flex-shrink-0 text-indigo-500" size={14} />
                      <span className="truncate">{enquiry.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <FiMail className="flex-shrink-0 text-indigo-500" size={14} />
                      <span className="truncate">{enquiry.email}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <FiPackage className="flex-shrink-0 text-indigo-500" size={14} />
                      <span className="truncate">{enquiry.category || 'General'}</span>
                    </div>
                  </div>
                </div>

                {/* Message Snippet */}
                <div className="w-full xl:flex-[0.8] bg-gray-50 p-3 rounded-xl border border-gray-100 relative group-hover:bg-gray-100 transition-colors">
                  <p className="text-xs text-gray-600 line-clamp-1 italic pr-16 leading-relaxed">
                    "{enquiry.message}"
                  </p>
                  <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-gray-100 shadow-sm">
                    <span className="text-[10px] font-black text-gray-900 leading-none">Qty: {enquiry.quantity}</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 w-full xl:w-auto xl:pl-4 xl:border-l border-gray-100 mt-2 xl:mt-0">
                  <div className="flex gap-2 w-full">
                    <ActionButton
                      icon={FiClock}
                      label="Engage"
                      color="text-blue-600"
                      bg="hover:bg-blue-50"
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); updateStatus(enquiry.id!, 'contacted'); }}
                      active={enquiry.status === 'contacted'}
                      small
                    />
                    <ActionButton
                      icon={FiCheckCircle}
                      label="Convert"
                      color="text-emerald-600"
                      bg="hover:bg-emerald-50"
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); updateStatus(enquiry.id!, 'confirmed'); }}
                      active={enquiry.status === 'confirmed'}
                      small
                    />
                    <ActionButton
                      icon={FiArchive}
                      label="Archive"
                      color="text-slate-500"
                      bg="hover:bg-slate-50"
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); updateStatus(enquiry.id!, 'archived'); }}
                      active={enquiry.status === 'archived'}
                      small
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detailed View Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative animate-slide-up">
            <button
              onClick={() => setSelectedEnquiry(null)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-all z-10"
            >
              <FiX size={18} />
            </button>

            <div className="pt-10 pb-6 px-8 border-b border-gray-50">
              <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border mb-3 inline-block ${getStatusColor(selectedEnquiry.status)}`}>
                Lead Status: {selectedEnquiry.status}
              </span>
              <h2 className="text-2xl font-bold text-gray-900">{selectedEnquiry.name}</h2>
              <p className="text-gray-500 text-sm font-medium flex items-center gap-2 mt-0.5">
                <FiBriefcase size={14} /> {selectedEnquiry.company || 'Self-employed / Private Enquiry'}
              </p>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <DetailItem
                  label="Email Address"
                  value={selectedEnquiry.email}
                  copy={() => copyToClipboard(selectedEnquiry.email, 'Email')}
                />
                <DetailItem
                  label="Mobile Number"
                  value={selectedEnquiry.phone}
                  copy={() => copyToClipboard(selectedEnquiry.phone, 'Phone')}
                />
                <DetailItem label="Requirement" value={selectedEnquiry.category || 'N/A'} />
                <DetailItem label="Quantity Needed" value={selectedEnquiry.quantity || 'N/A'} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Enquiry Message</label>
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 text-gray-800 text-sm leading-relaxed font-medium">
                  {selectedEnquiry.message}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 px-1">
                <div className="flex items-center gap-2">
                  <FiCalendar size={12} /> Submitted on {new Date(selectedEnquiry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div>ID: {selectedEnquiry.id?.slice(-8).toUpperCase()}</div>
              </div>
            </div>

            <div className="bg-gray-50 p-5 flex gap-3 px-8">
              <button
                onClick={() => updateStatus(selectedEnquiry.id!, 'contacted')}
                className="flex-1 bg-black text-white py-3.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all active:scale-[0.98]"
              >
                Mark as Contacted
              </button>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="px-6 bg-white border border-gray-200 text-gray-600 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, bg }: any) => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
    <div className={`w-12 h-12 ${bg} ${color} rounded-xl flex items-center justify-center`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
    </div>
  </div>
);

const DetailItem = ({ label, value, copy }: any) => (
  <div className="space-y-1 group">
    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-transparent group-hover:border-gray-200 transition-all">
      <span className="text-xs font-bold text-gray-800 truncate">{value}</span>
      {copy && (
        <button onClick={copy} className="text-gray-400 hover:text-black transition-colors">
          <FiCopy size={12} />
        </button>
      )}
    </div>
  </div>
);

const ActionButton = ({ icon: Icon, label, color, bg, onClick, active, small }: any) => (
  <button
    onClick={onClick}
    disabled={active}
    className={`${small ? 'flex-1' : 'w-full'} flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${active
      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
      : `bg-white text-gray-700 border-gray-100 shadow-sm ${bg} ${color} active:scale-95`
      }`}
  >
    <Icon size={small ? 16 : 14} className={active ? '' : color} />
    {!small && <span>{label}</span>}
  </button>
);
