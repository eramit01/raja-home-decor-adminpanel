import { useState, useEffect } from 'react';
import { FiMail, FiPhone, FiCalendar, FiCheckCircle, FiClock, FiArchive, FiUser, FiPackage } from 'react-icons/fi';
import { bulkEnquiryService, BulkEnquiry } from '../services/bulkEnquiry.service';
// import { toast } from 'react-hot-toast'; 

export const BulkEnquiriesPage = () => {
  const [enquiries, setEnquiries] = useState<BulkEnquiry[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const data = await bulkEnquiryService.getAllEnquiries(filter);
      const mapped = data.map((e: any) => ({
        ...e,
        id: e._id,
        quantity: e.quantity?.toString() || 'N/A',
      }));
      setEnquiries(mapped);
    } catch (error) {
      console.error("Failed to load enquiries", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [filter]);

  const updateStatus = async (id: string, newStatus: BulkEnquiry['status']) => {
    try {
      // Optimistic update
      setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
      await bulkEnquiryService.updateStatus(id, newStatus);
      // toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update status", error);
      fetchEnquiries(); // Revert
      // toast.error("Failed to update status");
      alert("Failed to update status");
    }
  };

  if (loading && enquiries.length === 0) {
    return <div className="p-8 text-center text-gray-500">Loading enquiries...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'contacted': return 'bg-yellow-100 text-yellow-700';
      case 'converted': return 'bg-green-100 text-green-700';
      case 'archived': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Enquiries</h1>
          <p className="text-sm text-gray-500">Manage B2B leads and corporate requests</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg border border-gray-200">
          {['all', 'new', 'contacted', 'converted', 'archived'].map(f => (
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

      <div className="space-y-4">
        {enquiries.map(enquiry => (
          <div key={enquiry.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              {/* Left: Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{enquiry.name}</h3>
                  {enquiry.companyName && (
                    <span className="text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">
                      🏢 {enquiry.companyName}
                    </span>
                  )}
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${getStatusColor(enquiry.status)}`}>
                    {enquiry.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <FiMail className="text-gray-400" /> {enquiry.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPhone className="text-gray-400" /> {enquiry.mobile}
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPackage className="text-gray-400" /> {enquiry.category}
                  </div>
                  <div className="flex items-center gap-2 font-medium text-gray-900">
                    Qty: {enquiry.quantity}
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-700 italic">
                  "{enquiry.message}"
                </div>
                {enquiry.adminNotes && (
                  <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    Note: {enquiry.adminNotes}
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                  <FiCalendar /> {new Date(enquiry.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="md:w-48 flex flex-col gap-2 border-l border-gray-100 pl-6 md:justify-center">
                <button
                  onClick={() => updateStatus(enquiry.id!, 'contacted')}
                  disabled={enquiry.status === 'contacted'}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <FiClock /> Mark Contacted
                </button>
                <button
                  onClick={() => updateStatus(enquiry.id!, 'converted')}
                  disabled={enquiry.status === 'converted'}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <FiCheckCircle /> Mark Sold
                </button>
                <button
                  onClick={() => updateStatus(enquiry.id!, 'archived')}
                  disabled={enquiry.status === 'archived'}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <FiArchive /> Archive
                </button>
              </div>
            </div>
          </div>
        ))}

        {enquiries.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
            <FiUser size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">No {filter !== 'all' ? filter : ''} enquiries found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
