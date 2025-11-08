import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

// Authenticate user with JWT token
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists and is active
    const [users] = await pool.query(
      'SELECT id, full_name, email, role, status FROM users WHERE id = ?',
      [decoded.id]
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }
    
    const user = users[0];
    
    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact administrator'
      });
    }
    
    // Attach user info to request
    req.user = {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Authentication failed'
    });
  }
};

// Authorize user with specific roles
export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login first'
      });
    }

    // Admin has access to everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires one of these roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

// Legacy checkRole that accepts multiple arguments
export const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login first'
      });
    }

    // Admin has access to everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user's role is in allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires one of these roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Legacy alias for backward compatibility
export const verifyToken = authenticate;
