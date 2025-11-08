import express from 'express';
import { pool } from '../config/database.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard metrics
router.get('/metrics', verifyToken, async (req, res) => {
  try {
    // Total employees
    const [employeeCount] = await pool.query(
      'SELECT COUNT(*) as total FROM employees WHERE status = "active"'
    );

    // Attendance rate (this month)
    const [attendanceRate] = await pool.query(`
      SELECT 
        (COUNT(CASE WHEN status = 'present' THEN 1 END) * 100.0 / COUNT(*)) as rate
      FROM attendance
      WHERE MONTH(date) = MONTH(CURRENT_DATE) 
      AND YEAR(date) = YEAR(CURRENT_DATE)
    `);

    // Total payroll (this month)
    const [payrollTotal] = await pool.query(`
      SELECT SUM(net_salary) as total
      FROM payroll
      WHERE month = MONTH(CURRENT_DATE) 
      AND year = YEAR(CURRENT_DATE)
    `);

    // Department count
    const [deptCount] = await pool.query(
      'SELECT COUNT(*) as total FROM departments'
    );

    res.json({
      success: true,
      data: {
        totalEmployees: employeeCount[0].total,
        attendanceRate: attendanceRate[0]?.rate ? parseFloat(attendanceRate[0].rate).toFixed(1) : '0.0',
        monthlyPayroll: payrollTotal[0].total || 0,
        totalDepartments: deptCount[0].total
      }
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch metrics' });
  }
});

// Get recent activities
router.get('/activities', verifyToken, async (req, res) => {
  try {
    const [activities] = await pool.query(`
      SELECT 
        'attendance' as type,
        CONCAT(u.full_name, ' checked in at ', TIME_FORMAT(a.check_in, '%h:%i %p')) as message,
        a.created_at as timestamp
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE a.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY a.created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activities' });
  }
});

export default router;
