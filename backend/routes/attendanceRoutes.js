import express from 'express';
import { pool } from '../config/database.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get attendance records
router.get('/', verifyToken, async (req, res) => {
  try {
    const { date, employeeId } = req.query;
    let query = `
      SELECT 
        a.*, e.employee_code, u.full_name as employee_name,
        d.name as department
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
      AND u.role = 'employee'
    `;
    const params = [];

    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }

    if (employeeId) {
      query += ' AND a.employee_id = ?';
      params.push(employeeId);
    }

    query += ' ORDER BY a.date DESC, a.check_in DESC';

    const [attendance] = await pool.query(query, params);

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendance' });
  }
});

// Check-in endpoint
router.post('/checkin', verifyToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const checkInTime = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
    
    // Get employee record from user_id
    const [employees] = await pool.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
    
    if (employees.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee record not found' });
    }
    
    const empId = employees[0].id;

    // Check if already checked in today
    const [existing] = await pool.query(
      'SELECT id, check_in FROM attendance WHERE employee_id = ? AND date = ?',
      [empId, today]
    );

    if (existing.length > 0 && existing[0].check_in) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already checked in today',
        data: { check_in: existing[0].check_in }
      });
    }

    // Create new check-in record
    const [result] = await pool.query(
      'INSERT INTO attendance (employee_id, date, check_in, status) VALUES (?, ?, ?, ?)',
      [empId, today, checkInTime, 'present']
    );

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, user_name, user_role, action, module, details)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        req.user.fullName || req.user.full_name || req.user.name || req.user.email,
        req.user.role,
        'CHECK_IN',
        'Attendance',
        `Checked in at ${checkInTime}`
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Check-in successful',
      data: {
        id: result.insertId,
        check_in: checkInTime,
        date: today
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, message: 'Failed to check in' });
  }
});

// Mark attendance (check-in/check-out) - Admin/HR use
router.post('/', verifyToken, async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, status, notes } = req.body;

    // Get employee record from user_id
    const [employees] = await pool.query('SELECT id FROM employees WHERE user_id = ?', [employeeId]);
    
    if (employees.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee record not found' });
    }
    
    const empId = employees[0].id;

    // Check if attendance already exists
    const [existing] = await pool.query(
      'SELECT id FROM attendance WHERE employee_id = ? AND date = ?',
      [empId, date]
    );

    if (existing.length > 0) {
      // Update existing attendance
      await pool.query(
        'UPDATE attendance SET check_out = ?, status = ?, notes = ? WHERE id = ?',
        [checkOut, status, notes, existing[0].id]
      );

      res.json({
        success: true,
        message: 'Attendance updated successfully'
      });
    } else {
      // Create new attendance
      await pool.query(
        'INSERT INTO attendance (employee_id, date, check_in, status, notes) VALUES (?, ?, ?, ?, ?)',
        [empId, date, checkIn, status, notes]
      );

      res.status(201).json({
        success: true,
        message: 'Attendance marked successfully'
      });
    }
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark attendance' });
  }
});

// Check-out endpoint
router.patch('/checkout', verifyToken, async (req, res) => {
  try {
    const checkOutTime = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
    const today = new Date().toISOString().split('T')[0];
    
    // Get employee record from user_id
    const [employees] = await pool.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
    
    if (employees.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee record not found' });
    }
    
    const empId = employees[0].id;

    // Check if already checked in
    const [existing] = await pool.query(
      'SELECT id, check_in, check_out FROM attendance WHERE employee_id = ? AND date = ?',
      [empId, today]
    );

    if (existing.length === 0 || !existing[0].check_in) {
      return res.status(400).json({ success: false, message: 'No check-in found for today. Please check in first.' });
    }

    if (existing[0].check_out) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already checked out today',
        data: { check_out: existing[0].check_out }
      });
    }

    // Update today's attendance
    await pool.query(
      'UPDATE attendance SET check_out = ? WHERE employee_id = ? AND date = ?',
      [checkOutTime, empId, today]
    );

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, user_name, user_role, action, module, details)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        req.user.fullName || req.user.full_name || req.user.name || req.user.email,
        req.user.role,
        'CHECK_OUT',
        'Attendance',
        `Checked out at ${checkOutTime}`
      ]
    );

    res.json({
      success: true,
      message: 'Check-out successful',
      data: {
        check_out: checkOutTime,
        date: today
      }
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ success: false, message: 'Failed to check out' });
  }
});

// Get today's attendance status for current user
router.get('/today', verifyToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get employee record from user_id
    const [employees] = await pool.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
    
    if (employees.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee record not found' });
    }
    
    const empId = employees[0].id;

    // Get today's attendance
    const [attendance] = await pool.query(
      'SELECT id, employee_id, date, check_in, check_out, status FROM attendance WHERE employee_id = ? AND date = ?',
      [empId, today]
    );

    if (attendance.length === 0) {
      return res.json({
        success: true,
        data: {
          hasCheckedIn: false,
          hasCheckedOut: false,
          check_in: null,
          check_out: null,
          date: today
        }
      });
    }

    res.json({
      success: true,
      data: {
        hasCheckedIn: !!attendance[0].check_in,
        hasCheckedOut: !!attendance[0].check_out,
        check_in: attendance[0].check_in,
        check_out: attendance[0].check_out,
        status: attendance[0].status,
        date: today
      }
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch today\'s attendance' });
  }
});

// Get attendance summary
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const { month, year } = req.query;

    const [summary] = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM attendance
      WHERE MONTH(date) = ? AND YEAR(date) = ?
      GROUP BY status
    `, [month, year]);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendance summary' });
  }
});

export default router;
