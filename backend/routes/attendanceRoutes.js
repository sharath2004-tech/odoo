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

// Mark attendance (check-in/check-out)
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
    const { checkOut } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    // Get employee record from user_id
    const [employees] = await pool.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
    
    if (employees.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee record not found' });
    }
    
    const empId = employees[0].id;

    // Update today's attendance
    const [result] = await pool.query(
      'UPDATE attendance SET check_out = ? WHERE employee_id = ? AND date = ?',
      [checkOut, empId, today]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'No check-in found for today' });
    }

    res.json({
      success: true,
      message: 'Check-out successful'
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ success: false, message: 'Failed to check out' });
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
