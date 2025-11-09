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
  phone?: string | null;
  address?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  nationality?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  pan_number?: string | null;
  uan_number?: string | null;
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
  const [activeTab, setActiveTab] = useState<'profile' | 'resume' | 'security' | 'salary' | 'payslip'>('profile');
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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    phone: '',
    address: '',
    date_of_birth: '',
    gender: '',
    marital_status: '',
    nationality: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    pan_number: '',
    uan_number: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Resume tab state
  const [resumeFile, setResumeFile] = useState<{ name: string; url: string } | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [education, setEducation] = useState<Array<{
    id: number;
    degree: string;
    institution: string;
    year: string;
    field: string;
  }>>([]);
  const [experience, setExperience] = useState<Array<{
    id: number;
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;
  }>>([]);
  const [skills, setSkills] = useState<Array<{
    id: number;
    name: string;
    level: string;
  }>>([]);
  const [certifications, setCertifications] = useState<Array<{
    id: number;
    name: string;
    issuer: string;
    date: string;
    url: string;
  }>>([]);
  
  // Modal states for adding items
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showCertificationModal, setShowCertificationModal] = useState(false);
  
  // Form data for modals
  const [educationForm, setEducationForm] = useState({
    degree: '',
    institution: '',
    year: '',
    field: ''
  });
  const [experienceForm, setExperienceForm] = useState({
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    description: ''
  });
  const [skillForm, setSkillForm] = useState({
    name: '',
    level: 'Beginner'
  });
  const [certificationForm, setCertificationForm] = useState({
    name: '',
    issuer: '',
    date: '',
    url: ''
  });
  
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
          
          // Populate form data with existing employee details
          if (myDetails) {
            setProfileFormData({
              phone: myDetails.phone || '',
              address: myDetails.address || '',
              date_of_birth: myDetails.date_of_birth || '',
              gender: myDetails.gender || '',
              marital_status: myDetails.marital_status || '',
              nationality: myDetails.nationality || '',
              bank_name: myDetails.bank_name || '',
              account_number: myDetails.account_number || '',
              ifsc_code: myDetails.ifsc_code || '',
              pan_number: myDetails.pan_number || '',
              uan_number: myDetails.uan_number || ''
            });
          }
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

  const handleSaveProfile = async () => {
    if (!employeeDetails) return;
    
    try {
      setSavingProfile(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/employees/${employeeDetails.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileFormData),
      });

      const data = await response.json();
      if (data.success) {
        // Update local state
        setEmployeeDetails({
          ...employeeDetails,
          ...profileFormData
        });
        setIsEditingProfile(false);
        alert('Profile updated successfully!');
      } else {
        alert(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('An error occurred while updating profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form data to original employee details
    if (employeeDetails) {
      setProfileFormData({
        phone: employeeDetails.phone || '',
        address: employeeDetails.address || '',
        date_of_birth: employeeDetails.date_of_birth || '',
        gender: employeeDetails.gender || '',
        marital_status: employeeDetails.marital_status || '',
        nationality: employeeDetails.nationality || '',
        bank_name: employeeDetails.bank_name || '',
        account_number: employeeDetails.account_number || '',
        ifsc_code: employeeDetails.ifsc_code || '',
        pan_number: employeeDetails.pan_number || '',
        uan_number: employeeDetails.uan_number || ''
      });
    }
    setIsEditingProfile(false);
  };

  // Resume handlers
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, DOC, or DOCX file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploadingResume(true);
    
    try {
      // Create a blob URL for the file so it can be viewed
      const fileUrl = URL.createObjectURL(file);
      
      // In a real app, you would upload to server here
      // const formData = new FormData();
      // formData.append('resume', file);
      // await uploadToServer(formData);
      
      setResumeFile({
        name: file.name,
        url: fileUrl
      });
      
      alert('Resume uploaded successfully!');
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleViewResume = () => {
    if (resumeFile?.url) {
      // Open resume in new tab
      window.open(resumeFile.url, '_blank');
    }
  };

  const handleDownloadResume = () => {
    if (resumeFile?.url && resumeFile?.name) {
      // Create download link
      const link = document.createElement('a');
      link.href = resumeFile.url;
      link.download = resumeFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRemoveResume = () => {
    if (resumeFile?.url) {
      // Revoke the blob URL to free up memory
      URL.revokeObjectURL(resumeFile.url);
    }
    setResumeFile(null);
  };

  const handleAddEducation = () => {
    if (!educationForm.degree || !educationForm.institution || !educationForm.year) {
      alert('Please fill in all required fields');
      return;
    }
    const newEducation = {
      id: Date.now(),
      ...educationForm
    };
    setEducation([...education, newEducation]);
    setEducationForm({ degree: '', institution: '', year: '', field: '' });
    setShowEducationModal(false);
  };

  const handleDeleteEducation = (id: number) => {
    setEducation(education.filter(edu => edu.id !== id));
  };

  const handleAddExperience = () => {
    if (!experienceForm.title || !experienceForm.company || !experienceForm.startDate) {
      alert('Please fill in all required fields');
      return;
    }
    const newExperience = {
      id: Date.now(),
      ...experienceForm
    };
    setExperience([...experience, newExperience]);
    setExperienceForm({ title: '', company: '', startDate: '', endDate: '', description: '' });
    setShowExperienceModal(false);
  };

  const handleDeleteExperience = (id: number) => {
    setExperience(experience.filter(exp => exp.id !== id));
  };

  const handleAddSkill = () => {
    if (!skillForm.name) {
      alert('Please enter a skill name');
      return;
    }
    const newSkill = {
      id: Date.now(),
      ...skillForm
    };
    setSkills([...skills, newSkill]);
    setSkillForm({ name: '', level: 'Beginner' });
    setShowSkillModal(false);
  };

  const handleDeleteSkill = (id: number) => {
    setSkills(skills.filter(skill => skill.id !== id));
  };

  const handleAddCertification = () => {
    if (!certificationForm.name || !certificationForm.issuer) {
      alert('Please fill in all required fields');
      return;
    }
    const newCertification = {
      id: Date.now(),
      ...certificationForm
    };
    setCertifications([...certifications, newCertification]);
    setCertificationForm({ name: '', issuer: '', date: '', url: '' });
    setShowCertificationModal(false);
  };

  const handleDeleteCertification = (id: number) => {
    setCertifications(certifications.filter(cert => cert.id !== id));
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
            <button
              onClick={() => setActiveTab('resume')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                activeTab === 'resume'
                  ? 'text-gray-900 border-b-2 border-gray-900 bg-gray-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Briefcase size={18} className="inline mr-2" />
              Resume
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
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                  {!isEditingProfile ? (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Save size={18} />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {savingProfile ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={savingProfile}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                
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

                      {/* Phone */}
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={isEditingProfile ? profileFormData.phone : (employeeDetails.phone || 'N/A')}
                          onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                          disabled={!isEditingProfile}
                          className={`w-full ${isEditingProfile ? 'bg-white' : 'bg-gray-50'} border border-gray-300 rounded-lg px-4 py-3 text-gray-900`}
                        />
                      </div>

                      {/* Address */}
                      <div className="md:col-span-2">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Address
                        </label>
                        <input
                          type="text"
                          value={isEditingProfile ? profileFormData.address : (employeeDetails.address || 'N/A')}
                          onChange={(e) => setProfileFormData({ ...profileFormData, address: e.target.value })}
                          disabled={!isEditingProfile}
                          className={`w-full ${isEditingProfile ? 'bg-white' : 'bg-gray-50'} border border-gray-300 rounded-lg px-4 py-3 text-gray-900`}
                        />
                      </div>

                      {/* Date of Birth */}
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={isEditingProfile ? profileFormData.date_of_birth : (employeeDetails.date_of_birth || '')}
                          onChange={(e) => setProfileFormData({ ...profileFormData, date_of_birth: e.target.value })}
                          disabled={!isEditingProfile}
                          className={`w-full ${isEditingProfile ? 'bg-white' : 'bg-gray-50'} border border-gray-300 rounded-lg px-4 py-3 text-gray-900`}
                        />
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Gender
                        </label>
                        {isEditingProfile ? (
                          <select
                            value={profileFormData.gender}
                            onChange={(e) => setProfileFormData({ ...profileFormData, gender: e.target.value })}
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={employeeDetails.gender || 'N/A'}
                            disabled
                            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-600"
                          />
                        )}
                      </div>

                      {/* Marital Status */}
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Marital Status
                        </label>
                        {isEditingProfile ? (
                          <select
                            value={profileFormData.marital_status}
                            onChange={(e) => setProfileFormData({ ...profileFormData, marital_status: e.target.value })}
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                          >
                            <option value="">Select Status</option>
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                            <option value="Widowed">Widowed</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={employeeDetails.marital_status || 'N/A'}
                            disabled
                            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-600"
                          />
                        )}
                      </div>

                      {/* Nationality */}
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Nationality
                        </label>
                        <input
                          type="text"
                          value={isEditingProfile ? profileFormData.nationality : (employeeDetails.nationality || 'N/A')}
                          onChange={(e) => setProfileFormData({ ...profileFormData, nationality: e.target.value })}
                          disabled={!isEditingProfile}
                          className={`w-full ${isEditingProfile ? 'bg-white' : 'bg-gray-50'} border border-gray-300 rounded-lg px-4 py-3 text-gray-900`}
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

                {/* Bank Details Section */}
                {employeeDetails && (
                  <>
                    <h4 className="text-lg font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">Bank Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Bank Name */}
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={isEditingProfile ? profileFormData.bank_name : (employeeDetails.bank_name || 'N/A')}
                          onChange={(e) => setProfileFormData({ ...profileFormData, bank_name: e.target.value })}
                          disabled={!isEditingProfile}
                          className={`w-full ${isEditingProfile ? 'bg-white' : 'bg-gray-50'} border border-gray-300 rounded-lg px-4 py-3 text-gray-900`}
                        />
                      </div>

                      {/* Account Number */}
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={isEditingProfile ? profileFormData.account_number : (employeeDetails.account_number || 'N/A')}
                          onChange={(e) => setProfileFormData({ ...profileFormData, account_number: e.target.value })}
                          disabled={!isEditingProfile}
                          className={`w-full ${isEditingProfile ? 'bg-white' : 'bg-gray-50'} border border-gray-300 rounded-lg px-4 py-3 text-gray-900`}
                        />
                      </div>

                      {/* IFSC Code */}
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          IFSC Code
                        </label>
                        <input
                          type="text"
                          value={isEditingProfile ? profileFormData.ifsc_code : (employeeDetails.ifsc_code || 'N/A')}
                          onChange={(e) => setProfileFormData({ ...profileFormData, ifsc_code: e.target.value })}
                          disabled={!isEditingProfile}
                          className={`w-full ${isEditingProfile ? 'bg-white' : 'bg-gray-50'} border border-gray-300 rounded-lg px-4 py-3 text-gray-900`}
                        />
                      </div>
                    </div>

                    {/* Document Details Section */}
                    <h4 className="text-lg font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">Document Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* PAN Number */}
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          PAN Number
                        </label>
                        <input
                          type="text"
                          value={isEditingProfile ? profileFormData.pan_number : (employeeDetails.pan_number || 'N/A')}
                          onChange={(e) => setProfileFormData({ ...profileFormData, pan_number: e.target.value })}
                          disabled={!isEditingProfile}
                          className={`w-full ${isEditingProfile ? 'bg-white' : 'bg-gray-50'} border border-gray-300 rounded-lg px-4 py-3 text-gray-900`}
                        />
                      </div>

                      {/* UAN Number */}
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          UAN Number
                        </label>
                        <input
                          type="text"
                          value={isEditingProfile ? profileFormData.uan_number : (employeeDetails.uan_number || 'N/A')}
                          onChange={(e) => setProfileFormData({ ...profileFormData, uan_number: e.target.value })}
                          disabled={!isEditingProfile}
                          className={`w-full ${isEditingProfile ? 'bg-white' : 'bg-gray-50'} border border-gray-300 rounded-lg px-4 py-3 text-gray-900`}
                        />
                      </div>
                    </div>
                  </>
                )}

                {!isEditingProfile && (
                  <div className="pt-4 mt-6 border-t border-gray-200">
                    <p className="text-gray-500 text-sm">
                      <strong>Note:</strong> Click "Edit Profile" to update your personal information.
                    </p>
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'resume' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6">Resume & Documents</h3>

                {/* Resume Upload Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Resume</h4>
                  {resumeFile ? (
                    <div className="bg-white border border-gray-300 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-blue-600" />
                          <div>
                            <p className="font-semibold text-gray-900">{resumeFile.name}</p>
                            <p className="text-sm text-gray-500">Resume uploaded</p>
                          </div>
                        </div>
                        <button
                          onClick={handleRemoveResume}
                          className="text-red-600 hover:text-red-700 font-semibold text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleViewResume}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Eye size={18} />
                          View in New Tab
                        </button>
                        <button
                          onClick={handleDownloadResume}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <FileText size={18} />
                          Download
                        </button>
                      </div>
                      
                      {/* PDF Preview for PDF files */}
                      {resumeFile.name.toLowerCase().endsWith('.pdf') && (
                        <div className="mt-4 border border-gray-300 rounded-lg overflow-hidden">
                          <iframe
                            src={resumeFile.url}
                            className="w-full h-[600px]"
                            title="Resume Preview"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 bg-white">
                      <div className="text-center">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 mb-2">No resume uploaded yet</p>
                        <p className="text-sm text-gray-500 mb-4">Upload your resume in PDF, DOC, or DOCX format (Max 5MB)</p>
                        <label className="cursor-pointer">
                          <span className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors inline-block">
                            {uploadingResume ? 'Uploading...' : 'Choose File'}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={handleResumeUpload}
                            disabled={uploadingResume}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Education Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Education</h4>
                    <button
                      onClick={() => setShowEducationModal(true)}
                      className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                    >
                      + Add Education
                    </button>
                  </div>
                  {education.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No education details added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {education.map((edu) => (
                        <div key={edu.id} className="bg-white border border-gray-300 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-900">{edu.degree}</p>
                              <p className="text-gray-700">{edu.institution}</p>
                              <p className="text-sm text-gray-500">{edu.field} • {edu.year}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteEducation(edu.id)}
                              className="text-red-600 hover:text-red-700 text-sm font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Work Experience Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Work Experience</h4>
                    <button
                      onClick={() => setShowExperienceModal(true)}
                      className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                    >
                      + Add Experience
                    </button>
                  </div>
                  {experience.length === 0 ? (
                    <div className="text-center py-8">
                      <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No work experience added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {experience.map((exp) => (
                        <div key={exp.id} className="bg-white border border-gray-300 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-900">{exp.title}</p>
                              <p className="text-gray-700">{exp.company}</p>
                              <p className="text-sm text-gray-500">
                                {exp.startDate} - {exp.endDate || 'Present'}
                              </p>
                              {exp.description && (
                                <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteExperience(exp.id)}
                              className="text-red-600 hover:text-red-700 text-sm font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Skills Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Skills</h4>
                    <button
                      onClick={() => setShowSkillModal(true)}
                      className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                    >
                      + Add Skill
                    </button>
                  </div>
                  {skills.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No skills added yet</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <div
                          key={skill.id}
                          className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full flex items-center gap-2"
                        >
                          <span className="font-semibold">{skill.name}</span>
                          <span className="text-xs">({skill.level})</span>
                          <button
                            onClick={() => handleDeleteSkill(skill.id)}
                            className="text-blue-900 hover:text-blue-950 ml-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Certifications Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Certifications</h4>
                    <button
                      onClick={() => setShowCertificationModal(true)}
                      className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                    >
                      + Add Certification
                    </button>
                  </div>
                  {certifications.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No certifications added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {certifications.map((cert) => (
                        <div key={cert.id} className="bg-white border border-gray-300 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-900">{cert.name}</p>
                              <p className="text-gray-700">{cert.issuer}</p>
                              <p className="text-sm text-gray-500">{cert.date}</p>
                              {cert.url && (
                                <a
                                  href={cert.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 text-sm"
                                >
                                  View Certificate →
                                </a>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteCertification(cert.id)}
                              className="text-red-600 hover:text-red-700 text-sm font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Education Modal */}
                {showEducationModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-lg p-6 w-full max-w-md"
                    >
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Add Education</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">Degree *</label>
                          <input
                            type="text"
                            value={educationForm.degree}
                            onChange={(e) => setEducationForm({ ...educationForm, degree: e.target.value })}
                            placeholder="e.g., Bachelor of Science"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">Institution *</label>
                          <input
                            type="text"
                            value={educationForm.institution}
                            onChange={(e) => setEducationForm({ ...educationForm, institution: e.target.value })}
                            placeholder="e.g., University Name"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">Field of Study</label>
                          <input
                            type="text"
                            value={educationForm.field}
                            onChange={(e) => setEducationForm({ ...educationForm, field: e.target.value })}
                            placeholder="e.g., Computer Science"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">Year *</label>
                          <input
                            type="text"
                            value={educationForm.year}
                            onChange={(e) => setEducationForm({ ...educationForm, year: e.target.value })}
                            placeholder="e.g., 2020"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-6">
                        <button
                          onClick={handleAddEducation}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setShowEducationModal(false);
                            setEducationForm({ degree: '', institution: '', year: '', field: '' });
                          }}
                          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold px-4 py-2 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* Experience Modal */}
                {showExperienceModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-lg p-6 w-full max-w-md"
                    >
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Add Work Experience</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">Job Title *</label>
                          <input
                            type="text"
                            value={experienceForm.title}
                            onChange={(e) => setExperienceForm({ ...experienceForm, title: e.target.value })}
                            placeholder="e.g., Software Engineer"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">Company *</label>
                          <input
                            type="text"
                            value={experienceForm.company}
                            onChange={(e) => setExperienceForm({ ...experienceForm, company: e.target.value })}
                            placeholder="e.g., Tech Corp"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-2">Start Date *</label>
                            <input
                              type="month"
                              value={experienceForm.startDate}
                              onChange={(e) => setExperienceForm({ ...experienceForm, startDate: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 text-sm font-medium mb-2">End Date</label>
                            <input
                              type="month"
                              value={experienceForm.endDate}
                              onChange={(e) => setExperienceForm({ ...experienceForm, endDate: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">Description</label>
                          <textarea
                            value={experienceForm.description}
                            onChange={(e) => setExperienceForm({ ...experienceForm, description: e.target.value })}
                            placeholder="Describe your responsibilities..."
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-6">
                        <button
                          onClick={handleAddExperience}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setShowExperienceModal(false);
                            setExperienceForm({ title: '', company: '', startDate: '', endDate: '', description: '' });
                          }}
                          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold px-4 py-2 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* Skill Modal */}
                {showSkillModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-lg p-6 w-full max-w-md"
                    >
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Add Skill</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">Skill Name *</label>
                          <input
                            type="text"
                            value={skillForm.name}
                            onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                            placeholder="e.g., React, Python, Leadership"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">Proficiency Level</label>
                          <select
                            value={skillForm.level}
                            onChange={(e) => setSkillForm({ ...skillForm, level: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                          >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                            <option value="Expert">Expert</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-6">
                        <button
                          onClick={handleAddSkill}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setShowSkillModal(false);
                            setSkillForm({ name: '', level: 'Beginner' });
                          }}
                          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold px-4 py-2 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* Certification Modal */}
                {showCertificationModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-lg p-6 w-full max-w-md"
                    >
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Add Certification</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">Certification Name *</label>
                          <input
                            type="text"
                            value={certificationForm.name}
                            onChange={(e) => setCertificationForm({ ...certificationForm, name: e.target.value })}
                            placeholder="e.g., AWS Certified Solutions Architect"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">Issuing Organization *</label>
                          <input
                            type="text"
                            value={certificationForm.issuer}
                            onChange={(e) => setCertificationForm({ ...certificationForm, issuer: e.target.value })}
                            placeholder="e.g., Amazon Web Services"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">Issue Date</label>
                          <input
                            type="month"
                            value={certificationForm.date}
                            onChange={(e) => setCertificationForm({ ...certificationForm, date: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">Credential URL</label>
                          <input
                            type="url"
                            value={certificationForm.url}
                            onChange={(e) => setCertificationForm({ ...certificationForm, url: e.target.value })}
                            placeholder="https://..."
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-6">
                        <button
                          onClick={handleAddCertification}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setShowCertificationModal(false);
                            setCertificationForm({ name: '', issuer: '', date: '', url: '' });
                          }}
                          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold px-4 py-2 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
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
