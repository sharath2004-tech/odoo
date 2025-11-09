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
        e.id, e.employee_code, u.full_name, u.email, u.role,
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
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const employeeId = req.params.id;
    
    const { 
      departmentId, position, phone, address, salary, status, 
      date_of_birth, gender, marital_status, nationality,
      bank_name, account_number, ifsc_code, pan_number, uan_number
    } = req.body;

    // Check if employee is updating their own profile
    const [employeeRecord] = await pool.query(
      'SELECT user_id FROM employees WHERE id = ?',
      [employeeId]
    );

    if (employeeRecord.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const isOwnProfile = employeeRecord[0].user_id === userId;

    // Define fields that can be updated by role
    const restrictedFields = ['departmentId', 'position', 'salary', 'status'];
    const personalInfoFields = ['phone', 'address', 'date_of_birth', 'gender', 'marital_status', 'nationality', 'bank_name', 'account_number', 'ifsc_code', 'pan_number', 'uan_number'];

    // If user is employee role, they can only update their own profile's personal info
    if (userRole === 'employee') {
      if (!isOwnProfile) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. You can only update your own profile.' 
        });
      }

      // Check if employee is trying to update restricted fields
      const attemptingRestrictedUpdate = restrictedFields.some(field => {
        if (field === 'departmentId') return departmentId !== undefined;
        if (field === 'position') return position !== undefined;
        if (field === 'salary') return salary !== undefined;
        if (field === 'status') return status !== undefined;
        return false;
      });

      if (attemptingRestrictedUpdate) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Employees can only update personal information fields.' 
        });
      }
    } else if (!['admin', 'hr', 'payroll'].includes(userRole)) {
      // Other roles must have admin, hr, or payroll privileges
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. This action requires one of these roles: admin, hr, payroll.' 
      });
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const params = [];

    // Restricted fields (only admin/hr/payroll can update)
    if (departmentId !== undefined && ['admin', 'hr', 'payroll'].includes(userRole)) {
      updates.push('department_id = ?');
      params.push(departmentId);
    }
    if (position !== undefined && ['admin', 'hr', 'payroll'].includes(userRole)) {
      updates.push('position = ?');
      params.push(position);
    }
    if (salary !== undefined && ['admin', 'hr', 'payroll'].includes(userRole)) {
      updates.push('salary = ?');
      params.push(salary);
    }
    if (status !== undefined && ['admin', 'hr', 'payroll'].includes(userRole)) {
      updates.push('status = ?');
      params.push(status);
    }

    // Personal information fields (all roles can update if it's their own profile)
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone || null);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      params.push(address || null);
    }
    if (date_of_birth !== undefined) {
      updates.push('date_of_birth = ?');
      // Convert empty string to null for DATE column
      params.push(date_of_birth === '' ? null : date_of_birth);
    }
    if (gender !== undefined) {
      updates.push('gender = ?');
      params.push(gender || null);
    }
    if (marital_status !== undefined) {
      updates.push('marital_status = ?');
      params.push(marital_status || null);
    }
    if (nationality !== undefined) {
      updates.push('nationality = ?');
      params.push(nationality || null);
    }
    if (bank_name !== undefined) {
      updates.push('bank_name = ?');
      params.push(bank_name || null);
    }
    if (account_number !== undefined) {
      updates.push('account_number = ?');
      params.push(account_number || null);
    }
    if (ifsc_code !== undefined) {
      updates.push('ifsc_code = ?');
      params.push(ifsc_code || null);
    }
    if (pan_number !== undefined) {
      updates.push('pan_number = ?');
      params.push(pan_number || null);
    }
    if (uan_number !== undefined) {
      updates.push('uan_number = ?');
      params.push(uan_number || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(employeeId);

    await pool.query(`
      UPDATE employees 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);

    // Log activity
    const activityDetails = userRole === 'employee' 
      ? `Updated own profile personal information`
      : `Updated employee #${employeeId}${salary !== undefined ? ` - New salary: ₹${salary}` : ''}`;

    await pool.query(
      `INSERT INTO activity_logs (user_id, user_name, user_role, action, module, details)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        req.user.fullName || req.user.full_name || req.user.name || req.user.email,
        req.user.role,
        'UPDATE',
        'Employee',
        activityDetails
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
