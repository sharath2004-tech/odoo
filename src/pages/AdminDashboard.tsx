import { motion } from 'framer-motion';
import { Clock, IndianRupee, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { dashboardAPI } from '../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    attendanceRate: 0,
    monthlyPayroll: 0,
    totalDepartments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await dashboardAPI.getMetrics();
        if (response.data.success) {
          setMetrics(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const metricsDisplay = [
    { icon: Users, label: 'Total Employees', value: metrics.totalEmployees.toString(), change: '', trend: 'up' },
    { icon: Clock, label: 'Attendance Rate', value: `${metrics.attendanceRate}%`, change: '', trend: 'up' },
    { icon: IndianRupee, label: 'Monthly Payroll', value: `₹${(metrics.monthlyPayroll / 1000).toFixed(1)}K`, change: '', trend: 'up' },
    { icon: TrendingUp, label: 'Departments', value: metrics.totalDepartments.toString(), change: '', trend: 'up' },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Dashboard">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metricsDisplay.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <motion.div 
              key={i} 
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{metric.label}</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</h3>
                  {metric.change && (
                    <p className={`text-xs mt-2 ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.change}
                    </p>
                  )}
                </div>

                <Icon className="w-8 h-8 text-gray-700" />
              </div>
            </motion.div>
          );
        })}
      </div>



      {/* Quick Actions */}
      <motion.div 
        className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="heading-3">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Add Employee', icon: Users, path: '/employees' },
            { label: 'Generate Payroll', icon: IndianRupee , path: '/payroll' },
            { label: 'Mark Attendance', icon: Clock, path: '/attendance' },
            { label: 'View Reports', icon: TrendingUp, path: '/reports' },
          ].map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={i}
                onClick={() => navigate(action.path)}
                className="bg-gray-50 border border-gray-200 p-4 rounded-lg flex flex-col items-center gap-2 hover:bg-gray-100 transition-colors cursor-pointer"
                whileHover={{ y: -4 }}
              >
                <Icon className="w-6 h-6 text-gray-700" />
                <span className="text-gray-900 text-sm font-semibold">{action.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>


    </DashboardLayout>
  );
};

export default AdminDashboard;
