const API_BASE = 'http://localhost:5000/api';

async function main() {
  try {
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'payroll@company.com', password: 'admin123' })
    });

    const loginData = await loginRes.json();
    console.log('Login response:', loginData);

    if (!loginRes.ok) {
      throw new Error('Login failed');
    }

    const token = loginData?.data?.token;
    if (!token) {
      throw new Error('No token in login response');
    }

    const generateRes = await fetch(`${API_BASE}/payroll/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ month: 11, year: 2025 })
    });

    const generateData = await generateRes.json();
    console.log('Generate response status:', generateRes.status);
    console.log('Generate response:', JSON.stringify(generateData, null, 2));
  } catch (error) {
    console.error('Test generate error:', error);
  }
}

main();
