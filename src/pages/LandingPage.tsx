import { motion } from 'framer-motion';
import { BarChart3, Clock, Shield, TrendingUp, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Users, title: 'Employee Management', desc: 'Streamline HR operations' },
    { icon: Clock, title: 'Attendance Tracking', desc: 'Real-time check-in/out' },
    { icon: TrendingUp, title: 'Payroll System', desc: 'Automated salary processing' },
    { icon: BarChart3, title: 'Advanced Reports', desc: 'Data-driven insights' },
    { icon: Zap, title: 'Lightning Fast', desc: 'Optimized performance' },
    { icon: Shield, title: 'Secure & Reliable', desc: 'Enterprise-grade security' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <motion.div
            className="text-2xl font-bold text-gray-900"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            WorkZen
          </motion.div>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Welcome to WorkZen
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Simplifying HR Operations with Modern Technology. Manage employees, attendance, payroll, and reporting all in one platform.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button 
              onClick={() => navigate('/signup')}
              className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors shadow"
            >
              Get Started Free
            </button>
            <button 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 rounded-lg font-semibold transition-colors"
            >
              Learn More
            </button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-20">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                className="bg-white border border-gray-200 p-6 rounded-lg hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Icon className="w-8 h-8 text-gray-700 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Section */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg max-w-md mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Transform HR?</h3>
            <p className="text-gray-600 mb-6">Join thousands of companies using WorkZen to streamline their HR operations.</p>
            <button 
              onClick={() => navigate('/signup')}
              className="w-full px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors"
            >
              Start Your Free Trial
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
