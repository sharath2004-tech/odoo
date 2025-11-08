import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function fixSalaries() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3308,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'workzen_hrms'
    });

    // Update null salaries
    await connection.query('UPDATE employees SET salary = 50000 WHERE salary IS NULL');
    console.log('✅ Updated employees with null salaries to ₹50,000');

    // Add components for employees without them
    const [employees] = await connection.query(`
      SELECT e.id, u.full_name 
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.status = 'active'
      AND e.id NOT IN (SELECT DISTINCT employee_id FROM salary_components WHERE is_active = TRUE)
    `);

    for (const emp of employees) {
      const components = [
        ['Basic Salary', 'earning', 'percentage', 50, 'wage'],
        ['HRA', 'earning', 'percentage', 50, 'basic_salary']
      ];

      for (const comp of components) {
        await connection.query(`
          INSERT INTO salary_components 
          (employee_id, component_name, component_type, computation_type, value, percentage_of, is_active)
          VALUES (?, ?, ?, ?, ?, ?, TRUE)
        `, [emp.id, ...comp]);
      }
      console.log(`✅ Added components for ${emp.full_name}`);
    }

    // Show final state
    const [result] = await connection.query(`
      SELECT e.employee_code, u.full_name, e.position, e.salary,
             COUNT(sc.id) as component_count
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN salary_components sc ON e.id = sc.employee_id AND sc.is_active = TRUE
      WHERE e.status = 'active'
      GROUP BY e.id
      ORDER BY e.employee_code
    `);

    console.log('\n📊 All Active Employees:');
    result.forEach(emp => {
      console.log(`   ${emp.employee_code}: ${emp.full_name} - ₹${emp.salary} (${emp.component_count} components)`);
    });

    console.log('\n✅ All employees ready for payroll generation!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

fixSalaries();
