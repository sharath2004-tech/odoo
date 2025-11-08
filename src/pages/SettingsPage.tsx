import { motion } from 'framer-motion';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface UserAccessRights {
  userId: string;
  userName: string;
  loginId: string;
  email: string;
  role: string;
  employees: boolean;
  attendance: boolean;
  timeOff: boolean;
  payroll: boolean;
  reports: boolean;
  settings: boolean;
}

const SettingsPage = () => {
  const [companyName, setCompanyName] = useState('');
  const [users, setUsers] = useState<UserAccessRights[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        // Convert existing users to UserAccessRights format
        const formattedUsers = data.data.map((user: any) => ({
          userId: user.id.toString(),
          userName: user.fullName || user.username,
          loginId: user.loginId || '',
          email: user.email,
          role: user.role,
          employees: false,
          attendance: false,
          timeOff: false,
          payroll: false,
          reports: false,
          settings: false,
        }));
        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const roles = ['admin', 'hr', 'payroll', 'employee'];

  const handleRoleChange = (index: number, role: string) => {
    const newUsers = [...users];
    newUsers[index].role = role;
    setUsers(newUsers);
  };

  const handleAccessRightChange = (index: number, field: keyof UserAccessRights) => {
    const newUsers = [...users];
    newUsers[index][field] = !newUsers[index][field] as any;
    setUsers(newUsers);
  };

  const addUserRow = () => {
    setUsers([
      ...users,
      {
        userId: 'new',
        userName: '',
        loginId: '',
        email: '',
        role: 'employee',
        employees: false,
        attendance: false,
        timeOff: false,
        payroll: false,
        reports: false,
        settings: false,
      },
    ]);
  };

  const handleUserFieldChange = (index: number, field: keyof UserAccessRights, value: string) => {
    const newUsers = [...users];
    newUsers[index][field] = value as any;
    setUsers(newUsers);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Update each user's role
      for (const user of users) {
        await fetch(`http://localhost:5000/api/users/${user.userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role: user.role,
            // Add access rights if needed
          }),
        });
      }
      
      alert('Settings saved successfully!');
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Settings">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings">
      <div className="space-y-6">
        {/* Company Logo/Name Section */}
        <motion.div
          className="bg-white border-2 border-gray-900 rounded-lg p-6 shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-900 pb-2">
            Company Branding
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                <img 
                  src="/images/workzen-logo.svg" 
                  alt="WorkZen Logo" 
                  className="w-20 h-20 border-2 border-gray-200 rounded-lg p-2 bg-gray-50"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  className="w-full px-4 py-3 border-2 border-gray-900 rounded-lg bg-white text-gray-900 font-medium focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* User Settings Section */}
        <motion.div
          className="bg-white border-2 border-gray-900 rounded-lg shadow-md overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">User Setting</h2>
            <div className="flex gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            </div>
          </div>

          <div className="p-6">
            <p className="text-gray-600 text-sm mb-4">
              In the Admin Settings, the administrator can assign user access rights based on each user's role.
              <br />
              Access rights can be configured on a module basis, allowing specific permissions for each module.
            </p>
            <p className="text-gray-700 text-sm font-medium mb-6">
              Select user access rights as per their role and responsibilities. These access rights define what
              users are allowed to access and what they are restricted from accessing.
              <br />
              <span className="text-gray-600 italic">
                Employee / Admin/ HR Officer / Payroll Officer
              </span>
            </p>

            {/* User Access Table */}
            <div className="overflow-x-auto border-2 border-gray-900 rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900 text-white">
                    <th className="px-4 py-3 text-left text-sm font-bold border-r-2 border-gray-700">
                      User name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold border-r-2 border-gray-700">
                      Login id
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold border-r-2 border-gray-700">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold border-r-2 border-gray-700">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={index} className="border-t-2 border-gray-900">
                      <td className="px-4 py-3 border-r-2 border-gray-900">
                        <input
                          type="text"
                          value={user.userName}
                          onChange={(e) => handleUserFieldChange(index, 'userName', e.target.value)}
                          disabled={user.userId !== 'new'}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:border-gray-900 focus:ring-1 focus:ring-gray-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-4 py-3 border-r-2 border-gray-900">
                        <input
                          type="text"
                          value={user.loginId}
                          onChange={(e) => handleUserFieldChange(index, 'loginId', e.target.value)}
                          disabled={user.userId !== 'new'}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:border-gray-900 focus:ring-1 focus:ring-gray-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-4 py-3 border-r-2 border-gray-900">
                        <input
                          type="email"
                          value={user.email}
                          onChange={(e) => handleUserFieldChange(index, 'email', e.target.value)}
                          disabled={user.userId !== 'new'}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:border-gray-900 focus:ring-1 focus:ring-gray-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(index, e.target.value)}
                          className="w-full px-2 py-1 border-2 border-gray-900 rounded bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-200"
                        >
                          {roles.map((role) => (
                            <option key={role} value={role}>
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add User Button */}
            <button
              onClick={addUserRow}
              className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              + Add User
            </button>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          className="flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-colors shadow-md"
          >
            <Save size={20} />
            Save Settings
          </button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
