import fetch from 'node-fetch';

async function testEmployeeAPI() {
  try {
    // First, login to get a token
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@company.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login successful:', loginData.success);
    const token = loginData.token;

    // Now fetch employees
    const employeesResponse = await fetch('http://localhost:5000/api/employees', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const employeesData = await employeesResponse.json();
    console.log('\n=== EMPLOYEE API RESPONSE ===');
    console.log('Success:', employeesData.success);
    console.log('Total employees returned:', employeesData.data.length);
    
    console.log('\n=== EMPLOYEE DATA ===');
    employeesData.data.forEach(emp => {
      console.log(`ID: ${emp.id}, Code: ${emp.employee_code}, Name: ${emp.full_name}, Role: ${emp.role}, Status: ${emp.status}`);
    });

    // Filter employees by role
    const employeeRoleOnly = employeesData.data.filter(emp => emp.role === 'employee');
    console.log('\n=== EMPLOYEES WITH "employee" ROLE ===');
    console.log('Count:', employeeRoleOnly.length);
    employeeRoleOnly.forEach(emp => {
      console.log(`  ${emp.employee_code} - ${emp.full_name} (${emp.email})`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

testEmployeeAPI();
