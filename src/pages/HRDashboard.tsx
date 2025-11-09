import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock, FileText, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface AttendanceData {
  name: string;
  present: number;
  absent: number;
}

interface LeaveData {
  name: string;
  value: number;
}

interface PendingApproval {
  id: number;
  employeeName: string;
  type: string;
  details: string;
}

const HRDashboard = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [leaveData, setLeaveData] = useState<LeaveData[]>([]);
  const [todayAttendance, setTodayAttendance] = useState({ present: 0, total: 0 });
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalLeaveBalance, setTotalLeaveBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#111827', '#6b7280', '#9ca3af'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);

      // Fetch employees count
      const employeesResponse = await fetch('http://localhost:5000/api/employees', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const employeesData = await employeesResponse.json();
      if (employeesData.success) {
        setTotalEmployees(employeesData.data.length);
      }

      // Fetch attendance data for the week
      const attendanceResponse = await fetch('http://localhost:5000/api/attendance', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const attendanceResult = await attendanceResponse.json();
      if (attendanceResult.success) {
        processAttendanceData(attendanceResult.data, employeesData.data.length);
      }

      // Fetch leave requests
      const leaveResponse = await fetch('http://localhost:5000/api/leave', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const leaveResult = await leaveResponse.json();
      if (leaveResult.success) {
        processLeaveData(leaveResult.data);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAttendanceData = (data: any[], totalEmployees: number) => {
    // Get last 5 days of attendance
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const today = new Date();
    const weekData: AttendanceData[] = [];

    // Group attendance by date
    const attendanceByDate: { [key: string]: any[] } = {};
    data.forEach((record) => {
      const date = new Date(record.date).toDateString();
      if (!attendanceByDate[date]) {
        attendanceByDate[date] = [];
      }
      attendanceByDate[date].push(record);
    });

    // Get last 5 weekdays
    for (let i = 4; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const dayName = days[date.getDay() - 1] || days[0];

      const dayRecords = attendanceByDate[dateStr] || [];
      const present = dayRecords.filter((r) => 
        r.status === 'present' || r.status === 'half_day'
      ).length;
      const absent = dayRecords.filter((r) => r.status === 'absent').length;

      weekData.push({
        name: dayName,
        present,
        absent: Math.max(0, totalEmployees - present - absent),
      });
    }

    setAttendanceData(weekData);

    // Set today's attendance
    const todayStr = today.toDateString();
    const todayRecords = attendanceByDate[todayStr] || [];
    const presentToday = todayRecords.filter((r) => 
      r.status === 'present' || r.status === 'half_day'
    ).length;
    setTodayAttendance({ present: presentToday, total: totalEmployees });
  };

  const processLeaveData = (data: any[]) => {
    const approved = data.filter((l) => l.status === 'approved').length;
    const pending = data.filter((l) => l.status === 'pending').length;
    const rejected = data.filter((l) => l.status === 'rejected').length;

    setLeaveData([
      { name: 'Approved', value: approved },
      { name: 'Pending', value: pending },
      { name: 'Rejected', value: rejected },
    ]);

    // Get pending leave approvals
    const pendingLeaves = data
      .filter((l) => l.status === 'pending')
      .slice(0, 4)
      .map((l) => ({
        id: l.id,
        employeeName: l.employeeName || l.employee_name || 'Unknown',
        type: 'Leave Request',
        details: `${l.days || 1} days`,
      }));

    setPendingApprovals(pendingLeaves);

    // Calculate total leave balance (approved leaves)
    const totalDays = data
      .filter((l) => l.status === 'approved')
      .reduce((sum, l) => sum + (l.days || 0), 0);
    setTotalLeaveBalance(totalDays);
  };

  const metrics = [
    { icon: Clock, label: 'Today Attendance', value: `${todayAttendance.present}/${todayAttendance.total}` },
    { icon: FileText, label: 'Pending Approvals', value: `${pendingApprovals.length}` },
    { icon: Users, label: 'Team Members', value: `${totalEmployees}` },
    { icon: CheckCircle, label: 'Leave Balance', value: `${totalLeaveBalance} days` },
  ];

  return (
    <DashboardLayout title="HR Dashboard">
      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
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
                {pendingApprovals.length > 0 ? (
                  pendingApprovals.map((item) => (
                    <motion.div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100"
                      whileHover={{ x: 4 }}
                    >
                      <div>
                        <p className="text-gray-900 font-semibold text-sm">{item.employeeName}</p>
                        <p className="text-gray-600 text-xs">{item.type}</p>
                      </div>
                      <p className="text-gray-700 text-xs font-semibold">{item.details}</p>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No pending approvals</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
              </div>
              <div className="space-y-4">
                {attendanceData.length > 0 ? (
                  <>
                    <motion.div
                      className="p-3 bg-gray-50 rounded-lg border-l-2 border-gray-300 hover:bg-gray-100"
                      whileHover={{ x: 4 }}
                    >
                      <p className="text-gray-900 font-semibold text-sm">Attendance Update</p>
                      <p className="text-gray-700 text-xs mt-1">
                        {todayAttendance.present} employees marked present today
                      </p>
                      <p className="text-gray-500 text-xs mt-2">Today</p>
                    </motion.div>
                    {leaveData.find(l => l.name === 'Pending' && l.value > 0) && (
                      <motion.div
                        className="p-3 bg-gray-50 rounded-lg border-l-2 border-gray-300 hover:bg-gray-100"
                        whileHover={{ x: 4 }}
                      >
                        <p className="text-gray-900 font-semibold text-sm">Leave Requests</p>
                        <p className="text-gray-700 text-xs mt-1">
                          {leaveData.find(l => l.name === 'Pending')?.value} pending leave requests
                        </p>
                        <p className="text-gray-500 text-xs mt-2">Needs Review</p>
                      </motion.div>
                    )}
                    <motion.div
                      className="p-3 bg-gray-50 rounded-lg border-l-2 border-gray-300 hover:bg-gray-100"
                      whileHover={{ x: 4 }}
                    >
                      <p className="text-gray-900 font-semibold text-sm">Team Status</p>
                      <p className="text-gray-700 text-xs mt-1">
                        {totalEmployees} active team members
                      </p>
                      <p className="text-gray-500 text-xs mt-2">Current</p>
                    </motion.div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default HRDashboard;
