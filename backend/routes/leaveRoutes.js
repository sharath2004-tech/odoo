import express from 'express';
import { body, validationResult } from 'express-validator';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '../uploads/certificates');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|gif|webp|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (JPG, PNG, GIF, WebP), PDFs, and Word documents are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: fileFilter
});

// Get all leave requests (Admin, HR, Payroll can view all)
router.get('/', authenticate, authorize(['admin', 'hr', 'payroll']), async (req, res) => {
  try {
    const { status, employeeId, startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        l.id,
        l.employee_id as employeeId,
        e.full_name as employeeName,
        l.leave_type as leaveType,
        l.start_date as startDate,
        l.end_date as endDate,
        l.reason,
        l.certificate_url as certificateUrl,
        l.days,
        l.status,
        l.approved_by as approvedBy,
        l.approved_at as approvedAt,
        l.created_at as createdAt
      FROM leave_requests l
      JOIN users e ON l.employee_id = e.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (status) {
      query += ' AND l.status = ?';
      params.push(status);
    }
    
    if (employeeId) {
      query += ' AND l.employee_id = ?';
      params.push(employeeId);
    }
    
    if (startDate) {
      query += ' AND l.start_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND l.end_date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY l.created_at DESC';
    
    const [leaves] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leave requests' });
  }
});

// Get employee's own leave requests
router.get('/my-leaves', authenticate, async (req, res) => {
  try {
    const [leaves] = await pool.query(
      `SELECT 
        l.id,
        l.employee_id as employeeId,
        u.full_name as employeeName,
        l.leave_type as leaveType,
        l.start_date as startDate,
        l.end_date as endDate,
        l.reason,
        l.certificate_url as certificateUrl,
        l.days,
        l.status,
        l.approved_by as approvedBy,
        l.approved_at as approvedAt,
        l.created_at as createdAt
      FROM leave_requests l
      JOIN users u ON l.employee_id = u.id
      WHERE l.employee_id = ?
      ORDER BY l.created_at DESC`,
      [req.user.id]
    );
    
    res.json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('Get my leaves error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leave requests' });
  }
});

// Create leave request (All employees)
router.post('/', authenticate, upload.single('certificate'), [
  body('leaveType').notEmpty().withMessage('Leave type is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('reason').trim().notEmpty().withMessage('Reason is required'),
  body('days').isInt({ min: 1 }).withMessage('Days must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { leaveType, startDate, endDate, reason, days } = req.body;
    
    // Get certificate URL (either uploaded file or provided URL)
    let certificateUrl = req.body.certificateUrl || null;
    if (req.file) {
      certificateUrl = `/uploads/certificates/${req.file.filename}`;
    }

    // Validate certificate requirement for specific leave types
    const requiresCertificate = ['sick', 'maternity', 'paternity'].includes(leaveType);
    if (requiresCertificate && !certificateUrl) {
      return res.status(400).json({ 
        success: false, 
        message: `Certificate is required for ${leaveType} leave. Please upload a medical certificate or supporting document.`
      });
    }

    const [result] = await pool.query(
      `INSERT INTO leave_requests 
      (employee_id, leave_type, start_date, end_date, reason, days, certificate_url, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [req.user.id, leaveType, startDate, endDate, reason, days, certificateUrl]
    );

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, user_name, user_role, action, module, details)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, req.user.fullName, req.user.role, 'CREATE', 'Leave', `Created ${leaveType} leave request for ${days} days`]
    );

    res.status(201).json({
      success: true,
      message: 'Leave request created successfully',
      data: { 
        id: result.insertId,
        certificateUrl: certificateUrl
      }
    });
  } catch (error) {
    console.error('Create leave error:', error);
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File size too large. Maximum 10MB allowed.' });
      }
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Failed to create leave request' });
  }
});

// Approve/Reject leave request (HR and Payroll Officer)
router.patch('/:id/status', authenticate, authorize(['hr', 'payroll']), [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Get leave request details
    const [leaves] = await pool.query(
      'SELECT employee_id, days, leave_type FROM leave_requests WHERE id = ?',
      [id]
    );

    if (leaves.length === 0) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    // Update leave status
    await pool.query(
      `UPDATE leave_requests 
      SET status = ?, approved_by = ?, approved_at = NOW() 
      WHERE id = ?`,
      [status, req.user.id, id]
    );

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, user_name, user_role, action, module, details)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, req.user.fullName, req.user.role, status.toUpperCase(), 'Leave', 
       `${status.charAt(0).toUpperCase() + status.slice(1)} leave request #${id}`]
    );

    res.json({
      success: true,
      message: `Leave request ${status} successfully`
    });
  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update leave status' });
  }
});

// Update leave request (Admin only)
router.put('/:id', authenticate, authorize(['admin']), [
  body('leaveType').optional().notEmpty(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('days').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const { id } = req.params;
    const { leaveType, startDate, endDate, reason, days } = req.body;

    const updates = [];
    const params = [];

    if (leaveType) {
      updates.push('leave_type = ?');
      params.push(leaveType);
    }
    if (startDate) {
      updates.push('start_date = ?');
      params.push(startDate);
    }
    if (endDate) {
      updates.push('end_date = ?');
      params.push(endDate);
    }
    if (reason) {
      updates.push('reason = ?');
      params.push(reason);
    }
    if (days) {
      updates.push('days = ?');
      params.push(days);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(id);

    await pool.query(
      `UPDATE leave_requests SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, user_name, user_role, action, module, details)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, req.user.fullName, req.user.role, 'UPDATE', 'Leave', `Updated leave request #${id}`]
    );

    res.json({
      success: true,
      message: 'Leave request updated successfully'
    });
  } catch (error) {
    console.error('Update leave error:', error);
    res.status(500).json({ success: false, message: 'Failed to update leave request' });
  }
});

// Delete leave request (Admin only)
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM leave_requests WHERE id = ?', [id]);

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, user_name, user_role, action, module, details)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, req.user.fullName, req.user.role, 'DELETE', 'Leave', `Deleted leave request #${id}`]
    );

    res.json({
      success: true,
      message: 'Leave request deleted successfully'
    });
  } catch (error) {
    console.error('Delete leave error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete leave request' });
  }
});

// Get leave statistics
router.get('/stats', authenticate, authorize(['admin', 'hr', 'payroll']), async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'approved' THEN days ELSE 0 END) as totalApprovedDays
      FROM leave_requests
    `);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get leave stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leave statistics' });
  }
});

export default router;
