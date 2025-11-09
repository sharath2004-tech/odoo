import { motion } from 'framer-motion';
import { Calendar, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { GlassCard } from '../components/GlassCard';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { attendanceAPI } from '../services/api';

interface AttendanceRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  department: string | null;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  notes: string | null;
}

interface UserData {
  id: number;
  role: string;
  full_name: string;
  email: string;
}

const AttendancePage = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterDept, setFilterDept] = useState('');
  const [todayAttendance, setTodayAttendance] = useState<{checkIn: string | null, checkOut: string | null}>({checkIn: null, checkOut: null});
  const [monthlyStats, setMonthlyStats] = useState({
    daysPresent: 0,
    leavesTaken: 0,
    totalWorkingDays: 0
  });

  // Fetch today's attendance for current user
  useEffect(() => {
    const fetchTodayAttendance = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Use the new /today endpoint
        const response = await fetch('http://localhost:5000/api/attendance/today', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success && data.data) {
          setTodayAttendance({
            checkIn: data.data.check_in,
            checkOut: data.data.check_out
          });
          console.log('📅 Today\'s attendance status:', data.data);
        }
      } catch (error) {
        console.error('Failed to fetch today\'s attendance:', error);
      }
    };
    fetchTodayAttendance();
  }, []);

  // Fetch monthly attendance statistics for current user
  useEffect(() => {
    const fetchMonthlyStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Get current month's first and last day
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        // Calculate total working days (excluding weekends)
        let workingDays = 0;
        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
          const dayOfWeek = d.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
            workingDays++;
          }
        }
        
        // Fetch attendance records for current month
        const startDate = firstDay.toISOString().split('T')[0];
        const endDate = lastDay.toISOString().split('T')[0];
        
        const response = await fetch(`http://localhost:5000/api/attendance?startDate=${startDate}&endDate=${endDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
          const myRecords = data.data.filter((a: AttendanceRecord) => a.employee_id === Number(user.id));
          const daysPresent = myRecords.filter((a: AttendanceRecord) => a.status === 'present').length;
          const leavesTaken = myRecords.filter((a: AttendanceRecord) => 
            a.status === 'leave' || a.status === 'half_day'
          ).length;
          
          setMonthlyStats({
            daysPresent,
            leavesTaken,
            totalWorkingDays: workingDays
          });
        }
      } catch (error) {
        console.error('Failed to fetch monthly stats:', error);
      }
    };
    fetchMonthlyStats();
  }, []);

  // Fetch attendance records
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const params: { date?: string; department?: string } = {};
        if (selectedDate) params.date = selectedDate;
        if (filterDept) params.department = filterDept;

        const response = await attendanceAPI.getAll(params);
        if (response.data.success) {
          let filteredData = response.data.data;
          
          // If user is employee role, filter to show only other employees (exclude admin, hr, payroll)
          if (user.role === 'employee') {
            // Fetch user details to get roles
            const token = localStorage.getItem('token');
            const usersResponse = await fetch('http://localhost:5000/api/users', {
              headers: { Authorization: `Bearer ${token}` }
            });
            const usersData = await usersResponse.json();
            
            if (usersData.success) {
              // Create a map of employee_id to role
              const employeeRoles = new Map<number, string>();
              usersData.data.forEach((u: UserData) => {
                employeeRoles.set(u.id, u.role);
              });
              
              // Filter to only show employees with 'employee' role
              filteredData = filteredData.filter((record: AttendanceRecord) => {
                const role = employeeRoles.get(record.employee_id);
                return role === 'employee';
              });
            }
          }
          
          setAttendanceData(filteredData);
        }
      } catch (error) {
        console.error('Failed to fetch attendance:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [selectedDate, filterDept]);

  const refreshTodayAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/attendance/today', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        setTodayAttendance({
          checkIn: data.data.check_in,
          checkOut: data.data.check_out
        });
      }
    } catch (error) {
      console.error('Failed to refresh attendance:', error);
    }
  };

  const handleCheckIn = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/attendance/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setTodayAttendance({ 
          checkIn: data.data.check_in, 
          checkOut: null 
        });
        alert(`✅ Check-in successful at ${formatTime(data.data.check_in)}!`);
        console.log('✅ Checked in:', data.data);
        
        // Refresh the attendance list to show updated status
        const params: { date?: string; department?: string } = {};
        if (selectedDate) params.date = selectedDate;
        if (filterDept) params.department = filterDept;
        const attResponse = await attendanceAPI.getAll(params);
        if (attResponse.data.success) {
          setAttendanceData(attResponse.data.data);
        }
      } else {
        alert('⚠️ ' + data.message);
      }
    } catch (error) {
      console.error('Check-in error:', error);
      alert('❌ Error checking in. Please try again.');
    }
  };

  const handleCheckOut = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/attendance/checkout', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setTodayAttendance({ 
          ...todayAttendance, 
          checkOut: data.data.check_out 
        });
        alert(`✅ Check-out successful at ${formatTime(data.data.check_out)}!`);
        console.log('✅ Checked out:', data.data);
        
        // Refresh the attendance list to show updated status
        const params: { date?: string; department?: string } = {};
        if (selectedDate) params.date = selectedDate;
        if (filterDept) params.department = filterDept;
        const attResponse = await attendanceAPI.getAll(params);
        if (attResponse.data.success) {
          setAttendanceData(attResponse.data.data);
        }
      } else {
        alert('⚠️ ' + data.message);
      }
    } catch (error) {
      console.error('Check-out error:', error);
      alert('❌ Error checking out. Please try again.');
    }
  };

  const chartData = [
    { day: 'Mon', present: 85, absent: 5, leave: 10 },
    { day: 'Tue', present: 87, absent: 3, leave: 10 },
    { day: 'Wed', present: 90, absent: 0, leave: 10 },
    { day: 'Thu', present: 85, absent: 5, leave: 10 },
    { day: 'Fri', present: 80, absent: 10, leave: 10 },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'status-present';
      case 'absent':
        return 'status-absent';
      case 'leave':
      case 'half_day':
        return 'status-leave';
      default:
        return 'status-pending';
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return '-';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const departments = Array.from(new Set(attendanceData.map(a => a.department).filter(Boolean)));

  if (loading) {
    return (
      <DashboardLayout title="Attendance Tracking">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading attendance records...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Attendance Tracking">
      {/* Check-in/Check-out Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Attendance</h3>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <p className="text-gray-600">Check In:</p>
              <p className="font-semibold text-gray-900">{todayAttendance.checkIn ? formatTime(todayAttendance.checkIn) : 'Not checked in'}</p>
            </div>
            <div className="text-sm">
              <p className="text-gray-600">Check Out:</p>
              <p className="font-semibold text-gray-900">{todayAttendance.checkOut ? formatTime(todayAttendance.checkOut) : 'Not checked out'}</p>
            </div>
          </div>
          <div className="flex gap-3 ml-auto">
            <button
              onClick={handleCheckIn}
              disabled={todayAttendance.checkIn !== null}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check In
            </button>
            <button
              onClick={handleCheckOut}
              disabled={!todayAttendance.checkIn || todayAttendance.checkOut !== null}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check Out
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <motion.div
          className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Days Present</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{monthlyStats.daysPresent}</h3>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </motion.div>

        <motion.div
          className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Leaves Taken</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{monthlyStats.leavesTaken}</h3>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>
            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </motion.div>

        <motion.div
          className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Working Days</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{monthlyStats.totalWorkingDays}</h3>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <GlassCard className="mb-8">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 glass px-4 py-2 rounded-lg">
            <Calendar size={18} className="text-gray-400" />
            <input 
              type="date" 
              className="bg-white text-gray-900 outline-none" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <select 
            className="glass-input"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <button className="glass p-2 rounded-lg hover:bg-gray-100 ml-auto">
            <Download size={18} />
          </button>
        </div>
      </GlassCard>

      {/* Chart */}
      <GlassCard className="mb-8">
        <h3 className="heading-3 mb-6">Weekly Attendance Summary</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis stroke="rgba(255,255,255,0.5)" />
            <YAxis stroke="rgba(255,255,255,0.5)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(0, 217, 255, 0.5)',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="present" stackId="a" fill="#111827" />
            <Bar dataKey="absent" stackId="a" fill="#6b7280" />
            <Bar dataKey="leave" stackId="a" fill="#d1d5db" />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Attendance Table */}
      <GlassCard>
        <h3 className="heading-3 mb-6">Attendance Records ({attendanceData.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Employee</th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Department</th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Date</th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Check In</th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Check Out</th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.length > 0 ? (
                attendanceData.map((record, i) => (
                  <motion.tr
                    key={record.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <td className="px-4 py-4 text-gray-900 font-semibold">{record.employee_name}</td>
                    <td className="px-4 py-4 text-gray-600">{record.department || 'N/A'}</td>
                    <td className="px-4 py-4 text-gray-600">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-gray-600">{formatTime(record.check_in)}</td>
                    <td className="px-4 py-4 text-gray-600">{formatTime(record.check_out)}</td>
                    <td className="px-4 py-4">
                      <span className={getStatusColor(record.status)}>{record.status}</span>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No attendance records found for selected date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </DashboardLayout>
  );
};

export default AttendancePage;
