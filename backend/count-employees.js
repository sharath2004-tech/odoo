import mysql from 'mysql2/promise';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbConfig = {
  host: '127.0.0.1',
  user: 'root',
  password: 'Sharu@2004',
  database: 'workzen_hrms',
  port: 3308
};

async function countEmployees() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    // Total employees
    const [totalRows] = await connection.execute(
      'SELECT COUNT(*) as total FROM employees WHERE status = ?',
      ['active']
    );
    console.log('\n=== EMPLOYEE DATABASE SUMMARY ===');
    console.log(`Total Active Employees: ${totalRows[0].total}`);

    // Employees by role
    const [roleRows] = await connection.execute(`
      SELECT u.role, COUNT(*) as count 
      FROM employees e 
      JOIN users u ON e.user_id = u.id 
      WHERE e.status = 'active'
      GROUP BY u.role 
      ORDER BY u.role
    `);

    console.log('\n=== EMPLOYEES BY ROLE ===');
    roleRows.forEach(row => {
      console.log(`${row.role}: ${row.count}`);
    });

    // List employees with 'employee' role
    const [employeeRows] = await connection.execute(`
      SELECT e.id, e.employee_code, u.full_name, u.email, u.role
      FROM employees e 
      JOIN users u ON e.user_id = u.id 
      WHERE e.status = 'active' AND u.role = 'employee'
      ORDER BY e.id
    `);

    console.log('\n=== EMPLOYEES WITH "employee" ROLE ===');
    console.log(`Count: ${employeeRows.length}`);
    employeeRows.forEach(emp => {
      console.log(`  ${emp.employee_code} - ${emp.full_name} (${emp.email})`);
    });

    // List all employees with their roles
    const [allRows] = await connection.execute(`
      SELECT e.id, e.employee_code, u.full_name, u.email, u.role, e.status
      FROM employees e 
      JOIN users u ON e.user_id = u.id 
      ORDER BY u.role, e.id
    `);

    console.log('\n=== ALL EMPLOYEES (BY ROLE) ===');
    console.log(`Total Count: ${allRows.length}`);
    allRows.forEach(emp => {
      console.log(`  [${emp.role.toUpperCase()}] ${emp.employee_code} - ${emp.full_name} (${emp.status})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

countEmployees();
