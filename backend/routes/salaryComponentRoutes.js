import express from 'express';
import { pool as db } from '../config/database.js';
import { checkRole, verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get all salary components for an employee
router.get('/:employeeId', verifyToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // Check if user has permission (admin, payroll, or own data)
    const hasPermission = req.user.role === 'admin' || 
                         req.user.role === 'payroll' || 
                         req.user.id === parseInt(employeeId);
    
    if (!hasPermission) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view salary components' 
      });
    }

    const [components] = await db.query(
      `SELECT sc.*, e.salary as base_salary
       FROM salary_components sc
       JOIN employees e ON sc.employee_id = e.id
       WHERE sc.employee_id = (SELECT id FROM employees WHERE user_id = ?)
       AND sc.is_active = TRUE
       ORDER BY sc.component_type, sc.id`,
      [employeeId]
    );

    // Get employee salary info
    const [employee] = await db.query(
      `SELECT e.salary, e.wage_type, e.working_days_per_week, e.break_time_hours
       FROM employees e
       WHERE e.user_id = ?`,
      [employeeId]
    );

    res.json({
      success: true,
      data: {
        components,
        salaryInfo: employee[0] || null
      }
    });
  } catch (error) {
    console.error('Error fetching salary components:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching salary components' 
    });
  }
});

// Create salary component (Admin only)
router.post('/', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const {
      userId,
      componentName,
      componentType,
      computationType,
      value,
      percentageOf
    } = req.body;

    // Validate required fields
    if (!userId || !componentName || !componentType || !computationType || !value) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get employee_id from user_id
    const [employee] = await db.query(
      'SELECT id FROM employees WHERE user_id = ?',
      [userId]
    );

    if (!employee.length) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const employeeId = employee[0].id;

    // Insert component
    const [result] = await db.query(
      `INSERT INTO salary_components 
       (employee_id, component_name, component_type, computation_type, value, percentage_of, is_active)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [employeeId, componentName, componentType, computationType, value, percentageOf || null]
    );

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, user_name, user_role, action, module, details)
       VALUES (?, ?, ?, 'CREATE', 'SALARY_COMPONENT', ?)`,
      [
        req.user.id,
        req.user.fullName,
        req.user.role,
        JSON.stringify({ componentName, employeeId })
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Salary component created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating salary component:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating salary component'
    });
  }
});

// Update salary component (Admin only)
router.put('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { componentName, componentType, computationType, value, percentageOf, isActive } = req.body;

    const [result] = await db.query(
      `UPDATE salary_components 
       SET component_name = ?, component_type = ?, computation_type = ?, 
           value = ?, percentage_of = ?, is_active = ?
       WHERE id = ?`,
      [componentName, componentType, computationType, value, percentageOf || null, isActive, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Salary component not found'
      });
    }

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, user_name, user_role, action, module, details)
       VALUES (?, ?, ?, 'UPDATE', 'SALARY_COMPONENT', ?)`,
      [req.user.id, req.user.fullName, req.user.role, JSON.stringify({ componentId: id })]
    );

    res.json({
      success: true,
      message: 'Salary component updated successfully'
    });
  } catch (error) {
    console.error('Error updating salary component:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating salary component'
    });
  }
});

// Delete salary component (Admin only)
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete by setting is_active to false
    const [result] = await db.query(
      'UPDATE salary_components SET is_active = FALSE WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Salary component not found'
      });
    }

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, user_name, user_role, action, module, details)
       VALUES (?, ?, ?, 'DELETE', 'SALARY_COMPONENT', ?)`,
      [req.user.id, req.user.fullName, req.user.role, JSON.stringify({ componentId: id })]
    );

    res.json({
      success: true,
      message: 'Salary component deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting salary component:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting salary component'
    });
  }
});

// Calculate salary based on components
router.post('/calculate', verifyToken, async (req, res) => {
  try {
    const { userId, baseSalary, workedDays, totalDays } = req.body;

    if (!userId || !baseSalary) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get employee_id
    const [employee] = await db.query(
      'SELECT id FROM employees WHERE user_id = ?',
      [userId]
    );

    if (!employee.length) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const employeeId = employee[0].id;

    // Get all active components
    const [components] = await db.query(
      `SELECT * FROM salary_components 
       WHERE employee_id = ? AND is_active = TRUE
       ORDER BY component_type, id`,
      [employeeId]
    );

    // Calculate components
    const calculations = {
      earnings: [],
      deductions: [],
      grossSalary: 0,
      totalDeductions: 0,
      netSalary: 0
    };

    const baseValues = {
      wage: parseFloat(baseSalary),
      basic_salary: 0,
      gross_salary: 0
    };

    // First pass: Calculate basic salary and fixed earnings
    components.forEach(component => {
      if (component.component_type === 'earning') {
        let amount = 0;

        if (component.computation_type === 'fixed') {
          amount = parseFloat(component.value);
        } else if (component.computation_type === 'percentage') {
          if (component.percentage_of === 'wage' || component.percentage_of === 'basic_salary') {
            amount = (parseFloat(baseSalary) * parseFloat(component.value)) / 100;
            if (component.component_name.toLowerCase().includes('basic')) {
              baseValues.basic_salary = amount;
            }
          }
        }

        if (amount > 0) {
          calculations.earnings.push({
            name: component.component_name,
            rate: component.computation_type === 'percentage' ? component.value : null,
            amount: amount
          });
          calculations.grossSalary += amount;
        }
      }
    });

    // Second pass: Calculate components that depend on basic_salary
    components.forEach(component => {
      if (component.component_type === 'earning' && component.computation_type === 'percentage') {
        if (component.percentage_of === 'basic_salary' && !component.component_name.toLowerCase().includes('basic')) {
          const amount = (baseValues.basic_salary * parseFloat(component.value)) / 100;
          
          // Check if already added
          const exists = calculations.earnings.find(e => e.name === component.component_name);
          if (!exists) {
            calculations.earnings.push({
              name: component.component_name,
              rate: component.value,
              amount: amount
            });
            calculations.grossSalary += amount;
          }
        }
      }
    });

    baseValues.gross_salary = calculations.grossSalary;

    // Calculate deductions
    components.forEach(component => {
      if (component.component_type === 'deduction') {
        let amount = 0;

        if (component.computation_type === 'fixed') {
          amount = parseFloat(component.value);
        } else if (component.computation_type === 'percentage') {
          const base = component.percentage_of === 'gross_salary' 
            ? baseValues.gross_salary 
            : baseValues.basic_salary;
          amount = (base * parseFloat(component.value)) / 100;
        }

        if (amount > 0) {
          calculations.deductions.push({
            name: component.component_name,
            rate: component.computation_type === 'percentage' ? component.value : null,
            amount: amount
          });
          calculations.totalDeductions += amount;
        }
      }
    });

    // Adjust for partial month if workedDays provided
    if (workedDays && totalDays) {
      const ratio = workedDays / totalDays;
      calculations.grossSalary = calculations.grossSalary * ratio;
      calculations.totalDeductions = calculations.totalDeductions * ratio;
    }

    calculations.netSalary = calculations.grossSalary - calculations.totalDeductions;

    res.json({
      success: true,
      data: calculations
    });
  } catch (error) {
    console.error('Error calculating salary:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating salary'
    });
  }
});

// Update employee salary info (Admin only)
router.put('/salary-info/:userId', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { salary, wageType, workingDaysPerWeek, breakTimeHours } = req.body;

    const [result] = await db.query(
      `UPDATE employees 
       SET salary = ?, wage_type = ?, working_days_per_week = ?, break_time_hours = ?
       WHERE user_id = ?`,
      [salary, wageType, workingDaysPerWeek, breakTimeHours, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, user_name, user_role, action, module, details)
       VALUES (?, ?, ?, 'UPDATE', 'SALARY_INFO', ?)`,
      [req.user.id, req.user.fullName, req.user.role, JSON.stringify({ userId, salary })]
    );

    res.json({
      success: true,
      message: 'Salary info updated successfully'
    });
  } catch (error) {
    console.error('Error updating salary info:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating salary info'
    });
  }
});

export default router;
