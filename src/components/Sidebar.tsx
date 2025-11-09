import { motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar = ({ isCollapsed = false, onToggleCollapse }: SidebarProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Build menu items based on role
  const baseMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'hr', 'payroll', 'employee'] },
    { icon: Users, label: 'Employees', path: '/employees', roles: ['admin', 'hr', 'employee'] }, // Employee can view only
    { icon: Clock, label: 'Attendance', path: '/attendance', roles: ['admin', 'hr', 'payroll', 'employee'] },
    { icon: CreditCard, label: 'Payroll', path: '/payroll', roles: ['admin', 'payroll'] }, // HR removed
    { icon: Calendar, label: 'Leave Management', path: '/leaves', roles: ['admin', 'hr', 'payroll', 'employee'] },
    { icon: BarChart3, label: 'Reports', path: '/reports', roles: ['admin', 'hr', 'payroll'] },
    { icon: Users, label: 'User Management', path: '/users', roles: ['admin'] },
    { icon: Activity, label: 'Activity Logs', path: '/activity-logs', roles: ['admin'] },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin'] }
  ];

  // Filter menu items based on user role
  const menuItems = baseMenuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-40 glass p-2 rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <motion.div
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col z-30 lg:z-10 shadow-lg ${
          isOpen ? 'block' : 'hidden lg:block'
        }`}
        initial={{ width: isCollapsed ? '80px' : '256px' }}
        animate={{ width: isCollapsed ? '80px' : '256px' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Logo & Desktop Toggle */}
        <div className="p-6 border-b border-gray-200 relative">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <img 
              src="/images/workzen-logo.svg" 
              alt="WorkZen Logo" 
              className={`${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'} transition-all duration-300`}
            />
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h1 className="text-2xl font-bold text-gray-900">
                  WorkZen
                </h1>
                <p className="text-gray-500 text-xs mt-0.5">HR Management System</p>
              </motion.div>
            )}
          </div>
          
          {/* Desktop Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex absolute -right-3 top-8 bg-white border border-gray-200 rounded-full p-1 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-md"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight size={16} className="text-gray-600" />
            ) : (
              <ChevronLeft size={16} className="text-gray-600" />
            )}
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-gray-200">
            {isCollapsed ? (
              <div className="flex justify-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-gray-900 font-semibold text-sm truncate">{user.fullName}</p>
                <p className="text-gray-600 text-xs capitalize">{user.role}</p>
              </div>
            )}
          </div>
        )}

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={i}
                onClick={() => handleNavigate(item.path)}
                className={`flex items-center w-full py-3 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 border border-transparent hover:border-gray-200 ${
                  isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'
                }`}
                whileHover={{ x: isCollapsed ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
                title={isCollapsed ? item.label : ''}
              >
                <Icon size={20} className="text-gray-700" />
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </motion.button>
            );
          })}
        </nav>

        {/* Theme Toggle & Logout */}
        <div className="p-4 space-y-2 border-t border-gray-200">
          <button
            onClick={() => setIsDark(!isDark)}
            className={`flex items-center w-full py-3 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 ${
              isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'
            }`}
            title={isCollapsed ? (isDark ? 'Light Mode' : 'Dark Mode') : ''}
          >
            {isDark ? <Sun size={20} className="text-gray-700" /> : <Moon size={20} className="text-gray-700" />}
            {!isCollapsed && <span className="font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button
            onClick={handleLogout}
            className={`flex items-center w-full py-3 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 ${
              isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'
            }`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
