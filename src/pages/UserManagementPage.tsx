import { motion } from 'framer-motion';
import { Check, Edit2, Lock, Plus, Search, Trash2, User as UserIconLucide, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import type { User, UserRole } from '../types';

export const UserManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'employee' as UserRole,
    department: '',
  });

  const [newPassword, setNewPassword] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    hrManagers: 0,
    payrollOfficers: 0,
    employees: 0,
    active: 0,
    inactive: 0,
  });

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/stats/overview', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(
        user =>
          user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Prepare data - password will be auto-generated on backend
      const userData = {
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        department: formData.department
      };
      
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (data.success) {
        setShowCreateModal(false);
        setFormData({ fullName: '', email: '', password: '', role: 'employee', department: '' });
        fetchUsers();
        fetchStats();
        alert(data.message || 'User created successfully');
      } else {
        alert(data.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('An error occurred while creating user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${selectedUser.id}`, {
        method: 'PUT',
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
      const data = await response.json();
      if (data.success) {
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        fetchUsers();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        fetchUsers();
        fetchStats();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });
      const data = await response.json();
      if (data.success) {
        setShowResetPasswordModal(false);
        setSelectedUser(null);
        setNewPassword('');
        alert('Password reset successfully');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department || '',
    });
    setShowEditModal(true);
  };

  const openResetPasswordModal = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowResetPasswordModal(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'hr':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'payroll':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <DashboardLayout title="User Management">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Users</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</h3>
            </div>
            <UserIconLucide className="w-8 h-8 text-gray-700" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Users</p>
              <h3 className="text-2xl font-bold text-green-600 mt-2">{stats.active}</h3>
            </div>
            <Check className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Inactive Users</p>
              <h3 className="text-2xl font-bold text-red-600 mt-2">{stats.inactive}</h3>
            </div>
            <X className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Admins</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.admins}</h3>
            </div>
            <UserIconLucide className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Header and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">All Users ({filteredUsers.length})</h2>
          <button
            onClick={() => {
              setFormData({ fullName: '', email: '', password: '', role: 'employee', department: '' });
              setShowCreateModal(true);
            }}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow"
          >
            <Plus size={20} />
            Create User
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-10 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-gray-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="hr">HR Manager</option>
            <option value="payroll">Payroll Officer</option>
            <option value="employee">Employee</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-gray-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">Name</th>
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">Email</th>
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">Role</th>
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">Department</th>
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <motion.tr
                    key={user.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserIconLucide size={20} className="text-gray-600" />
                        </div>
                        <span className="text-gray-900 font-semibold">{user.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.department || '-'}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(user.id, user.status || 'active')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          user.status === 'active'
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        }`}
                      >
                        {user.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 bg-gray-100 border border-gray-200 hover:bg-gray-200 rounded-lg"
                          title="Edit User"
                        >
                          <Edit2 size={16} className="text-gray-700" />
                        </button>
                        <button
                          onClick={() => openResetPasswordModal(user)}
                          className="p-2 bg-gray-100 border border-gray-200 hover:bg-gray-200 rounded-lg"
                          title="Reset Password"
                        >
                          <Lock size={16} className="text-gray-700" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg"
                          title="Delete User"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-lg p-8 max-w-md w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Create New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  required
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>🔐 Password:</strong> An auto-generated password will be created and sent to the user's email address.
                </p>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                >
                  <option value="employee">Employee</option>
                  <option value="hr">HR Manager</option>
                  <option value="payroll">Payroll Officer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Department (Optional)</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg"
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 px-6 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-lg p-8 max-w-md w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Edit User</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                >
                  <option value="employee">Employee</option>
                  <option value="hr">HR Manager</option>
                  <option value="payroll">Payroll Officer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 px-6 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-lg p-8 max-w-md w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Reset Password</h3>
            <p className="text-gray-600 mb-6">
              Reset password for <strong>{selectedUser.fullName}</strong>
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg"
                >
                  Reset Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPasswordModal(false);
                    setSelectedUser(null);
                    setNewPassword('');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 px-6 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
};
