import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, Calendar, CheckCircle, Clock, Loader2, Mail, Phone, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { attendanceAPI, employeeAPI } from '../services/api';

interface Employee {
  id: number;
  employee_code: string;
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  hire_date: string;
  status: 'active' | 'inactive';
  profile_picture_url?: string;
  role?: string;
}

interface TodayAttendance {
  employee_id: number;
  status: 'present' | 'absent' | 'half_day' | 'leave';
  check_in_time?: string;
  check_out_time?: string;
}

const EmployeeDashboard = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Map<number, TodayAttendance>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const empResponse = await employeeAPI.getAll({ status: 'active' });
      console.log('📊 Employee API Response:', empResponse.data);
      console.log('📊 Total employees from API:', empResponse.data.data?.length);
      
      if (empResponse.data.success) {
        // Log all employees with their roles
        empResponse.data.data.forEach((emp: Employee) => {
          console.log(`Employee: ${emp.full_name}, Role: ${emp.role}, Status: ${emp.status}`);
        });
        
        // Only show users with 'employee' role - exclude admin, hr, and payroll
        const employeesList = empResponse.data.data.filter((emp: Employee) => emp.role === 'employee');
        console.log('📊 Filtered employees (role=employee):', employeesList.length);
        console.log('📊 Filtered employees list:', employeesList);
        setEmployees(employeesList);
        
        const today = new Date();
        const attResponse = await attendanceAPI.getAll({ date: today.toISOString().split('T')[0] });
        if (attResponse.data.success) {
          const attMap = new Map<number, TodayAttendance>();
          attResponse.data.data.forEach((att: any) => {
            attMap.set(att.employee_id, { employee_id: att.employee_id, status: att.status, check_in_time: att.check_in_time, check_out_time: att.check_out_time });
          });
          setAttendance(attMap);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCheckInStatus = (employeeId: number) => {
    const att = attendance.get(employeeId);
    if (!att || att.status === 'absent') {
      return { status: 'Not Checked In', isCheckedIn: false };
    }
    return { status: 'Checked In', isCheckedIn: true };
  };

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  const formatTime = (time: string | null | undefined) => {
    if (!time) return 'N/A';
    try {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return time;
    }
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return date;
    }
  };

  if (loading) {
    return (<DashboardLayout title="Employee Dashboard"><div className="flex items-center justify-center h-64"><Loader2 className="w-12 h-12 animate-spin text-cyan-500" /></div></DashboardLayout>);
  }

  return (
    <DashboardLayout title="Employee Dashboard">
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div><h2 className="text-2xl font-bold text-gray-900">All Employees</h2><p className="text-gray-600 mt-1">{employees.length} total employees  {attendance.size} checked in today</p></div>
          <div className="flex gap-4"><div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /><span className="text-gray-700 font-medium">Checked In</span></div><div className="flex items-center gap-2"><XCircle className="w-5 h-5 text-red-500" /><span className="text-gray-700 font-medium">Not Checked In</span></div></div>
        </div>
      </div>
      {employees.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center"><p className="text-gray-600 text-lg">No employees found</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {employees.map((employee, index) => {
            const checkStatus = getCheckInStatus(employee.id);
            
            return (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                onClick={() => handleEmployeeClick(employee)}
                className="bg-white rounded-lg p-4 shadow-md border-2 border-gray-300 relative hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer"
              >
                <div className="absolute top-3 right-3">
                  {checkStatus.isCheckedIn ? (
                    <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md" title="Checked In" />
                  ) : (
                    <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-md" title="Not Checked In" />
                  )}
                </div>

                <div className="flex justify-center mb-3">
                  <div className="relative">
                    {employee.profile_picture_url ? (
                      <img
                        src={employee.profile_picture_url}
                        alt={employee.full_name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-gray-300 shadow-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-gray-300 shadow-lg ${
                        employee.profile_picture_url ? 'hidden' : 'flex'
                      }`}
                    >
                      {employee.full_name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-gray-900 font-semibold text-sm mb-1 truncate" title={employee.full_name}>
                    {employee.full_name}
                  </h3>
                  <p className="text-gray-600 text-xs truncate" title={employee.employee_code}>
                    [{employee.employee_code}]
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Employee Details Modal */}
      <AnimatePresence>
        {showModal && selectedEmployee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-white border-b-2 border-gray-200 p-6 rounded-t-xl relative">
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {selectedEmployee.profile_picture_url ? (
                      <img
                        src={selectedEmployee.profile_picture_url}
                        alt={selectedEmployee.full_name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-300 shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-gray-300 shadow-lg">
                        {selectedEmployee.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={`absolute bottom-1 right-1 w-6 h-6 ${
                      getCheckInStatus(selectedEmployee.id).isCheckedIn ? 'bg-green-500' : 'bg-red-500'
                    } rounded-full border-4 border-white shadow-md`} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">{selectedEmployee.full_name}</h2>
                    <p className="text-gray-600 text-lg mt-1">{selectedEmployee.employee_code}</p>
                    <div className={`inline-block mt-2 px-4 py-1.5 rounded-lg text-sm font-semibold border-2 ${
                      getCheckInStatus(selectedEmployee.id).isCheckedIn 
                        ? 'bg-green-50 text-green-700 border-green-500' 
                        : 'bg-red-50 text-red-700 border-red-500'
                    }`}>
                      {getCheckInStatus(selectedEmployee.id).isCheckedIn ? '✓ Checked In' : '✗ Not Checked In'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 bg-gray-50">
                {/* Basic Information */}
                <div className="bg-white rounded-lg p-6 border-2 border-gray-300 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 font-medium mb-1">Email Address</p>
                          <p className="text-sm font-bold text-gray-900 break-all">{selectedEmployee.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Phone className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 font-medium mb-1">Phone Number</p>
                          <p className="text-sm font-bold text-gray-900">{selectedEmployee.phone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 font-medium mb-1">Position</p>
                          <p className="text-sm font-bold text-gray-900">{selectedEmployee.position || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 font-medium mb-1">Hire Date</p>
                          <p className="text-sm font-bold text-gray-900">{formatDate(selectedEmployee.hire_date)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attendance Information */}
                <div className="bg-white rounded-lg p-6 border-2 border-gray-300 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Today's Attendance
                  </h3>
                  <div>
                    {(() => {
                      const att = attendance.get(selectedEmployee.id);
                      if (!att || att.status === 'absent') {
                        return (
                          <div className="text-center py-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <XCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <p className="text-lg font-semibold text-gray-900">Not Checked In Today</p>
                            <p className="text-sm text-gray-600 mt-1">No attendance record found for today</p>
                          </div>
                        );
                      }
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-green-50 rounded-lg p-5 border-2 border-green-300">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-gray-600 font-semibold mb-1">Check In Time</p>
                                <p className="text-2xl font-bold text-green-600">{formatTime(att.check_in_time)}</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-5 border-2 border-blue-300">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Clock className="w-6 h-6 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-gray-600 font-semibold mb-1">Check Out Time</p>
                                <p className="text-2xl font-bold text-blue-600">
                                  {att.check_out_time ? formatTime(att.check_out_time) : 'Not Yet'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
