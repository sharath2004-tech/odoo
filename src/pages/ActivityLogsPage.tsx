import { motion } from 'framer-motion';
import { Activity, Filter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import type { ActivityLog } from '../types';

export const ActivityLogsPage = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, moduleFilter, actionFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/activity?limit=200', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    if (moduleFilter !== 'all') {
      filtered = filtered.filter(log => log.module === moduleFilter);
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    setFilteredLogs(filtered);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'UPDATE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DELETE':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'APPROVED':
      case 'REJECTED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <DashboardLayout title="Activity Logs">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-6 h-6 text-gray-700" />
          <h2 className="text-xl font-bold text-gray-900">System Activity Logs ({filteredLogs.length})</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={moduleFilter}
              onChange={e => setModuleFilter(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-10 py-3 text-gray-900"
            >
              <option value="all">All Modules</option>
              <option value="Users">Users</option>
              <option value="Leave">Leave</option>
              <option value="Payroll">Payroll</option>
              <option value="Attendance">Attendance</option>
              <option value="System">System</option>
            </select>
          </div>

          <div className="relative">
            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-10 py-3 text-gray-900"
            >
              <option value="all">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">Timestamp</th>
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">User</th>
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">Role</th>
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">Module</th>
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">Action</th>
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading activity logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No activity logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <motion.tr
                    key={log.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-semibold">{log.userName}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-gray-50 text-gray-700 border-gray-200">
                        {log.userRole.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{log.module}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-md truncate">{log.details}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};
