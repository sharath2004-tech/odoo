import { pool } from './config/database.js';

async function checkData() {
  try {
    // Check employees
    const [employees] = await pool.query(`
      SELECT e.id, e.employee_code, u.full_name, e.salary, e.status
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.status = 'active'
    `);

    console.log('=== ACTIVE EMPLOYEES ===');
    console.log(`Total: ${employees.length}`);
    employees.forEach(emp => {
      console.log(`  ID ${emp.id}: ${emp.employee_code} - ${emp.full_name} - ₹${emp.salary || 0}`);
    });

    // Check attendance for November 2025
    const [attendance] = await pool.query(`
      SELECT employee_id, COUNT(*) as days
      FROM attendance
      WHERE MONTH(date) = 11 AND YEAR(date) = 2025
      GROUP BY employee_id
    `);

    console.log('\n=== ATTENDANCE (November 2025) ===');
    console.log(`Total records: ${attendance.length}`);
    attendance.forEach(att => {
      const emp = employees.find(e => e.id === att.employee_id);
      console.log(`  ${emp ? emp.full_name : 'Employee ' + att.employee_id}: ${att.days} days`);
    });

    // Check salary components
    const [components] = await pool.query(`
      SELECT sc.employee_id, sc.component_name, sc.value, sc.computation_type
      FROM salary_components sc
    `);

    console.log('\n=== SALARY COMPONENTS ===');
    console.log(`Total: ${components.length}`);
    components.forEach(comp => {
      const emp = employees.find(e => e.id === comp.employee_id);
      console.log(`  ${emp ? emp.full_name : 'Employee ' + comp.employee_id}: ${comp.component_name} - ${comp.value}${comp.computation_type === 'percentage' ? '%' : ''}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkData();
