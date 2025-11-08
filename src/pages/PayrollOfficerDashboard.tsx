import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Clock, DollarSign, FileText, Users, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';

export const PayrollOfficerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
    totalEmployees: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch leave statistics
      const leaveResponse = await fetch('http://localhost:5000/api/leave/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const leaveData = await leaveResponse.json();

      if (leaveData.success) {
        setStats(prev => ({
          ...prev,
          pendingLeaves: leaveData.data.pending || 0,
          approvedLeaves: leaveData.data.approved || 0,
          rejectedLeaves: leaveData.data.rejected || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: Calendar, label: 'Manage Leave Requests', path: '/leaves', color: 'blue' },
    { icon: DollarSign, label: 'Process Payroll', path: '/payroll', color: 'green' },
    { icon: FileText, label: 'Generate Reports', path: '/reports', color: 'purple' },
    { icon: Users, label: 'Employee List', path: '/employees', color: 'gray' },
  ];

  return (
    <DashboardLayout title="Payroll Officer Dashboard">
      {/* Welcome Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, Payroll Officer</h2>
        <p className="text-gray-600">Manage leave requests and process payroll efficiently</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <motion.div
          className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.pendingLeaves}</span>
          </div>
          <p className="text-gray-700 font-semibold">Pending Leave Requests</p>
          <p className="text-gray-500 text-sm mt-1">Awaiting your approval</p>
        </motion.div>

        <motion.div
          className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.approvedLeaves}</span>
          </div>
          <p className="text-gray-700 font-semibold">Approved This Month</p>
          <p className="text-gray-500 text-sm mt-1">Leave requests approved</p>
        </motion.div>

        <motion.div
          className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.rejectedLeaves}</span>
          </div>
          <p className="text-gray-700 font-semibold">Rejected This Month</p>
          <p className="text-gray-500 text-sm mt-1">Leave requests declined</p>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={index}
              onClick={() => navigate(action.path)}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <action.icon className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-900 font-semibold text-sm text-center">{action.label}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Pending Approvals</h3>
          <button
            onClick={() => navigate('/leaves')}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            View All
          </button>
        </div>
        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading...</p>
        ) : stats.pendingLeaves === 0 ? (
          <p className="text-gray-500 text-center py-8">No pending leave requests</p>
        ) : (
          <p className="text-gray-700">
            You have <span className="font-bold text-gray-900">{stats.pendingLeaves}</span> leave requests waiting for approval.
            Click "View All" to manage them.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
};
