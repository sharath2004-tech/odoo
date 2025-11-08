import express from 'express';
import { pool } from '../config/database.js';
import { checkRole, verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get all employees (all authenticated users can view, but salary hidden for non-admin/hr)
router.get('/', verifyToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    
    // Hide salary for employees
    const salaryField = (userRole === 'admin' || userRole === 'hr') ? 'e.salary' : 'NULL as salary';
    
    const [employees] = await pool.query(`
      SELECT 
        e.id, e.employee_code, u.full_name, u.email, 
        d.name as department, e.position, e.join_date, 
        e.status, ${salaryField}
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY e.created_at DESC
    `);

    res.json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employees' });
  }
});

// Get employee by ID (all authenticated users can view, but salary hidden for non-admin/hr)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    const [employees] = await pool.query(`
      SELECT 
        e.*, u.full_name, u.email, u.role,
        d.name as department_name
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = ?
    `, [req.params.id]);

    if (employees.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const employee = employees[0];
    
    // Hide salary for employees and payroll
    if (userRole !== 'admin' && userRole !== 'hr') {
      delete employee.salary;
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employee' });
  }
});

// Create new employee
router.post('/', verifyToken, checkRole('admin', 'hr'), async (req, res) => {
  try {
    const { userId, employeeCode, departmentId, position, phone, address, dateOfBirth, joinDate, salary } = req.body;

    const [result] = await pool.query(`
      INSERT INTO employees 
      (user_id, employee_code, department_id, position, phone, address, date_of_birth, join_date, salary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, employeeCode, departmentId, position, phone, address, dateOfBirth, joinDate, salary]);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ success: false, message: 'Failed to create employee' });
  }
});

// Update employee
router.put('/:id', verifyToken, checkRole('admin', 'hr', 'payroll'), async (req, res) => {
  try {
    const { departmentId, position, phone, address, salary, status, wageType, workingDaysPerWeek, breakTimeHours } = req.body;

    // Build update query dynamically based on provided fields
    const updates = [];
    const params = [];

    if (departmentId !== undefined) {
      updates.push('department_id = ?');
      params.push(departmentId);
    }
    if (position !== undefined) {
      updates.push('position = ?');
      params.push(position);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      params.push(address);
    }
    if (salary !== undefined) {
      updates.push('salary = ?');
      params.push(salary);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    // Note: wage_type, working_days_per_week, break_time_hours columns don't exist in current schema
    // These fields are ignored for now

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(req.params.id);

    await pool.query(`
      UPDATE employees 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, user_name, user_role, action, module, details)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        req.user.fullName || req.user.full_name || req.user.name || req.user.email,
        req.user.role,
        'UPDATE',
        'Employee',
        `Updated employee #${req.params.id}${salary !== undefined ? ` - New salary: ₹${salary}` : ''}`
      ]
    );

    res.json({
      success: true,
      message: 'Employee updated successfully'
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ success: false, message: 'Failed to update employee' });
  }
});

// Delete employee
router.delete('/:id', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM employees WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete employee' });
  }
});

export default router;
