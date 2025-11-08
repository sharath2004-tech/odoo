import { motion } from 'framer-motion';
import { Briefcase, Calendar, DollarSign, Lock, Mail, MapPin, Save, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SalaryInfoTab } from '../components/SalaryInfoTab';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface EmployeeDetails {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
  department: string | null;
  position: string | null;
  join_date: string | null;
  status: string;
}

export const ProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'salary'>('profile');
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const canViewSalaryInfo = user?.role === 'admin' || user?.role === 'payroll';

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Fetch user's employee details
        const response = await fetch('http://localhost:5000/api/employees', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        const data = await response.json();
        if (data.success) {
          // Find current user's employee record
          const myDetails = data.data.find((emp: EmployeeDetails) => emp.email === user?.email);
          setEmployeeDetails(myDetails);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchEmployeeDetails();
    }
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout title="My Profile">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-5xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
              <User size={64} className="text-gray-600" />
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{user?.fullName}</h2>
              <p className="text-gray-600 mb-1 flex items-center justify-center md:justify-start gap-2">
                <Mail size={16} />
                {user?.email}
              </p>
              {employeeDetails && (
                <>
                  <p className="text-gray-600 mb-1 flex items-center justify-center md:justify-start gap-2">
                    <Briefcase size={16} />
                    {employeeDetails.position || 'N/A'} • {employeeDetails.department || 'No Department'}
                  </p>
                  <p className="text-gray-500 text-sm flex items-center justify-center md:justify-start gap-2">
                    <Calendar size={16} />
                    Employee Code: {employeeDetails.employee_code}
                  </p>
                </>
              )}
              <div className="mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  user?.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                  user?.role === 'hr' ? 'bg-blue-100 text-blue-700' :
                  user?.role === 'payroll' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {user?.role?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                activeTab === 'profile'
                  ? 'text-gray-900 border-b-2 border-gray-900 bg-gray-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <User size={18} className="inline mr-2" />
              Profile Information
            </button>
            {canViewSalaryInfo && (
              <button
                onClick={() => setActiveTab('salary')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'salary'
                    ? 'text-gray-900 border-b-2 border-gray-900 bg-gray-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <DollarSign size={18} className="inline mr-2" />
                Salary Info
              </button>
            )}
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                activeTab === 'security'
                  ? 'text-gray-900 border-b-2 border-gray-900 bg-gray-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Lock size={18} className="inline mr-2" />
              Security
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      <User size={16} className="inline mr-1" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={user?.fullName || ''}
                      disabled
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-600"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      <Mail size={16} className="inline mr-1" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-600"
                    />
                  </div>

                  {/* Employee Code */}
                  {employeeDetails && (
                    <>
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          <Briefcase size={16} className="inline mr-1" />
                          Employee Code
                        </label>
                        <input
                          type="text"
                          value={employeeDetails.employee_code || ''}
                          disabled
                          className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-600"
                        />
                      </div>

                      {/* Position */}
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          <Briefcase size={16} className="inline mr-1" />
                          Position
                        </label>
                        <input
                          type="text"
                          value={employeeDetails.position || 'N/A'}
                          disabled
                          className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-600"
                        />
                      </div>

                      {/* Department */}
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          <MapPin size={16} className="inline mr-1" />
                          Department
                        </label>
                        <input
                          type="text"
                          value={employeeDetails.department || 'No Department'}
                          disabled
                          className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-600"
                        />
                      </div>

                      {/* Join Date */}
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          <Calendar size={16} className="inline mr-1" />
                          Join Date
                        </label>
                        <input
                          type="text"
                          value={employeeDetails.join_date ? new Date(employeeDetails.join_date).toLocaleDateString() : 'N/A'}
                          disabled
                          className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-600"
                        />
                      </div>

                      {/* Status */}
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Status
                        </label>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${employeeDetails.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-gray-700 capitalize">{employeeDetails.status}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-gray-500 text-sm">
                    <strong>Note:</strong> To update your profile information, please contact your administrator or HR department.
                  </p>
                </div>
              </motion.div>
            ) : activeTab === 'salary' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <SalaryInfoTab 
                  employeeId={employeeDetails?.id || 0} 
                  employeeName={employeeDetails?.full_name || user?.fullName || 'Employee'}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">Change Password</h3>
                
                {passwordSuccess && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
                    {passwordSuccess}
                  </div>
                )}
                
                {passwordError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {passwordError}
                  </div>
                )}
                
                <div className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      <Lock size={16} className="inline mr-1" />
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      <Lock size={16} className="inline mr-1" />
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                    />
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      <Lock size={16} className="inline mr-1" />
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      setPasswordError('');
                      setPasswordSuccess('');
                      
                      if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
                        setPasswordError('All fields are required');
                        return;
                      }
                      
                      if (passwordData.newPassword.length < 6) {
                        setPasswordError('New password must be at least 6 characters');
                        return;
                      }
                      
                      if (passwordData.newPassword !== passwordData.confirmPassword) {
                        setPasswordError('New passwords do not match');
                        return;
                      }
                      
                      setPasswordLoading(true);
                      
                      try {
                        const token = localStorage.getItem('token');
                        const response = await fetch('http://localhost:5000/api/auth/change-password', {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify(passwordData)
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                          setPasswordSuccess('Password changed successfully!');
                          setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                        } else {
                          setPasswordError(data.message || 'Failed to change password');
                        }
                      } catch (error) {
                        console.error('Password change error:', error);
                        setPasswordError('An error occurred. Please try again.');
                      } finally {
                        setPasswordLoading(false);
                      }
                    }}
                    disabled={passwordLoading}
                    className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={18} />
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </motion.button>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-gray-500 text-sm">
                    <strong>Password Requirements:</strong> Minimum 6 characters
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
