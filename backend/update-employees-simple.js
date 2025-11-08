import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function updateEmployees() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3308,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'workzen_hrms'
    });

    console.log('📦 Connected to database');

    // Check current employees table structure
    const [columns] = await connection.query('DESCRIBE employees');
    console.log('\n📋 Current employees table columns:');
    columns.forEach(col => console.log(`   - ${col.Field} (${col.Type})`));

    const columnNames = columns.map(c => c.Field);

    // Get all users
    const [users] = await connection.query('SELECT id, email, full_name FROM users');
    console.log(`\n👥 Found ${users.length} users`);

    // Get departments
    const [depts] = await connection.query('SELECT id, name FROM departments');
    const deptMap = {};
    depts.forEach(d => { deptMap[d.name] = d.id; });

    // Simple employee data that works with existing columns
    const simpleEmployeeData = [
      {
        email: 'admin@company.com',
        employee_code: 'EMP001',
        department: 'Engineering',
        position: 'System Administrator',
        phone: '+91-9876543210',
        address: '123 Admin Street, Tech City',
        date_of_birth: '1990-01-15',
        join_date: '2020-01-01',
        salary: 75000
      },
      {
        email: 'hr@company.com',
        employee_code: 'EMP002',
        department: 'Human Resources',
        position: 'HR Manager',
        phone: '+91-9876543211',
        address: '456 HR Avenue, Business Park',
        date_of_birth: '1988-05-20',
        join_date: '2019-06-15',
        salary: 60000
      },
      {
        email: 'payroll@company.com',
        employee_code: 'EMP003',
        department: 'Finance',
        position: 'Payroll Officer',
        phone: '+91-9876543212',
        address: '789 Finance Plaza, Downtown',
        date_of_birth: '1992-08-10',
        join_date: '2021-03-01',
        salary: 55000
      },
      {
        email: 'employee@company.com',
        employee_code: 'EMP004',
        department: 'Sales',
        position: 'Sales Executive',
        phone: '+91-9876543213',
        address: '321 Sales Street, Market Area',
        date_of_birth: '1995-12-25',
        join_date: '2022-01-15',
        salary: 45000
      }
    ];

    console.log('\n👨‍💼 Updating employee records with salaries...');

    for (const empData of simpleEmployeeData) {
      try {
        const user = users.find(u => u.email === empData.email);
        if (!user) {
          console.log(`⚠️  User not found: ${empData.email}`);
          continue;
        }

        const [existing] = await connection.query('SELECT id FROM employees WHERE user_id = ?', [user.id]);
        
        if (existing.length > 0) {
          // Update existing
          await connection.query(`
            UPDATE employees SET
              employee_code = ?,
              department_id = ?,
              position = ?,
              phone = ?,
              address = ?,
              date_of_birth = ?,
              join_date = ?,
              salary = ?,
              status = 'active'
            WHERE user_id = ?
          `, [
            empData.employee_code,
            deptMap[empData.department],
            empData.position,
            empData.phone,
            empData.address,
            empData.date_of_birth,
            empData.join_date,
            empData.salary,
            user.id
          ]);
          console.log(`✅ Updated: ${user.full_name} - Salary: ₹${empData.salary}`);
        } else {
          // Create new
          await connection.query(`
            INSERT INTO employees (
              user_id, employee_code, department_id, position, phone, address,
              date_of_birth, join_date, salary, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
          `, [
            user.id,
            empData.employee_code,
            deptMap[empData.department],
            empData.position,
            empData.phone,
            empData.address,
            empData.date_of_birth,
            empData.join_date,
            empData.salary
          ]);
          console.log(`✅ Created: ${user.full_name} - Salary: ₹${empData.salary}`);
        }

        // Create salary components
        const [employee] = await connection.query('SELECT id FROM employees WHERE user_id = ?', [user.id]);
        const employeeId = employee[0].id;

        // Delete existing components
        await connection.query('DELETE FROM salary_components WHERE employee_id = ?', [employeeId]);

        // Create components
        const components = [
          ['Basic Salary', 'earning', 'percentage', 50, 'wage'],
          ['HRA', 'earning', 'percentage', 50, 'basic_salary']
        ];

        for (const comp of components) {
          await connection.query(`
            INSERT INTO salary_components 
            (employee_id, component_name, component_type, computation_type, value, percentage_of, is_active)
            VALUES (?, ?, ?, ?, ?, ?, TRUE)
          `, [employeeId, ...comp]);
        }
        console.log(`   ➕ Added salary components`);

      } catch (error) {
        console.log(`⚠️  Error for ${empData.email}: ${error.message}`);
      }
    }

    // Verify
    console.log('\n📊 Final Summary:');
    const [empList] = await connection.query(`
      SELECT e.employee_code, u.full_name, e.position, e.salary, e.status
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.status = 'active'
    `);
    
    console.log(`\n✅ Active Employees (${empList.length}):`);
    empList.forEach(emp => {
      console.log(`   ${emp.employee_code}: ${emp.full_name} - ${emp.position} - ₹${emp.salary}/month`);
    });

    const [compCount] = await connection.query('SELECT COUNT(*) as count FROM salary_components WHERE is_active = TRUE');
    console.log(`\n✅ Active Salary Components: ${compCount[0].count}`);

    console.log('\n🎉 Setup complete! Now you can generate payroll for November 2025.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

updateEmployees();
