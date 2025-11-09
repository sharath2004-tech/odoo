import { motion } from 'framer-motion';
import { Briefcase, Calendar, DollarSign, Eye, FileText, Loader2, Lock, Mail, MapPin, Save, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PayslipView } from '../components/PayslipView';
import { SalaryInfoTab } from '../components/SalaryInfoTab';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { payrollAPI } from '../services/api';

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

interface PayrollRecord {
  id: number;
  month: number;
  year: number;
  gross_salary: number;
  net_salary: number;
  status: string;
  payment_date?: string;
  worked_days: number;
  total_days: number;
}

interface PayslipData {
  payroll: {
    id: number;
    month: number;
    year: number;
    employee_code: string;
    employee_name: string;
    position: string;
    department: string;
    email: string;
    join_date: string;
    basic_salary: number;
    allowances: number;
    deductions: number;
    provident_fund: number;
    professional_tax: number;
    gross_salary: number;
    net_salary: number;
    worked_days: number;
    total_days: number;
    status: string;
    payment_date: string;
  };
  earnings: Array<{
    component_name: string;
    rate_percentage: number | null;
    amount: number;
  }>;
  deductions: Array<{
    component_name: string;
    rate_percentage: number | null;
    amount: number;
  }>;
}

interface PayslipTabProps {
  employeeId: number;
  loadingPayslip: boolean;
  setLoadingPayslip: (loading: boolean) => void;
  selectedPayslip: PayslipData | null;
  setSelectedPayslip: (payslip: PayslipData | null) => void;
  payrollHistory: PayrollRecord[];
  setPayrollHistory: (history: PayrollRecord[]) => void;
}

const PayslipTab = ({ 
  employeeId, 
  loadingPayslip, 
  setLoadingPayslip, 
  selectedPayslip, 
  setSelectedPayslip,
  payrollHistory,
  setPayrollHistory 
}: PayslipTabProps) => {
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchPayrollHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await payrollAPI.getEmployeeHistory(employeeId);
      if (response.data.success) {
        setPayrollHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching payroll history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (employeeId && employeeId > 0) {
      fetchPayrollHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const handleViewPayslip = async (payrollId: number) => {
    try {
      setLoadingPayslip(true);
      const response = await payrollAPI.getPayslip(payrollId);
      if (response.data.success) {
        setSelectedPayslip(response.data.data);
      } else {
        alert(response.data.message || 'Failed to load payslip. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching payslip:', error);
      alert('Failed to load payslip. Please try again.');
    } finally {
      setLoadingPayslip(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Processing' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-xs font-semibold`}>
        {config.label}
      </span>
    );
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (selectedPayslip) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <button
          onClick={() => setSelectedPayslip(null)}
          className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 no-print"
        >
          ← Back to Payroll History
        </button>
        
        <PayslipView payslipData={selectedPayslip} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Payroll History</h3>
        {loadingHistory && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
      </div>

      {loadingHistory ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : payrollHistory.length === 0 ? (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">No Payroll Records Found</p>
          <p className="text-gray-500 text-sm mt-2">Your payroll records will appear here once processed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payrollHistory.map((record) => (
            <div
              key={record.id}
              className="bg-white border-2 border-gray-300 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-bold text-gray-900">
                    {monthNames[record.month - 1]} {record.year}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {record.worked_days}/{record.total_days} days
                  </p>
                </div>
                {getStatusBadge(record.status)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600 text-sm">Gross Salary</span>
                  <span className="font-semibold text-gray-900">₹{Number(record.gross_salary).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-900 font-bold">Net Salary</span>
                  <span className="font-bold text-blue-600 text-lg">₹{Number(record.net_salary).toFixed(2)}</span>
                </div>
              </div>

              {record.payment_date && (
                <p className="text-xs text-gray-500 mb-3">
                  Paid on: {new Date(record.payment_date).toLocaleDateString()}
                </p>
              )}

              <button
                onClick={() => handleViewPayslip(record.id)}
                disabled={loadingPayslip}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingPayslip ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Eye size={16} />
                    View Payslip
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export const ProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'salary' | 'payslip'>('profile');
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
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [payrollHistory, setPayrollHistory] = useState<PayrollRecord[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipData | null>(null);
  const [loadingPayslip, setLoadingPayslip] = useState(false);
  
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

        // Fetch user profile picture
        const userResponse = await fetch(`http://localhost:5000/api/users/${user?.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const userData = await userResponse.json();
        if (userData.success && userData.data.profilePicture) {
          setProfilePicture(userData.data.profilePicture);
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

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setUploadingPicture(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await fetch('http://localhost:5000/api/users/profile-picture', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setProfilePicture(data.data.profilePicture);
        alert('Profile picture updated successfully!');
      } else {
        alert(data.message || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('An error occurred while uploading the profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

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
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                {profilePicture ? (
                  <img 
                    src={`http://localhost:5000${profilePicture}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={64} className="text-gray-600" />
                )}
              </div>
              
              {/* Upload Button Overlay */}
              <label 
                htmlFor="profile-picture-upload"
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <div className="text-white text-center">
                  {uploadingPicture ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  ) : (
                    <>
                      <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs">Upload</span>
                    </>
                  )}
                </div>
              </label>
              <input
                id="profile-picture-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleProfilePictureUpload}
                className="hidden"
                disabled={uploadingPicture}
              />
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
            {user?.role !== 'admin' && (
              <button
                onClick={() => setActiveTab('payslip')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'payslip'
                    ? 'text-gray-900 border-b-2 border-gray-900 bg-gray-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FileText size={18} className="inline mr-2" />
                View Payslip
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
            ) : activeTab === 'payslip' ? (
              employeeDetails?.id ? (
                <PayslipTab 
                  employeeId={employeeDetails.id}
                  loadingPayslip={loadingPayslip}
                  setLoadingPayslip={setLoadingPayslip}
                  selectedPayslip={selectedPayslip}
                  setSelectedPayslip={setSelectedPayslip}
                  payrollHistory={payrollHistory}
                  setPayrollHistory={setPayrollHistory}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center items-center py-12"
                >
                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-8 text-center max-w-md mx-auto">
                    <FileText className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Employee Record</h3>
                    <p className="text-gray-600 mb-4">
                      {user?.role === 'admin' || user?.role === 'hr' || user?.role === 'payroll'
                        ? 'Administrative users do not have payroll records. This feature is only available for employee accounts.'
                        : 'You do not have an employee record associated with your account. Please contact your administrator.'}
                    </p>
                  </div>
                </motion.div>
              )
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
