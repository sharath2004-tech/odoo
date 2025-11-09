import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login if 401 AND not on auth endpoints (login/register)
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    
    if (error.response?.status === 401 && !isAuthEndpoint) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API endpoints
export const authAPI = {
  login: (identifier: string, password: string, role: string) => 
    api.post('/auth/login', { identifier, password, role }),
  
  register: (fullName: string, email: string, password: string, role: string) => 
    api.post('/auth/register', { fullName, email, password, role }),
};

export const employeeAPI = {
  getAll: () => api.get('/employees'),
  getById: (id: number) => api.get(`/employees/${id}`),
  create: (data: any) => api.post('/employees', data),
  update: (id: number, data: any) => api.put(`/employees/${id}`, data),
  delete: (id: number) => api.delete(`/employees/${id}`),
};

export const attendanceAPI = {
  getAll: (params?: any) => api.get('/attendance', { params }),
  mark: (data: any) => api.post('/attendance', data),
  getSummary: (month: number, year: number) => 
    api.get('/attendance/summary', { params: { month, year } }),
};

export const payrollAPI = {
  getAll: (params?: any) => api.get('/payroll', { params }),
  getMyPayroll: (params?: any) => api.get('/payroll/my-payroll', { params }),
  getById: (id: number) => api.get(`/payroll/${id}`),
  generate: (month: number, year: number) => 
    api.post('/payroll/generate', { month, year }),
  updateStatus: (id: number, status: string, paymentDate?: string) => 
    api.put(`/payroll/${id}/status`, { status, paymentDate }),
  delete: (id: number) => api.delete(`/payroll/${id}`),
  getPayslip: (id: number) => api.get(`/payroll/payslip/${id}`),
  getEmployeeHistory: (employeeId: number) => api.get(`/payroll/employee/${employeeId}`),
};

export const dashboardAPI = {
  getMetrics: () => api.get('/dashboard/metrics'),
  getActivities: () => api.get('/dashboard/activities'),
};

export const salaryComponentAPI = {
  getByEmployee: (userId: number) => api.get(`/salary-components/${userId}`),
  create: (data: any) => api.post('/salary-components', data),
  update: (id: number, data: any) => api.put(`/salary-components/${id}`, data),
  delete: (id: number) => api.delete(`/salary-components/${id}`),
  calculate: (data: any) => api.post('/salary-components/calculate', data),
  updateSalaryInfo: (userId: number, data: any) => 
    api.put(`/salary-components/salary-info/${userId}`, data),
};
