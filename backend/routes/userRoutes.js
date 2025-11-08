import bcrypt from 'bcryptjs';
import express from 'express';
import { body, validationResult } from 'express-validator';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { generatePassword, sendWelcomeEmail } from '../utils/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for profile picture uploads
const profilePictureStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, '../uploads/profile-pictures');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + ext);
  }
});

const profilePictureUpload = multer({
  storage: profilePictureStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, GIF, WebP) are allowed!'));
    }
  }
});

/**
 * Generate Login ID based on format:
 * First 2 letters of first name + First 2 letters of last name + Year of joining + Serial number
 * Example: JODO20220001 (John Doe, joined 2022, serial 0001)
 */
async function generateLoginId(fullName) {
  const names = fullName.trim().split(' ');
  const firstName = names[0] || '';
  const lastName = names[names.length - 1] || '';
  
  const prefix = (firstName.substring(0, 2) + lastName.substring(0, 2)).toUpperCase();
  const year = new Date().getFullYear().toString();
  
  // Get the count of users created this year to determine serial number
  const [count] = await pool.query(
    'SELECT COUNT(*) as count FROM users WHERE YEAR(created_at) = ?',
    [year]
  );
  
  const serialNumber = String(count[0].count + 1).padStart(4, '0');
  
  return `${prefix}${year}${serialNumber}`;
}

// Get all users (Admin only)
router.get('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { role, status, department } = req.query;
    
    let query = `
      SELECT 
        id,
        full_name as fullName,
        email,
        login_id as loginId,
        profile_picture as profilePicture,
        role,
        department,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM users
      WHERE 1=1
    `;
    
    const params = [];
    
    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (department) {
      query += ' AND department = ?';
      params.push(department);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [users] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// Get single user by ID (Admin only)
router.get('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const [users] = await pool.query(
      `SELECT 
        id,
        full_name as fullName,
        email,
        login_id as loginId,
        profile_picture as profilePicture,
        role,
        department,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM users
      WHERE id = ?`,
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

// Create new user (Admin only)
router.post('/', authenticate, authorize(['admin']), [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'hr', 'employee', 'payroll']).withMessage('Invalid role'),
  body('department').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    let { fullName, email, password, role, department } = req.body;

    // Check if email already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Generate random password if not provided (especially for employees)
    const isAutoGeneratedPassword = !password;
    if (isAutoGeneratedPassword) {
      password = generatePassword();
    }
    const plainPassword = password; // Store for email

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique login ID
    const loginId = await generateLoginId(fullName);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password, login_id, role, department, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [fullName, email, hashedPassword, loginId, role, department || null, 'active']
    );

    const userId = result.insertId;

    // Automatically create employee record ONLY for 'employee' role
    if (role === 'employee') {
      try {
        // Generate unique employee code (e.g., EMP001, EMP002, etc.)
        let employeeCode;
        let attempts = 0;
        let codeExists = true;
        
        while (codeExists && attempts < 10) {
          // Get the highest employee code number
          const [maxEmp] = await pool.query(
            'SELECT MAX(CAST(SUBSTRING(employee_code, 4) AS UNSIGNED)) as max_num FROM employees WHERE employee_code LIKE "EMP%"'
          );
          
          const nextNumber = (maxEmp[0].max_num || 0) + 1 + attempts;
          employeeCode = `EMP${String(nextNumber).padStart(3, '0')}`;
          
          // Check if this code already exists
          const [existing] = await pool.query(
            'SELECT id FROM employees WHERE employee_code = ?',
            [employeeCode]
          );
          
          codeExists = existing.length > 0;
          attempts++;
        }

        // Insert employee record
        await pool.query(
          `INSERT INTO employees (user_id, employee_code, department_id, position, status, join_date)
          VALUES (?, ?, NULL, ?, 'active', CURDATE())`,
          [userId, employeeCode, role.toUpperCase()]
        );
        
        console.log(`✅ Employee record created with code: ${employeeCode}`);
      } catch (empError) {
        console.error('❌ Error creating employee record:', empError.message);
        // Don't fail the entire request if employee creation fails
      }
    }

    // Send welcome email if employee role (only if email is enabled)
    let emailSent = false;
    const emailEnabled = process.env.ENABLE_EMAIL === 'true';
    
    if (role === 'employee' && isAutoGeneratedPassword && emailEnabled) {
      try {
        const adminEmail = req.user.email; // Email of admin who created the account
        const emailResult = await sendWelcomeEmail(email, fullName, plainPassword, loginId, adminEmail);
        emailSent = emailResult.success;
        console.log(`✅ Welcome email sent to ${email}`);
      } catch (emailError) {
        console.error('❌ Failed to send welcome email:', emailError.message);
        console.log('⚠️ User created successfully, but email could not be sent. Password:', plainPassword);
        // Don't fail the request if email fails - just log the password
      }
    } else if (role === 'employee' && isAutoGeneratedPassword && !emailEnabled) {
      console.log(`📝 Email disabled. Generated password for ${email}: ${plainPassword}, Login ID: ${loginId}`);
    }

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, user_name, user_role, action, module, details)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, req.user.fullName, req.user.role, 'CREATE', 'Users', `Created new user: ${fullName} (${role})`]
    );

    res.status(201).json({
      success: true,
      message: isAutoGeneratedPassword 
        ? (emailSent 
            ? 'User created successfully. Welcome email sent with login credentials.' 
            : `User created successfully. Password: ${plainPassword} (Email could not be sent - please provide this password to the employee)`)
        : 'User created successfully',
      data: { 
        id: userId,
        emailSent: emailSent,
        generatedPassword: isAutoGeneratedPassword && !emailSent ? plainPassword : undefined
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
});

// Update user (Admin only)
router.put('/:id', authenticate, authorize(['admin']), [
  body('fullName').optional().trim().notEmpty(),
  body('email').optional().isEmail(),
  body('role').optional().isIn(['admin', 'hr', 'employee', 'payroll']),
  body('department').optional().trim(),
  body('status').optional().isIn(['active', 'inactive'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { fullName, email, role, department, status } = req.body;

    // Check if user exists
    const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if email is being changed and already exists
    if (email) {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
    }

    const updates = [];
    const params = [];

    if (fullName) {
      updates.push('full_name = ?');
      params.push(fullName);
    }
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }
    if (department !== undefined) {
      updates.push('department = ?');
      params.push(department || null);
    }
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Handle role changes and employee record management
    if (role) {
      try {
        const [empExists] = await pool.query('SELECT id FROM employees WHERE user_id = ?', [id]);
        
        if (role === 'employee' && empExists.length === 0) {
          // Role changed TO employee - create employee record
          const [maxEmp] = await pool.query('SELECT employee_code FROM employees ORDER BY id DESC LIMIT 1');
          let employeeCode;
          if (maxEmp.length > 0 && maxEmp[0].employee_code) {
            const lastNumber = parseInt(maxEmp[0].employee_code.replace('EMP', ''));
            employeeCode = `EMP${String(lastNumber + 1).padStart(3, '0')}`;
          } else {
            employeeCode = 'EMP001';
          }
          await pool.query(
            'INSERT INTO employees (user_id, employee_code, position, status, join_date) VALUES (?, ?, ?, ?, CURDATE())',
            [id, employeeCode, 'EMPLOYEE', 'active']
          );
        } else if (role !== 'employee' && empExists.length > 0) {
          // Role changed FROM employee - remove employee record
          await pool.query('DELETE FROM employees WHERE user_id = ?', [id]);
        }
      } catch (empError) {
        console.error('Error managing employee record:', empError);
      }
    }

    // Update corresponding employee record if status changed
    if (status) {
      try {
        await pool.query(
          'UPDATE employees SET status = ? WHERE user_id = ?',
          [status, id]
        );
      } catch (empError) {
        console.error('Error updating employee status:', empError);
      }
    }

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, user_name, user_role, action, module, details)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, req.user.fullName, req.user.role, 'UPDATE', 'Users', `Updated user #${id}`]
    );

    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    // Check if user exists
    const [users] = await pool.query('SELECT full_name FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, user_name, user_role, action, module, details)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, req.user.fullName, req.user.role, 'DELETE', 'Users', `Deleted user: ${users[0].full_name}`]
    );

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

// Reset user password (Admin only)
router.post('/:id/reset-password', authenticate, authorize(['admin']), [
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { newPassword } = req.body;

    // Check if user exists
    const [users] = await pool.query('SELECT full_name FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, id]
    );

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, user_name, user_role, action, module, details)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, req.user.fullName, req.user.role, 'UPDATE', 'Users', `Reset password for user: ${users[0].full_name}`]
    );

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

// Activate/Deactivate user (Admin only)
router.patch('/:id/status', authenticate, authorize(['admin']), [
  body('status').isIn(['active', 'inactive']).withMessage('Status must be active or inactive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Check if user exists
    const [users] = await pool.query('SELECT full_name FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await pool.query(
      'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, user_name, user_role, action, module, details)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, req.user.fullName, req.user.role, 'UPDATE', 'Users', 
       `${status === 'active' ? 'Activated' : 'Deactivated'} user: ${users[0].full_name}`]
    );

    res.json({
      success: true,
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
});

// Get user statistics (Admin only)
router.get('/stats/overview', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role = 'hr' THEN 1 ELSE 0 END) as hrManagers,
        SUM(CASE WHEN role = 'payroll' THEN 1 ELSE 0 END) as payrollOfficers,
        SUM(CASE WHEN role = 'employee' THEN 1 ELSE 0 END) as employees,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
      FROM users
    `);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user statistics' });
  }
});

// Upload profile picture
router.post('/profile-picture', authenticate, profilePictureUpload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const profilePicturePath = `/uploads/profile-pictures/${req.file.filename}`;

    // Delete old profile picture if exists
    const [user] = await pool.query('SELECT profile_picture FROM users WHERE id = ?', [req.user.id]);
    if (user[0] && user[0].profile_picture) {
      const oldPicturePath = path.join(__dirname, '..', user[0].profile_picture);
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
      }
    }

    // Update user's profile picture in database
    await pool.query(
      'UPDATE users SET profile_picture = ? WHERE id = ?',
      [profilePicturePath, req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: profilePicturePath
      }
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload profile picture' });
  }
});

export default router;
