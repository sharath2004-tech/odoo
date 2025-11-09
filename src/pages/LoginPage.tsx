import { motion } from 'framer-motion';
import { Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    role: 'employee' as UserRole,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.identifier) newErrors.identifier = 'Email or Login ID is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        setIsLoading(true);
        await login(formData.identifier, formData.password, formData.role);
        // Navigate to dashboard - DashboardRouter will handle role-based routing
        navigate('/dashboard');
      } catch (error: unknown) {
        const err = error as Error;
        setErrors({ general: err.message || 'Login failed. Please try again.' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Login Form */}
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-white p-10 rounded-lg shadow-lg border border-gray-200">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img 
                src="/images/workzen-logo.svg" 
                alt="WorkZen Logo" 
                className="w-16 h-16"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to continue to WorkZen</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {errors.general}
              </div>
            )}

            {/* Email or Login ID */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Email or Login ID</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="identifier"
                  placeholder="your.email@example.com or login ID"
                  value={formData.identifier}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-300 rounded-lg px-10 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                  required
                />
              </div>
              {errors.identifier && <p className="text-red-600 text-xs mt-1">{errors.identifier}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-300 rounded-lg px-10 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                  required
                />
              </div>
              {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Login As</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 cursor-pointer"
              >
                <option value="employee">Employee</option>
                <option value="hr">HR Manager</option>
                <option value="payroll">Payroll Officer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link to="#" className="text-gray-700 text-sm hover:text-gray-900 transition-colors font-medium">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-6 rounded-lg shadow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </motion.button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-gray-900 hover:text-gray-700 font-semibold transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
