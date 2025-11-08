import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock, FileText, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DashboardLayout } from '../layouts/DashboardLayout';

const HRDashboard = () => {
  const attendanceData = [
    { name: 'Mon', present: 280, absent: 5 },
    { name: 'Tue', present: 282, absent: 3 },
    { name: 'Wed', present: 285, absent: 0 },
    { name: 'Thu', present: 280, absent: 5 },
    { name: 'Fri', present: 275, absent: 10 },
  ];

  const leaveData = [
    { name: 'Approved', value: 42 },
    { name: 'Pending', value: 8 },
    { name: 'Rejected', value: 3 },
  ];

  const COLORS = ['#111827', '#6b7280', '#9ca3af'];

  const metrics = [
    { icon: Clock, label: 'Today Attendance', value: '285/290' },
    { icon: FileText, label: 'Pending Approvals', value: '12' },
    { icon: Users, label: 'Team Members', value: '145' },
    { icon: CheckCircle, label: 'Leave Balance', value: '450 days' },
  ];

  return (
    <DashboardLayout title="HR Dashboard">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{metric.label}</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">{metric.value}</h3>
                </div>
                <Icon className="w-8 h-8 text-gray-700" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Attendance Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Weekly Attendance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="present" fill="#111827" />
              <Bar dataKey="absent" fill="#6b7280" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leave Requests */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Leave Requests</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={leaveData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {leaveData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pending Approvals & Team Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Pending Approvals</h3>
            <AlertCircle className="w-5 h-5 text-gray-700" />
          </div>
          <div className="space-y-3">
            {[
              { emp: 'Alice Johnson', type: 'Leave Request', days: '5 days' },
              { emp: 'Bob Williams', type: 'Overtime Request', days: '3 hours' },
              { emp: 'Carol White', type: 'Leave Request', days: '3 days' },
              { emp: 'David Brown', type: 'Shift Change', days: 'Next week' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100"
                whileHover={{ x: 4 }}
              >
                <div>
                  <p className="text-gray-900 font-semibold text-sm">{item.emp}</p>
                  <p className="text-gray-600 text-xs">{item.type}</p>
                </div>
                <p className="text-gray-700 text-xs font-semibold">{item.days}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Team Messages */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Team Messages</h3>
          </div>
          <div className="space-y-4">
            {[
              { sender: 'HR Head', msg: 'Updated attendance policy', time: '1h ago' },
              { sender: 'Admin', msg: 'New payroll cycle started', time: '3h ago' },
              { sender: 'Finance', msg: 'Budget review on Friday', time: '5h ago' },
            ].map((msg, i) => (
              <motion.div
                key={i}
                className="p-3 bg-gray-50 rounded-lg border-l-2 border-gray-300 hover:bg-gray-100"
                whileHover={{ x: 4 }}
              >
                <p className="text-gray-900 font-semibold text-sm">{msg.sender}</p>
                <p className="text-gray-700 text-xs mt-1">{msg.msg}</p>
                <p className="text-gray-500 text-xs mt-2">{msg.time}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HRDashboard;
