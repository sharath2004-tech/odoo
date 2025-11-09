import { motion } from 'framer-motion';
import { Edit2, Eye, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { employeeAPI } from '../services/api';

interface Employee {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
  position: string | null;
  join_date: string | null;
  status: string;
  salary: number | null;
}

interface CreateEmployeeForm {
  fullName: string;
  email: string;
  password: string;
  role: string;
  department: string;
  position: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  joinDate: string;
  salary: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  panNumber: string;
  uanNumber: string;
}

const EmployeesPage = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<CreateEmployeeForm>({
    fullName: '',
    email: '',
    password: '',
    role: 'employee',
    department: '',
    position: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    joinDate: new Date().toISOString().split('T')[0],
    salary: '',
    gender: '',
    maritalStatus: '',
    nationality: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    panNumber: '',
    uanNumber: '',
  });
  
  // Check if user is employee (read-only mode)
  const isEmployee = user?.role === 'employee';
  const canModify = user?.role === 'admin' || user?.role === 'hr';

  // Fetch employees from backend
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await employeeAPI.getAll();
        if (response.data.success) {
          setEmployees(response.data.data);
        }
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message || 'Failed to fetch employees');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Create employee
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // First create user account (password will be auto-generated)
      const userResponse = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role,
          department: formData.department,
        }),
      });

      const userData = await userResponse.json();
      
      if (userData.success) {
        alert('Employee created successfully!');
        setShowCreateModal(false);
        setFormData({
          fullName: '',
          email: '',
          password: '',
          role: 'employee',
          department: '',
          position: '',
          phone: '',
          address: '',
          dateOfBirth: '',
          joinDate: new Date().toISOString().split('T')[0],
          salary: '',
          gender: '',
          maritalStatus: '',
          nationality: '',
          bankName: '',
          accountNumber: '',
          ifscCode: '',
          panNumber: '',
          uanNumber: '',
        });
        // Refresh employee list
        const response = await employeeAPI.getAll();
        if (response.data.success) {
          setEmployees(response.data.data);
        }
      } else {
        alert('Failed to create employee: ' + userData.message);
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      alert('Error creating employee. Please try again.');
    }
  };

  // Delete employee
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    
    try {
      await employeeAPI.delete(id);
      setEmployees(employees.filter(emp => emp.id !== id));
      alert('Employee deleted successfully!');
    } catch (err: unknown) {
      const error = err as Error;
      alert('Failed to delete employee: ' + error.message);
    }
  };

  // View employee profile
  const handleViewProfile = (employee: Employee) => {
    setSelectedEmployee(employee);
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !filterDept || emp.department === filterDept;
    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  if (loading) {
    return (
      <DashboardLayout title="Employee Management">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading employees...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Employee Management">
        <div className="flex justify-center items-center h-64">
          <p className="text-red-600">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Employee Management">
      {/* Create Employee Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Create New Employee</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 space-y-6">
              {/* Personal Information Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>🔐 Password:</strong> An auto-generated password will be created and sent to the employee's email address.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marital Status
                    </label>
                    <select
                      value={formData.maritalStatus}
                      onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    >
                      <option value="">Select Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nationality
                    </label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Contact & Employment Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact & Employment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department *
                    </label>
                    <select
                      required
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    >
                      <option value="">Select Department</option>
                      <option value="Engineering">Engineering</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option>
                      <option value="Sales">Sales</option>
                      <option value="Marketing">Marketing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    >
                      <option value="employee">Employee</option>
                      <option value="hr">HR</option>
                      <option value="payroll">Payroll Officer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Join Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.joinDate}
                      onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salary *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      value={formData.panNumber}
                      onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      UAN Number
                    </label>
                    <input
                      type="text"
                      value={formData.uanNumber}
                      onChange={(e) => setFormData({ ...formData, uanNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  Create Employee
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Employee Profile Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Employee Profile</h2>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-medium text-gray-900">{selectedEmployee.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Employee Code</p>
                    <p className="font-medium text-gray-900">{selectedEmployee.employee_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedEmployee.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                      {selectedEmployee.role}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-medium text-gray-900">{selectedEmployee.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Position</p>
                    <p className="font-medium text-gray-900">{selectedEmployee.position}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Join Date</p>
                    <p className="font-medium text-gray-900">{selectedEmployee.join_date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedEmployee.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedEmployee.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header with Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <h2 className="heading-2">
            {isEmployee ? 'Employee Directory' : `Employees (${employees.length})`}
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            {isEmployee ? 'View company employee information' : 'Manage all company employees'}
          </p>
        </div>
        {canModify && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gray-900 hover:bg-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 text-white font-semibold transition-colors"
          >
            <Plus size={18} />
            Add Employee
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-10 py-3 text-gray-900 w-full focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
            />
          </div>

          {/* Department Filter */}
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept || 'unknown'} value={dept || ''}>
                {dept || 'Unknown'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Email</th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Department</th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Role</th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Join Date</th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Status</th>
                {canModify && <th className="px-4 py-3 text-left text-gray-700 font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp, i) => (
                <motion.tr
                  key={emp.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <td className="px-4 py-4 text-gray-900 font-semibold">{emp.full_name}</td>
                  <td className="px-4 py-4 text-gray-600 text-sm">{emp.email}</td>
                  <td className="px-4 py-4 text-gray-600">{emp.department || 'N/A'}</td>
                  <td className="px-4 py-4 text-gray-600">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-600 text-sm">
                    {emp.join_date ? new Date(emp.join_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-4">
                    <span className={emp.status === 'active' ? 'status-present' : 'status-leave'}>
                      {emp.status}
                    </span>
                  </td>
                  {canModify && (
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <motion.button
                          className="bg-blue-100 border border-blue-200 p-2 rounded-lg hover:bg-blue-200 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          onClick={() => handleViewProfile(emp)}
                          title="View Profile"
                        >
                          <Eye size={16} className="text-blue-700" />
                        </motion.button>
                        <motion.button
                          className="bg-gray-100 border border-gray-200 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          title="Edit Employee"
                        >
                          <Edit2 size={16} className="text-gray-700" />
                        </motion.button>
                        <motion.button
                          className="bg-gray-100 border border-gray-200 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          onClick={() => handleDelete(emp.id)}
                          title="Delete Employee"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </motion.button>
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No employees found matching your search.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmployeesPage;
