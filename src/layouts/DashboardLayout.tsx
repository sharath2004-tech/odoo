import { motion } from 'framer-motion';
import { Bell, LogOut, Search, User } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export const DashboardLayout = ({ children, title = 'Dashboard' }: DashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Navigation */}
        <nav className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4 flex justify-between items-center">
            <h1 className="heading-3">{title}</h1>
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="hidden md:flex items-center bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent ml-2 text-gray-900 placeholder-gray-400 outline-none w-40"
                />
              </div>

              {/* Notifications */}
              <motion.button
                className="bg-white border border-gray-200 p-2 rounded-lg hover:bg-gray-50"
                whileHover={{ scale: 1.05 }}
              >
                <Bell size={20} className="text-gray-700" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </motion.button>

              {/* Profile */}
              <div className="relative">
                <motion.button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="bg-white border border-gray-200 p-2 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <User size={20} className="text-gray-700" />
                  <span className="text-gray-900 text-sm hidden sm:inline truncate max-w-20">{user?.fullName}</span>
                </motion.button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setShowProfileMenu(false)}
                    />
                    
                    {/* Menu */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-40 overflow-hidden"
                    >
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <p className="text-gray-900 font-semibold">{user?.fullName}</p>
                        <p className="text-gray-600 text-sm">{user?.email}</p>
                        <p className="text-gray-500 text-xs mt-1 capitalize">
                          Role: <span className="font-medium">{user?.role}</span>
                        </p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            navigate('/profile');
                          }}
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                        >
                          <User size={18} />
                          <span>My Profile</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            logout();
                            navigate('/login');
                          }}
                          className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-3"
                        >
                          <LogOut size={18} />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <motion.div
          className="p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};
