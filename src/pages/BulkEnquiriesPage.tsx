import { useState, useEffect } from 'react';
import {
  FiMail, FiPhone, FiCalendar, FiCheckCircle,
  FiClock, FiArchive, FiPackage,
  FiXCircle, FiTrendingUp,
  FiBriefcase, FiHash, FiMessageSquare, FiCopy,
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
    <div className="p-8 max-w-[1600px] mx-auto font-outfit">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Bulk Enquiry Inbox</h1>
          <p className="text-gray-500 font-medium mt-1">Nurture B2B leads and manage corporate relationships</p>
        </div>

        <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          {['all', 'pending', 'contacted', 'confirmed', 'rejected', 'archived'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${filter === f
                ? 'bg-black text-white shadow-lg'
                : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
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
      <div className="space-y-4">
        {loading && enquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="w-16 h-16 border-4 border-gray-100 border-t-black rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Synchronizing enquiry data...</p>
          </div>
        ) : enquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <FiArchive className="text-gray-300 text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No enquiries found</h3>
            <p className="text-gray-500 font-medium">There are no {filter !== 'all' ? filter : ''} enquiries to display.</p>
          </div>
        ) : (
          enquiries.map(enquiry => (
            <div
              key={enquiry.id}
              className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer"
              onClick={() => setSelectedEnquiry(enquiry)}
            >
              <div className="flex flex-col lg:flex-row justify-between gap-8">
                <div className="flex-1 space-y-6">
                  <div className="flex items-start justify-between lg:justify-start lg:gap-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-black transition-colors">{enquiry.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <FiBriefcase className="text-gray-400 text-sm" />
                        <span className="text-sm font-semibold text-gray-500">{enquiry.company || 'Private Party'}</span>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold border self-start ${getStatusColor(enquiry.status)}`}>
                      {enquiry.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ContactInfo icon={FiMail} text={enquiry.email || 'N/A'} />
                    <ContactInfo icon={FiPhone} text={enquiry.phone || 'N/A'} />
                    <ContactInfo icon={FiPackage} text={enquiry.category || 'General Product'} />
                  </div>

                  <div className="relative">
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 text-gray-700 italic text-sm line-clamp-2 pb-8">
                      "{enquiry.message}"
                      <div className="absolute bottom-2 right-4 flex items-center gap-1.5 not-italic">
                        <FiHash className="text-gray-400 text-xs" />
                        <span className="text-xs font-bold text-gray-600">Qty: {enquiry.quantity}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex lg:flex-col items-center justify-center gap-3 lg:w-56 lg:pl-10 lg:border-l border-gray-50">
                  <ActionButton
                    icon={FiClock}
                    label="Engage"
                    color="text-blue-600"
                    bg="hover:bg-blue-50"
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); updateStatus(enquiry.id!, 'contacted'); }}
                    active={enquiry.status === 'contacted'}
                  />
                  <ActionButton
                    icon={FiCheckCircle}
                    label="Convert"
                    color="text-emerald-600"
                    bg="hover:bg-emerald-50"
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); updateStatus(enquiry.id!, 'confirmed'); }}
                    active={enquiry.status === 'confirmed'}
                  />
                  <div className="flex gap-2 w-full">
                    <ActionButton
                      icon={FiArchive}
                      label="Archive"
                      color="text-slate-600"
                      bg="hover:bg-slate-50"
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); updateStatus(enquiry.id!, 'archived'); }}
                      active={enquiry.status === 'archived'}
                      small
                    />
                    <ActionButton
                      icon={FiXCircle}
                      label="Reject"
                      color="text-rose-600"
                      bg="hover:bg-rose-50"
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); updateStatus(enquiry.id!, 'rejected'); }}
                      active={enquiry.status === 'rejected'}
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
          <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl relative animate-slide-up">
            <button
              onClick={() => setSelectedEnquiry(null)}
              className="absolute top-8 right-8 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-all z-10"
            >
              <FiX size={20} />
            </button>

            <div className="pt-12 pb-8 px-10 border-b border-gray-50">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border mb-4 inline-block ${getStatusColor(selectedEnquiry.status)}`}>
                Lead Status: {selectedEnquiry.status}
              </span>
              <h2 className="text-3xl font-bold text-gray-900">{selectedEnquiry.name}</h2>
              <p className="text-gray-500 font-medium flex items-center gap-2 mt-1">
                <FiBriefcase /> {selectedEnquiry.company || 'Self-employed / Private Enquiry'}
              </p>
            </div>

            <div className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-8">
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

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block ml-1">Enquiry Message</label>
                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 text-gray-800 leading-relaxed font-medium">
                  {selectedEnquiry.message}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
                <div className="flex items-center gap-2">
                  <FiCalendar /> Submitted on {new Date(selectedEnquiry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div>ID: {selectedEnquiry.id?.slice(-8).toUpperCase()}</div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 flex gap-3 px-10">
              <button
                onClick={() => updateStatus(selectedEnquiry.id!, 'contacted')}
                className="flex-1 bg-black text-white py-4 rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all active:scale-[0.98]"
              >
                Mark as Contacted
              </button>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="px-8 bg-white border border-gray-200 text-gray-600 py-4 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all"
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
  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6">
    <div className={`w-14 h-14 ${bg} ${color} rounded-2xl flex items-center justify-center shadow-inner`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
    </div>
  </div>
);

const ContactInfo = ({ icon: Icon, text }: any) => (
  <div className="flex items-center gap-3 group">
    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-gray-100 group-hover:text-black transition-colors">
      <Icon size={14} />
    </div>
    <span className="text-sm font-medium text-gray-600 truncate max-w-[180px]">{text}</span>
  </div>
);

const DetailItem = ({ label, value, copy }: any) => (
  <div className="space-y-1.5 group">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">{label}</label>
    <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl border border-transparent group-hover:border-gray-200 transition-all">
      <span className="text-sm font-bold text-gray-800 truncate">{value}</span>
      {copy && (
        <button onClick={copy} className="text-gray-400 hover:text-black transition-colors">
          <FiCopy size={14} />
        </button>
      )}
    </div>
  </div>
);

const ActionButton = ({ icon: Icon, label, color, bg, onClick, active, small }: any) => (
  <button
    onClick={onClick}
    disabled={active}
    className={`${small ? 'flex-1' : 'w-full'} flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all border ${active
      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
      : `bg-white text-gray-700 border-gray-100 shadow-sm ${bg} ${color} active:scale-95`
      }`}
  >
    <Icon className={active ? '' : color} />
    {!small && <span>{label}</span>}
  </button>
);
