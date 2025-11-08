import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export const GlassCard = ({ children, className = '', hover = true, delay = 0 }: GlassCardProps) => {
  return (
    <motion.div
      className={`glass-card p-6 ${className} ${hover ? 'hover:shadow-md hover:border-gray-300' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { y: -4 } : {}}
    >
      {children}
    </motion.div>
  );
};
