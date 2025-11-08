import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function setupEmployees() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3308,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'workzen_hrms'
    });

    console.log('📦 Connected to database: workzen_hrms');

    // Create departments first
    console.log('\n📁 Creating departments...');
    const departments = [
      ['Engineering', 'Technology and Development', null],
      ['Human Resources', 'People Operations', null],
      ['Finance', 'Financial Operations', null],
      ['Sales', 'Sales and Marketing', null]
    ];

    for (const dept of departments) {
      try {
        const [existing] = await connection.query('SELECT id FROM departments WHERE name = ?', [dept[0]]);
        if (existing.length === 0) {
          await connection.query(
            'INSERT INTO departments (name, description, manager_id) VALUES (?, ?, ?)',
            dept
          );
          console.log(`✅ Created department: ${dept[0]}`);
        } else {
          console.log(`ℹ️  Department already exists: ${dept[0]}`);
        }
      } catch (error) {
        console.log(`⚠️  Could not create department ${dept[0]}: ${error.message}`);
      }
    }

    // Get department IDs
    const [depts] = await connection.query('SELECT id, name FROM departments');
    const deptMap = {};
    depts.forEach(d => { deptMap[d.name] = d.id; });

    // Get user IDs
    const [users] = await connection.query('SELECT id, email, full_name FROM users');
    console.log(`\n👥 Found ${users.length} users`);

    // Create employee records for each user
    console.log('\n👨‍💼 Creating employee records...');
    
    const employeeData = [
      {
        email: 'admin@company.com',
        employee_code: 'EMP001',
        department: 'Engineering',
        position: 'System Administrator',
        phone: '+91-9876543210',
        address: '123 Admin Street, Tech City',
        date_of_birth: '1990-01-15',
        join_date: '2020-01-01',
        salary: 75000,
        gender: 'Male',
        marital_status: 'Married',
        nationality: 'Indian',
        bank_name: 'HDFC Bank',
        account_number: '12345678901234',
        ifsc_code: 'HDFC0001234',
        pan_number: 'ABCDE1234F',
        uan_number: '123456789012',
        wage_type: 'monthly',
        working_days_per_week: 5,
        break_time_hours: 1
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
        salary: 60000,
        gender: 'Female',
        marital_status: 'Single',
        nationality: 'Indian',
        bank_name: 'ICICI Bank',
        account_number: '98765432109876',
        ifsc_code: 'ICIC0005678',
        pan_number: 'FGHIJ5678K',
        uan_number: '987654321098',
        wage_type: 'monthly',
        working_days_per_week: 5,
        break_time_hours: 1
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
        salary: 55000,
        gender: 'Male',
        marital_status: 'Married',
        nationality: 'Indian',
        bank_name: 'SBI',
        account_number: '11223344556677',
        ifsc_code: 'SBIN0001234',
        pan_number: 'KLMNO9012P',
        uan_number: '112233445566',
        wage_type: 'monthly',
        working_days_per_week: 5,
        break_time_hours: 1
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
        salary: 45000,
        gender: 'Female',
        marital_status: 'Single',
        nationality: 'Indian',
        bank_name: 'Axis Bank',
        account_number: '55667788990011',
        ifsc_code: 'UTIB0001234',
        pan_number: 'PQRST3456U',
        uan_number: '556677889900',
        wage_type: 'monthly',
        working_days_per_week: 5,
        break_time_hours: 1
      }
    ];

    for (const empData of employeeData) {
      try {
        const user = users.find(u => u.email === empData.email);
        if (!user) {
          console.log(`⚠️  User not found for email: ${empData.email}`);
          continue;
        }

        const [existing] = await connection.query('SELECT id FROM employees WHERE user_id = ?', [user.id]);
        
        if (existing.length === 0) {
          await connection.query(`
            INSERT INTO employees (
              user_id, employee_code, department_id, position, phone, address,
              date_of_birth, join_date, salary, gender, marital_status, nationality,
              bank_name, account_number, ifsc_code, pan_number, uan_number,
              wage_type, working_days_per_week, break_time_hours, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
          `, [
            user.id,
            empData.employee_code,
            deptMap[empData.department],
            empData.position,
            empData.phone,
            empData.address,
            empData.date_of_birth,
            empData.join_date,
            empData.salary,
            empData.gender,
            empData.marital_status,
            empData.nationality,
            empData.bank_name,
            empData.account_number,
            empData.ifsc_code,
            empData.pan_number,
            empData.uan_number,
            empData.wage_type,
            empData.working_days_per_week,
            empData.break_time_hours
          ]);
          console.log(`✅ Created employee: ${user.full_name} (${empData.employee_code}) - Salary: ₹${empData.salary}`);
        } else {
          // Update existing employee with salary
          await connection.query(`
            UPDATE employees SET
              salary = ?,
              department_id = ?,
              position = ?,
              phone = ?,
              wage_type = ?,
              working_days_per_week = ?,
              break_time_hours = ?,
              status = 'active'
            WHERE user_id = ?
          `, [
            empData.salary,
            deptMap[empData.department],
            empData.position,
            empData.phone,
            empData.wage_type,
            empData.working_days_per_week,
            empData.break_time_hours,
            user.id
          ]);
          console.log(`✅ Updated employee: ${user.full_name} - Salary: ₹${empData.salary}`);
        }

        // Create default salary components for each employee
        const [employee] = await connection.query('SELECT id FROM employees WHERE user_id = ?', [user.id]);
        const employeeId = employee[0].id;

        // Check if components exist
        const [existingComponents] = await connection.query(
          'SELECT id FROM salary_components WHERE employee_id = ?',
          [employeeId]
        );

        if (existingComponents.length === 0) {
          // Create default components
          const components = [
            ['Basic Salary', 'earning', 'percentage', 50, 'wage'],
            ['HRA', 'earning', 'percentage', 50, 'basic_salary'],
            ['Provident Fund (PF)', 'deduction', 'percentage', 12, 'basic_salary']
          ];

          for (const comp of components) {
            await connection.query(`
              INSERT INTO salary_components 
              (employee_id, component_name, component_type, computation_type, value, percentage_of, is_active)
              VALUES (?, ?, ?, ?, ?, ?, TRUE)
            `, [employeeId, ...comp]);
          }
          console.log(`   ➕ Added default salary components`);
        }

      } catch (error) {
        console.log(`⚠️  Error creating employee for ${empData.email}: ${error.message}`);
      }
    }

    // Create sample attendance for November 2025
    console.log('\n📅 Creating sample attendance for November 2025...');
    const [employees] = await connection.query('SELECT id, employee_code FROM employees WHERE status = "active"');
    
    // Generate attendance for first 7 days of November 2025
    const attendanceDates = ['2025-11-03', '2025-11-04', '2025-11-05', '2025-11-06', '2025-11-07'];
    
    for (const emp of employees) {
      for (const date of attendanceDates) {
        try {
          const [existing] = await connection.query(
            'SELECT id FROM attendance WHERE employee_id = ? AND date = ?',
            [emp.id, date]
          );
          
          if (existing.length === 0) {
            await connection.query(`
              INSERT INTO attendance (employee_id, date, check_in, check_out, status)
              VALUES (?, ?, '09:00:00', '18:00:00', 'present')
            `, [emp.id, date]);
          }
        } catch (error) {
          // Skip duplicate entries
        }
      }
      console.log(`✅ Created attendance for ${emp.employee_code} (5 days)`);
    }

    // Create sample approved leave
    console.log('\n🏖️ Creating sample approved leaves...');
    const [firstEmployee] = await connection.query(
      'SELECT e.id as emp_id, u.id as user_id FROM employees e JOIN users u ON e.user_id = u.id LIMIT 1'
    );
    
    if (firstEmployee.length > 0) {
      try {
        const [existingLeave] = await connection.query(
          'SELECT id FROM leave_requests WHERE employee_id = ? AND start_date = ?',
          [firstEmployee[0].user_id, '2025-11-10']
        );
        
        if (existingLeave.length === 0) {
          await connection.query(`
            INSERT INTO leave_requests 
            (employee_id, leave_type, start_date, end_date, days, reason, status, approved_by, approved_at)
            VALUES (?, 'paid', '2025-11-10', '2025-11-12', 3, 'Personal leave', 'approved', 1, NOW())
          `, [firstEmployee[0].user_id]);
          console.log(`✅ Created sample approved leave (3 paid days)`);
        }
      } catch (error) {
        console.log(`ℹ️  Leave request already exists`);
      }
    }

    // Summary
    console.log('\n📊 Database Summary:');
    const [empCount] = await connection.query('SELECT COUNT(*) as count FROM employees WHERE status = "active"');
    const [attCount] = await connection.query('SELECT COUNT(*) as count FROM attendance');
    const [compCount] = await connection.query('SELECT COUNT(*) as count FROM salary_components WHERE is_active = TRUE');
    const [leaveCount] = await connection.query('SELECT COUNT(*) as count FROM leave_requests WHERE status = "approved"');
    
    console.log(`   - Active Employees: ${empCount[0].count}`);
    console.log(`   - Attendance Records: ${attCount[0].count}`);
    console.log(`   - Active Salary Components: ${compCount[0].count}`);
    console.log(`   - Approved Leaves: ${leaveCount[0].count}`);

    console.log('\n✅ Employee setup completed successfully!');
    console.log('\nYou can now:');
    console.log('1. Login as admin@company.com or payroll@company.com (password: admin123)');
    console.log('2. Navigate to Payroll Management page');
    console.log('3. Click "Generate Payroll" for November 2025');
    console.log('4. View generated payroll with salary breakdowns');

  } catch (error) {
    console.error('❌ Employee setup failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

setupEmployees();
