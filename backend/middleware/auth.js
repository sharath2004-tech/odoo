import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

// Authenticate user with JWT token
export const authenticate = async (req, res, next) => {
  try {
    // Check for token in Authorization header OR HttpOnly cookie
    let token = req.headers.authorization?.split(' ')[1];
    
    // Fallback to cookie if no Authorization header
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }
    
    console.log('🔑 Authentication attempt:', {
      hasAuthHeader: !!req.headers.authorization,
      hasCookie: !!req.cookies?.token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
    });

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded:', { userId: decoded.id, email: decoded.email });
    
    // Verify user still exists and is active
    const [users] = await pool.query(
      'SELECT id, full_name, email, role, status FROM users WHERE id = ?',
      [decoded.id]
    );
    
    if (users.length === 0) {
      console.log('❌ User not found in database');
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }
    
    const user = users[0];
    console.log('📋 User found in database:', {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status
    });
    
    if (user.status === 'inactive') {
      console.log('❌ User account is inactive');
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
    
    console.log('✅ Authentication successful, user attached to request');
    next();
  } catch (error) {
    console.log('❌ Authentication error:', error.message);
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
    console.log('🔐 checkRole middleware:', {
      user: req.user,
      requiredRoles: roles,
      userRole: req.user?.role,
      isAdmin: req.user?.role === 'admin'
    });

    if (!req.user) {
      console.log('❌ No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login first'
      });
    }

    // Admin has access to everything
    if (req.user.role === 'admin') {
      console.log('✅ Admin access granted');
      return next();
    }

    // Check if user's role is in allowed roles
    if (!roles.includes(req.user.role)) {
      console.log('❌ Role not in allowed list');
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires one of these roles: ${roles.join(', ')}`
      });
    }

    console.log('✅ Role check passed');
    next();
  };
};

// Legacy alias for backward compatibility
export const verifyToken = authenticate;
