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

const AttendancePage = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterDept, setFilterDept] = useState('');
  const [todayAttendance, setTodayAttendance] = useState<{checkIn: string | null, checkOut: string | null}>({checkIn: null, checkOut: null});

  // Fetch today's attendance for current user
  useEffect(() => {
    const fetchTodayAttendance = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const today = new Date().toISOString().split('T')[0];
        
        const response = await fetch(`http://localhost:5000/api/attendance?date=${today}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
          const myAttendance = data.data.find((a: AttendanceRecord) => a.employee_id === Number(user.id));
          if (myAttendance) {
            setTodayAttendance({
              checkIn: myAttendance.check_in,
              checkOut: myAttendance.check_out
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch today\'s attendance:', error);
      }
    };
    fetchTodayAttendance();
  }, []);

  // Fetch attendance records
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const params: { date?: string; department?: string } = {};
        if (selectedDate) params.date = selectedDate;
        if (filterDept) params.department = filterDept;

        const response = await attendanceAPI.getAll(params);
        if (response.data.success) {
          setAttendanceData(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch attendance:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [selectedDate, filterDept]);

  const handleCheckIn = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const now = new Date();
      const time = now.toTimeString().split(' ')[0]; // HH:MM:SS
      const date = now.toISOString().split('T')[0];
      
      const response = await fetch('http://localhost:5000/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: user.id,
          date: date,
          checkIn: time,
          status: 'present'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setTodayAttendance({ ...todayAttendance, checkIn: time });
        alert('Check-in successful!');
      } else {
        alert('Failed to check in: ' + data.message);
      }
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Error checking in. Please try again.');
    }
  };

  const handleCheckOut = async () => {
    try {
      const token = localStorage.getItem('token');
      const now = new Date();
      const time = now.toTimeString().split(' ')[0];
      
      const response = await fetch('http://localhost:5000/api/attendance/checkout', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          checkOut: time
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setTodayAttendance({ ...todayAttendance, checkOut: time });
        alert('Check-out successful!');
      } else {
        alert('Failed to check out: ' + data.message);
      }
    } catch (error) {
      console.error('Check-out error:', error);
      alert('Error checking out. Please try again.');
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
