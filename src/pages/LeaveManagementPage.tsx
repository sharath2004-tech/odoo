import { motion } from 'framer-motion';
import { Calendar, Check, CheckCircle, Clock, Filter, Plus, Search, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import type { LeaveRequest } from '../types';

export const LeaveManagementPage = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [filteredLeaves, setFilteredLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
    certificateUrl: '',
    days: 1,
  });

  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalApprovedDays: 0,
  });

  const userRole = user?.role || '';

  // Check if form is valid
  const isFormValid = () => {
    // Check basic required fields
    if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason.trim() || formData.days < 1) {
      return false;
    }

    // Check reason length
    if (formData.reason.trim().length < 10) {
      return false;
    }

    // Check certificate requirement for specific leave types
    const requiresCertificate = ['sick', 'maternity', 'paternity'].includes(formData.leaveType);
    if (requiresCertificate && !certificateFile && !formData.certificateUrl) {
      return false;
    }

    // Check date validity
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    if (startDate > endDate) {
      return false;
    }

    return true;
  };

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Employees see only their own leaves
      const endpoint = userRole === 'employee' 
        ? 'http://localhost:5000/api/leave/my-leaves'
        : 'http://localhost:5000/api/leave';
      
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setLeaves(data.data);
      } else {
        console.error('Failed to fetch leaves:', data.message);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Only managers can see stats
      if (userRole === 'employee') return;
      
      const response = await fetch('http://localhost:5000/api/leave/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      } else {
        console.error('Failed to fetch stats:', data.message);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterLeaves = () => {
    let filtered = [...leaves];

    if (searchTerm) {
      filtered = filtered.filter(leave =>
        leave.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(leave => leave.status === statusFilter);
    }

    setFilteredLeaves(filtered);
  };

  useEffect(() => {
    if (userRole) {
      fetchLeaves();
      fetchStats();
    }
  }, [userRole]);

  useEffect(() => {
    filterLeaves();
  }, [leaves, searchTerm, statusFilter]);

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: Check all required fields
    if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason || formData.days < 1) {
      alert('Please fill in all required fields.');
      return;
    }

    // Validation: Check reason length
    if (formData.reason.trim().length < 10) {
      alert('Please provide a detailed reason (at least 10 characters).');
      return;
    }

    // Validation: Check certificate requirement
    const requiresCertificate = ['sick', 'maternity', 'paternity'].includes(formData.leaveType);
    if (requiresCertificate && !certificateFile && !formData.certificateUrl) {
      alert(`Certificate is required for ${formData.leaveType} leave. Please upload a file or provide a URL.`);
      return;
    }

    // Validation: Check date validity
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    if (startDate > endDate) {
      alert('End date must be after or equal to start date.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('leaveType', formData.leaveType);
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('endDate', formData.endDate);
      formDataToSend.append('reason', formData.reason);
      formDataToSend.append('days', formData.days.toString());
      
      // Add certificate file or URL
      if (certificateFile) {
        formDataToSend.append('certificate', certificateFile);
      } else if (formData.certificateUrl) {
        formDataToSend.append('certificateUrl', formData.certificateUrl);
      }
      
      const response = await fetch('http://localhost:5000/api/leave', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });
      const data = await response.json();
      if (data.success) {
        alert('Leave request submitted successfully!');
        setShowCreateModal(false);
        setFormData({ leaveType: 'casual', startDate: '', endDate: '', reason: '', certificateUrl: '', days: 1 });
        setCertificateFile(null);
        await fetchLeaves();
        await fetchStats();
      } else {
        alert('Failed to submit leave request: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating leave:', error);
      alert('Error submitting leave request. Please try again.');
    }
  };

  const handleApproveReject = async (leaveId: string, status: 'approved' | 'rejected') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/leave/${leaveId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`Leave request ${status} successfully!`);
        await fetchLeaves();
        await fetchStats();
      } else {
        alert(`Failed to ${status} leave: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating leave status:', error);
      alert(`Error ${status === 'approved' ? 'approving' : 'rejecting'} leave request. Please try again.`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    switch (type) {
      case 'sick':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'casual':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'annual':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const canManageLeaves = ['admin', 'hr', 'payroll'].includes(userRole);

  return (
    <DashboardLayout title="Leave Management">
      {/* Statistics Cards - Only for managers */}
      {canManageLeaves && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Requests</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</h3>
              </div>
              <Calendar className="w-8 h-8 text-gray-700" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending</p>
                <h3 className="text-2xl font-bold text-yellow-600 mt-2">{stats.pending}</h3>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Approved</p>
                <h3 className="text-2xl font-bold text-green-600 mt-2">{stats.approved}</h3>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Rejected</p>
                <h3 className="text-2xl font-bold text-red-600 mt-2">{stats.rejected}</h3>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Approved Days</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.totalApprovedDays}</h3>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      )}

      {/* Header and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {canManageLeaves ? `All Leave Requests (${filteredLeaves.length})` : `My Leave Requests (${filteredLeaves.length})`}
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow"
          >
            <Plus size={20} />
            Request Leave
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {canManageLeaves && (
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by employee name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-10 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-500"
              />
            </div>
          )}

          <div className="relative">
            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-10 py-3 text-gray-900 focus:outline-none focus:border-gray-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leaves Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {canManageLeaves && (
                  <th className="px-6 py-4 text-left text-gray-700 font-semibold">Employee</th>
                )}
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">Leave Type</th>
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">Start Date</th>
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">End Date</th>
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">Days</th>
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">Reason</th>
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">Certificate</th>
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">Status</th>
                {canManageLeaves && (
                  <th className="px-6 py-4 text-left text-gray-700 font-semibold">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canManageLeaves ? 9 : 7} className="px-6 py-8 text-center text-gray-500">
                    Loading leave requests...
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={canManageLeaves ? 9 : 7} className="px-6 py-8 text-center text-gray-500">
                    No leave requests found
                  </td>
                </tr>
              ) : (
                filteredLeaves.map(leave => (
                  <motion.tr
                    key={leave.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {canManageLeaves && (
                      <td className="px-6 py-4 text-gray-900 font-semibold">{leave.employeeName}</td>
                    )}
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getLeaveTypeBadge(leave.leaveType)}`}>
                        {leave.leaveType.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{new Date(leave.startDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(leave.endDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-900 font-semibold">{leave.days}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{leave.reason}</td>
                    <td className="px-6 py-4">
                      {leave.certificateUrl ? (
                        <button
                          onClick={() => {
                            const fullUrl = leave.certificateUrl!.startsWith('http') 
                              ? leave.certificateUrl! 
                              : `http://localhost:5000${leave.certificateUrl}`;
                            setSelectedCertificate(fullUrl);
                            setShowCertificateModal(true);
                          }}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">No certificate</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(leave.status)}`}>
                        {leave.status.toUpperCase()}
                      </span>
                    </td>
                    {canManageLeaves && (
                      <td className="px-6 py-4">
                        {leave.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            {leave.certificateUrl && (
                              <button
                                onClick={() => {
                                  const fullUrl = leave.certificateUrl!.startsWith('http') 
                                    ? leave.certificateUrl! 
                                    : `http://localhost:5000${leave.certificateUrl}`;
                                  setSelectedCertificate(fullUrl);
                                  setShowCertificateModal(true);
                                }}
                                className="p-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg"
                                title="View Certificate"
                              >
                                <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handleApproveReject(leave.id, 'approved')}
                              className="p-2 bg-green-50 border border-green-200 hover:bg-green-100 rounded-lg"
                              title="Approve"
                            >
                              <Check size={16} className="text-green-700" />
                            </button>
                            <button
                              onClick={() => handleApproveReject(leave.id, 'rejected')}
                              className="p-2 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg"
                              title="Reject"
                            >
                              <X size={16} className="text-red-700" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Leave Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            className="bg-white rounded-lg p-6 max-w-lg w-full my-8 max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Request Leave</h3>
            <form onSubmit={handleCreateLeave} className="space-y-3">
              <div>
                <label className="block text-gray-700 text-xs font-medium mb-1">
                  Leave Type<span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  value={formData.leaveType}
                  onChange={e => {
                    setFormData({ ...formData, leaveType: e.target.value });
                    setCertificateFile(null);
                  }}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
                  required
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave (Certificate Required)</option>
                  <option value="annual">Annual Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                  <option value="maternity">Maternity Leave (Certificate Required)</option>
                  <option value="paternity">Paternity Leave (Certificate Required)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 text-xs font-medium mb-1">
                    Start Date<span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => {
                      const startDate = e.target.value;
                      setFormData({ ...formData, startDate });
                      
                      // Auto-calculate days if both dates are set
                      if (startDate && formData.endDate) {
                        const start = new Date(startDate);
                        const end = new Date(formData.endDate);
                        const diffTime = end.getTime() - start.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                        if (diffDays > 0) {
                          setFormData(prev => ({ ...prev, startDate, days: diffDays }));
                        }
                      }
                    }}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-medium mb-1">
                    End Date<span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => {
                      const endDate = e.target.value;
                      setFormData({ ...formData, endDate });
                      
                      // Auto-calculate days if both dates are set
                      if (formData.startDate && endDate) {
                        const start = new Date(formData.startDate);
                        const end = new Date(endDate);
                        const diffTime = end.getTime() - start.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                        if (diffDays > 0) {
                          setFormData(prev => ({ ...prev, endDate, days: diffDays }));
                        }
                      }
                    }}
                    className={`w-full bg-white border rounded-md px-3 py-2 text-sm text-gray-900 ${
                      formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)
                        ? 'border-red-300'
                        : 'border-gray-300'
                    }`}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>
              {formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate) && (
                <p className="text-xs text-red-500 -mt-2">⚠️ End date must be after or equal to start date</p>
              )}
              {formData.startDate && formData.endDate && new Date(formData.endDate) >= new Date(formData.startDate) && (
                <p className="text-xs text-green-600 -mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formData.days} day{formData.days !== 1 ? 's' : ''} (auto-calculated)
                </p>
              )}
              <div>
                <label className="block text-gray-700 text-xs font-medium mb-1">
                  Number of Days
                  <span className="text-gray-400 ml-1 text-xs">(Auto-calculated)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.days}
                  readOnly
                  className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 cursor-not-allowed"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-xs font-medium mb-1">
                  Reason<span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  className={`w-full bg-white border rounded-md px-3 py-2 text-sm text-gray-900 ${
                    formData.reason.trim().length > 0 && formData.reason.trim().length < 10
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                  rows={2}
                  placeholder="Provide a detailed reason (min 10 characters)"
                  required
                />
                <p className={`text-xs mt-1 ${
                  formData.reason.trim().length < 10 ? 'text-red-500' : 'text-green-600'
                }`}>
                  {formData.reason.trim().length < 10 
                    ? `⚠️ ${formData.reason.trim().length}/10 characters`
                    : `✓ ${formData.reason.trim().length} characters`
                  }
                </p>
              </div>
              <div>
                <label className="block text-gray-700 text-xs font-medium mb-1">
                  Certificate
                  {['sick', 'maternity', 'paternity'].includes(formData.leaveType) && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                
                {/* File Upload Option */}
                <label className="flex items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-md px-3 py-3 cursor-pointer hover:border-gray-400 transition-colors mb-2">
                  <div className="text-center">
                    <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-1 text-xs text-gray-600">
                      {certificateFile ? (
                        <span className="font-medium text-green-600">✓ {certificateFile.name}</span>
                      ) : (
                        <>
                          <span className="font-semibold text-blue-600">Upload file</span>
                          <span className="text-gray-500"> (JPG, PDF, 10MB max)</span>
                        </>
                      )}
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf,.gif,.webp,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          alert('File size too large. Maximum 10MB allowed.');
                          return;
                        }
                        setCertificateFile(file);
                        setFormData({ ...formData, certificateUrl: '' });
                      }
                    }}
                    required={['sick', 'maternity', 'paternity'].includes(formData.leaveType) && !certificateFile && !formData.certificateUrl}
                  />
                </label>

                {/* OR Divider */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-400">OR</span>
                  </div>
                </div>

                {/* URL Input Option */}
                <input
                  type="url"
                  value={formData.certificateUrl}
                  onChange={(e) => {
                    setFormData({ ...formData, certificateUrl: e.target.value });
                    if (e.target.value) setCertificateFile(null);
                  }}
                  placeholder="Enter certificate URL"
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
                  disabled={!!certificateFile}
                />
                
                {['sick', 'maternity', 'paternity'].includes(formData.leaveType) && (
                  <p className="text-xs text-red-500 mt-1">⚠️ Required for this leave type</p>
                )}
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={!isFormValid()}
                  className={`flex-1 font-semibold py-2 px-4 rounded-md text-sm transition-all ${
                    isFormValid()
                      ? 'bg-gray-900 hover:bg-gray-800 text-white cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                  }`}
                  title={!isFormValid() ? 'Please fill in all required fields correctly' : 'Submit leave request'}
                >
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ leaveType: 'casual', startDate: '', endDate: '', reason: '', certificateUrl: '', days: 1 });
                    setCertificateFile(null);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2 px-4 rounded-md text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Certificate Viewing Modal */}
      {showCertificateModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowCertificateModal(false)}>
          <motion.div
            className="bg-white rounded-lg p-4 max-w-4xl w-full max-h-[90vh] overflow-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Leave Certificate</h3>
              <div className="flex gap-2">
                <a
                  href={selectedCertificate}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md font-medium"
                >
                  Open in New Tab
                </a>
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Close"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              {selectedCertificate.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                // Image preview
                <img
                  src={selectedCertificate}
                  alt="Certificate"
                  className="w-full h-auto max-h-[70vh] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="flex flex-col items-center justify-center py-12"><svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><p class="mt-4 text-gray-600">Failed to load image</p><a href="' + selectedCertificate + '" target="_blank" class="mt-2 text-blue-600 hover:underline">Open in new tab</a></div>';
                    }
                  }}
                />
              ) : selectedCertificate.match(/\.pdf$/i) ? (
                // PDF preview
                <iframe
                  src={selectedCertificate}
                  className="w-full h-[70vh]"
                  title="Certificate PDF"
                />
              ) : (
                // Other files - show download option
                <div className="flex flex-col items-center justify-center py-12">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-4 text-gray-600 font-medium">Document Preview Not Available</p>
                  <p className="text-sm text-gray-500 mt-1">Click "Open in New Tab" to view or download the file</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
};
