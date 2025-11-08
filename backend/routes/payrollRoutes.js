import express from 'express';
import { pool } from '../config/database.js';
import { checkRole, verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Helper function to calculate professional tax based on gross salary
const calculateProfessionalTax = (grossSalary) => {
  // Professional Tax slabs (example based on common Indian state rates)
  if (grossSalary <= 15000) return 0;
  if (grossSalary <= 20000) return 150;
  if (grossSalary <= 30000) return 200;
  return 200; // Maximum PT per month
};

// Helper function to get working days in a month
const getWorkingDaysInMonth = (month, year, workingDaysPerWeek = 5) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    // Assuming 5-day work week (Monday-Friday)
    if (workingDaysPerWeek === 6) {
      if (dayOfWeek !== 0) workingDays++; // Exclude Sunday only
    } else {
      if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDays++; // Exclude Saturday and Sunday
    }
  }
  
  return workingDays;
};

// Get payroll records (admin and payroll only)
router.get('/', verifyToken, checkRole('admin', 'payroll'), async (req, res) => {
  try {
    const { month, year, status, employeeId } = req.query;
    let query = `
      SELECT 
        p.*, e.employee_code, u.full_name as employee_name,
        d.name as department, e.position
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (month && year) {
      query += ' AND p.month = ? AND p.year = ?';
      params.push(month, year);
    }

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (employeeId) {
      query += ' AND p.employee_id = ?';
      params.push(employeeId);
    }

    query += ' ORDER BY p.year DESC, p.month DESC, u.full_name ASC';

    const [payroll] = await pool.query(query, params);

    // Convert string values to numbers for proper frontend calculations
    const formattedPayroll = payroll.map(record => ({
      ...record,
      basic_salary: parseFloat(record.basic_salary) || 0,
      allowances: parseFloat(record.allowances) || 0,
      deductions: parseFloat(record.deductions) || 0,
      provident_fund: parseFloat(record.provident_fund) || 0,
      professional_tax: parseFloat(record.professional_tax) || 0,
      gross_salary: parseFloat(record.gross_salary) || 0,
      net_salary: parseFloat(record.net_salary) || 0,
      worked_days: parseFloat(record.worked_days) || 0,
      total_days: parseFloat(record.total_days) || 0
    }));

    res.json({
      success: true,
      data: formattedPayroll
    });
  } catch (error) {
    console.error('Get payroll error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payroll' });
  }
});

// Get payroll records for the logged-in employee (employee role only)
router.get('/my-payroll', verifyToken, async (req, res) => {
  try {
    const { status } = req.query;
    
    // Get employee record for logged-in user
    const [employee] = await pool.query(
      'SELECT id FROM employees WHERE user_id = ?',
      [req.user.id]
    );

    if (employee.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    let query = `
      SELECT 
        p.*, e.employee_code, u.full_name as employee_name,
        d.name as department, e.position
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = ?
    `;
    const params = [employee[0].id];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.year DESC, p.month DESC';

    const [payroll] = await pool.query(query, params);

    // Convert string values to numbers for proper frontend calculations
    const formattedPayroll = payroll.map(record => ({
      ...record,
      basic_salary: parseFloat(record.basic_salary) || 0,
      allowances: parseFloat(record.allowances) || 0,
      deductions: parseFloat(record.deductions) || 0,
      provident_fund: parseFloat(record.provident_fund) || 0,
      professional_tax: parseFloat(record.professional_tax) || 0,
      gross_salary: parseFloat(record.gross_salary) || 0,
      net_salary: parseFloat(record.net_salary) || 0,
      worked_days: parseFloat(record.worked_days) || 0,
      total_days: parseFloat(record.total_days) || 0
    }));

    res.json({
      success: true,
      data: formattedPayroll
    });
  } catch (error) {
    console.error('Get my payroll error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payroll' });
  }
});

// Generate payroll for a specific month/year (admin and payroll only)
router.post('/generate', verifyToken, checkRole('admin', 'payroll'), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { month, year } = req.body;

    console.log('Generate payroll requested by', req.user);

    if (!month || !year) {
      return res.status(400).json({ 
        success: false, 
        message: 'Month and year are required' 
      });
    }

    await connection.beginTransaction();

    // Get all active employees with their salary components
    const [employees] = await connection.query(`
      SELECT 
        e.id, e.salary, e.employee_code,
        u.full_name as employee_name
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.status = 'active'
    `);

    if (employees.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'No active employees found' 
      });
    }

    const payrollRecords = [];
    const errors = [];

    for (const employee of employees) {
      try {
        // Check if payroll already exists
        const [existing] = await connection.query(
          'SELECT id, locked FROM payroll WHERE employee_id = ? AND month = ? AND year = ?',
          [employee.id, month, year]
        );

        if (existing.length > 0) {
          if (existing[0].locked) {
            errors.push(`${employee.employee_name}: Payroll is locked`);
            continue;
          }
          // Delete existing payroll and components to regenerate
          await connection.query('DELETE FROM payroll_components WHERE payroll_id = ?', [existing[0].id]);
          await connection.query('DELETE FROM payroll WHERE id = ?', [existing[0].id]);
        }

        // Calculate total working days in month (default 5-day work week)
        const totalDays = getWorkingDaysInMonth(month, year, 5);

        // Get attendance for the employee in this month
        const [attendance] = await connection.query(`
          SELECT COUNT(*) as present_days
          FROM attendance
          WHERE employee_id = ? 
          AND MONTH(date) = ? 
          AND YEAR(date) = ?
          AND status IN ('present', 'half_day')
        `, [employee.id, month, year]);

        const workedDays = attendance[0].present_days || 0;
        
        console.log(`Employee ${employee.id} (${employee.employee_name}):`, {
          totalDays,
          workedDays,
          workedDaysType: typeof workedDays
        });

        // Get approved leaves for the month
        const [approvedLeaves] = await connection.query(`
          SELECT SUM(days) as leave_days, leave_type
          FROM leave_requests lr
          JOIN employees e ON lr.employee_id = e.user_id
          WHERE e.id = ?
          AND lr.status = 'approved'
          AND ((MONTH(lr.start_date) = ? AND YEAR(lr.start_date) = ?)
               OR (MONTH(lr.end_date) = ? AND YEAR(lr.end_date) = ?))
          GROUP BY leave_type
        `, [employee.id, month, year, month, year]);

        // Count paid leaves (paid, sick, casual)
        let paidLeaveDays = 0;
        if (approvedLeaves.length > 0) {
          approvedLeaves.forEach(leave => {
            if (['paid', 'sick', 'casual', 'annual'].includes(leave.leave_type)) {
              paidLeaveDays += Number(leave.leave_days) || 0;
            }
          });
        }

        // Effective worked days = actual worked days + paid leave days
        const effectiveWorkedDays = Number(workedDays) + Number(paidLeaveDays);

        // Calculate wage proportion
        const wageProportion = totalDays > 0 ? effectiveWorkedDays / totalDays : 1;

        // Get salary components for the employee
        const [components] = await connection.query(`
          SELECT * FROM salary_components 
          WHERE employee_id = ? AND is_active = TRUE
          ORDER BY component_type, id
        `, [employee.id]);

        let basicSalary = employee.salary || 0;
        let grossSalary = 0;
        let totalAllowances = 0;
        let totalDeductions = 0;
        let providentFund = 0;

        const componentBreakdown = [];

        // First pass: Calculate basic salary if defined as component
        const basicComponent = components.find(c => 
          c.component_name.toLowerCase().includes('basic') && 
          c.component_type === 'earning'
        );

        if (basicComponent) {
          if (basicComponent.computation_type === 'percentage') {
            basicSalary = (employee.salary * basicComponent.value / 100) * wageProportion;
          } else {
            basicSalary = basicComponent.value * wageProportion;
          }
          
          componentBreakdown.push({
            component_name: basicComponent.component_name,
            component_type: 'earning',
            rate_percentage: basicComponent.computation_type === 'percentage' ? basicComponent.value : null,
            amount: basicSalary
          });
        } else {
          // No basic component, use full salary
          basicSalary = employee.salary * wageProportion;
          componentBreakdown.push({
            component_name: 'Basic Salary',
            component_type: 'earning',
            rate_percentage: null,
            amount: basicSalary
          });
        }

        grossSalary = basicSalary;

        // Second pass: Calculate other earnings
        components.forEach(component => {
          if (component.component_type === 'earning' && 
              !component.component_name.toLowerCase().includes('basic')) {
            
            let amount = 0;
            
            if (component.computation_type === 'percentage') {
              const baseValue = component.percentage_of === 'wage' ? employee.salary :
                               component.percentage_of === 'basic_salary' ? basicSalary :
                               component.percentage_of === 'gross_salary' ? grossSalary :
                               basicSalary;
              
              amount = (baseValue * component.value / 100) * wageProportion;
            } else {
              amount = component.value * wageProportion;
            }

            grossSalary += amount;
            totalAllowances += amount;

            componentBreakdown.push({
              component_name: component.component_name,
              component_type: 'earning',
              rate_percentage: component.computation_type === 'percentage' ? component.value : null,
              amount: amount
            });
          }
        });

        // Calculate PF (12% of basic salary for both employee and employer)
        const pfComponent = components.find(c => 
          c.component_name.toLowerCase().includes('pf') || 
          c.component_name.toLowerCase().includes('provident')
        );

        if (pfComponent) {
          if (pfComponent.computation_type === 'percentage') {
            providentFund = (basicSalary * pfComponent.value / 100);
          } else {
            providentFund = pfComponent.value * wageProportion;
          }
          totalDeductions += providentFund;

          componentBreakdown.push({
            component_name: pfComponent.component_name,
            component_type: 'deduction',
            rate_percentage: pfComponent.computation_type === 'percentage' ? pfComponent.value : null,
            amount: providentFund
          });
        } else {
          // Default PF calculation: 12% of basic salary
          providentFund = basicSalary * 0.12;
          totalDeductions += providentFund;

          componentBreakdown.push({
            component_name: 'Provident Fund (PF)',
            component_type: 'deduction',
            rate_percentage: 12,
            amount: providentFund
          });
        }

        // Calculate Professional Tax based on gross salary
        const professionalTax = calculateProfessionalTax(grossSalary);
        totalDeductions += professionalTax;

        componentBreakdown.push({
          component_name: 'Professional Tax',
          component_type: 'deduction',
          rate_percentage: null,
          amount: professionalTax
        });

        // Third pass: Calculate other deductions
        components.forEach(component => {
          if (component.component_type === 'deduction' && 
              !component.component_name.toLowerCase().includes('pf') &&
              !component.component_name.toLowerCase().includes('provident')) {
            
            let amount = 0;
            
            if (component.computation_type === 'percentage') {
              const baseValue = component.percentage_of === 'wage' ? employee.salary :
                               component.percentage_of === 'basic_salary' ? basicSalary :
                               component.percentage_of === 'gross_salary' ? grossSalary :
                               basicSalary;
              
              amount = (baseValue * component.value / 100) * wageProportion;
            } else {
              amount = component.value * wageProportion;
            }

            totalDeductions += amount;

            componentBreakdown.push({
              component_name: component.component_name,
              component_type: 'deduction',
              rate_percentage: component.computation_type === 'percentage' ? component.value : null,
              amount: amount
            });
          }
        });

        // Calculate net salary
        const netSalary = grossSalary - totalDeductions;

        console.log('Payroll calculation', {
          employee: employee.employee_name,
          salary: employee.salary,
          workedDays,
          paidLeaveDays,
          effectiveWorkedDays,
          totalDays,
          wageProportion,
          basicSalary,
          totalAllowances,
          totalDeductions,
          providentFund,
          professionalTax,
          grossSalary,
          netSalary
        });

        console.log('Logging activity for user', req.user);

        // Insert payroll record
        const [payrollResult] = await connection.query(
          `INSERT INTO payroll 
          (employee_id, month, year, basic_salary, allowances, deductions, 
           provident_fund, professional_tax, gross_salary, net_salary, 
           worked_days, total_days, status, processed_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
          [
            employee.id, month, year, basicSalary, totalAllowances, totalDeductions,
            providentFund, professionalTax, grossSalary, netSalary,
            effectiveWorkedDays, totalDays, req.user.id
          ]
        );

        const payrollId = payrollResult.insertId;

        // Insert component breakdown
        for (const comp of componentBreakdown) {
          await connection.query(
            `INSERT INTO payroll_components 
            (payroll_id, component_name, component_type, rate_percentage, amount)
            VALUES (?, ?, ?, ?, ?)`,
            [payrollId, comp.component_name, comp.component_type, comp.rate_percentage, comp.amount]
          );
        }

        payrollRecords.push({
          employee_id: employee.id,
          employee_name: employee.employee_name,
          gross_salary: grossSalary,
          net_salary: netSalary,
          worked_days: effectiveWorkedDays,
          total_days: totalDays
        });

        // Log activity
        await connection.query(
          `INSERT INTO activity_logs (user_id, user_name, user_role, action, module, details)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            req.user.id, 
            req.user.fullName || req.user.full_name || req.user.name || req.user.email,
            req.user.role, 
            'GENERATE', 
            'Payroll', 
            `Generated payroll for ${employee.employee_name} - ${month}/${year}`
          ]
        );

      } catch (empError) {
        console.error(`Error processing employee ${employee.id}:`, empError);
        errors.push(`${employee.employee_name}: ${empError.message}`);
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: `Payroll generated successfully for ${payrollRecords.length} employees`,
      data: {
        recordsCreated: payrollRecords.length,
        payrollRecords,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Generate payroll error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate payroll',
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

// Get payroll details with component breakdown
router.get('/:id', verifyToken, checkRole('admin', 'payroll'), async (req, res) => {
  try {
    // Get payroll record
    const [payroll] = await pool.query(`
      SELECT 
        p.*, e.employee_code, u.full_name as employee_name,
        d.name as department, e.position,
        processor.full_name as processed_by_name
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN users processor ON p.processed_by = processor.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (payroll.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payroll record not found' 
      });
    }

    // Get component breakdown
    const [components] = await pool.query(`
      SELECT * FROM payroll_components 
      WHERE payroll_id = ?
      ORDER BY component_type, id
    `, [req.params.id]);

    res.json({
      success: true,
      data: {
        ...payroll[0],
        components
      }
    });
  } catch (error) {
    console.error('Get payroll details error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payroll details' 
    });
  }
});

// Update payroll status (Process payrun - mark as paid)
router.put('/:id/status', verifyToken, checkRole('admin', 'payroll'), async (req, res) => {
  try {
    const { status, paymentDate } = req.body;

    // Check if payroll is locked
    const [payroll] = await pool.query(
      'SELECT locked, employee_id FROM payroll WHERE id = ?',
      [req.params.id]
    );

    if (payroll.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payroll record not found' 
      });
    }

    if (payroll[0].locked && status === 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot modify locked payroll' 
      });
    }

    const updateData = { status };
    if (paymentDate) {
      updateData.payment_date = paymentDate;
    }
    
    // If marking as paid, lock the payroll
    if (status === 'paid') {
      updateData.locked = true;
      updateData.payment_date = paymentDate || new Date().toISOString().split('T')[0];
    }

    await pool.query(
      'UPDATE payroll SET ? WHERE id = ?',
      [updateData, req.params.id]
    );

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, user_name, user_role, action, module, details)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, 
        req.user.fullName || req.user.full_name || req.user.name || req.user.email,
        req.user.role, 
        'UPDATE', 
        'Payroll', 
        `Updated payroll status to ${status} for payroll ID ${req.params.id}`
      ]
    );

    res.json({
      success: true,
      message: 'Payroll status updated successfully'
    });
  } catch (error) {
    console.error('Update payroll status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update payroll status' 
    });
  }
});

// Delete payroll (admin only, only if not locked)
router.delete('/:id', verifyToken, checkRole('admin'), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Check if payroll is locked
    const [payroll] = await connection.query(
      'SELECT locked FROM payroll WHERE id = ?',
      [req.params.id]
    );

    if (payroll.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Payroll record not found' 
      });
    }

    if (payroll[0].locked) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete locked payroll' 
      });
    }

    // Delete components first
    await connection.query(
      'DELETE FROM payroll_components WHERE payroll_id = ?',
      [req.params.id]
    );

    // Delete payroll
    await connection.query(
      'DELETE FROM payroll WHERE id = ?',
      [req.params.id]
    );

    await connection.commit();

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, user_name, user_role, action, module, details)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, 
        req.user.fullName || req.user.full_name || req.user.name || req.user.email,
        req.user.role, 
        'DELETE', 
        'Payroll', 
        `Deleted payroll ID ${req.params.id}`
      ]
    );

    res.json({
      success: true,
      message: 'Payroll deleted successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Delete payroll error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete payroll' 
    });
  } finally {
    connection.release();
  }
});

// Get payslip (payroll record with components) - accessible by employee for their own, admin/payroll for all
router.get('/payslip/:id', verifyToken, async (req, res) => {
  try {
    // Get payroll with employee details
    const [payroll] = await pool.query(`
      SELECT 
        p.*, e.employee_code, e.position, e.join_date,
        u.full_name as employee_name, u.email,
        d.name as department
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (payroll.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payslip not found' 
      });
    }

    const payslip = payroll[0];

    // Check access: employee can only view their own payslip
    if (req.user.role === 'employee') {
      const [empCheck] = await pool.query(
        'SELECT id FROM employees WHERE id = ? AND user_id = ?',
        [payslip.employee_id, req.user.id]
      );
      
      if (empCheck.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }
    }

    // Get component breakdown
    const [components] = await pool.query(`
      SELECT * FROM payroll_components 
      WHERE payroll_id = ?
      ORDER BY component_type DESC, id
    `, [req.params.id]);

    // Separate earnings and deductions
    const earnings = components.filter(c => c.component_type === 'earning');
    const deductions = components.filter(c => c.component_type === 'deduction');

    res.json({
      success: true,
      data: {
        payroll: payslip,
        earnings,
        deductions
      }
    });
  } catch (error) {
    console.error('Get payslip error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payslip' 
    });
  }
});

// Get employee's payroll history
router.get('/employee/:employeeId', verifyToken, async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Check access
    if (req.user.role === 'employee') {
      const [empCheck] = await pool.query(
        'SELECT id FROM employees WHERE id = ? AND user_id = ?',
        [employeeId, req.user.id]
      );
      
      if (empCheck.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }
    }

    const [payrollHistory] = await pool.query(`
      SELECT 
        p.id, p.month, p.year, 
        (p.basic_salary + p.allowances) as gross_salary,
        p.net_salary, 
        p.status, p.payment_date, p.worked_days, p.total_days
      FROM payroll p
      WHERE p.employee_id = ?
      ORDER BY p.year DESC, p.month DESC
    `, [employeeId]);

    res.json({
      success: true,
      data: payrollHistory
    });
  } catch (error) {
    console.error('Get employee payroll history error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payroll history' 
    });
  }
});

export default router;
