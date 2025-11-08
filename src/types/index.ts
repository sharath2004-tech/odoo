export type UserRole = 'admin' | 'hr' | 'employee' | 'payroll';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  department?: string;
  status?: 'active' | 'inactive';
  joinDate?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  joiningDate: string;
  status: 'active' | 'inactive';
  salary?: number;
  avatar?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  status: 'present' | 'absent' | 'leave';
  department: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  basicPay: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'paid' | 'pending';
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  certificateUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  days: number;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  details: string;
  timestamp: string;
}

export interface Permission {
  module: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface Department {
  id: string;
  name: string;
  headId: string;
  employeeCount: number;
}

export interface DashboardMetrics {
  totalEmployees: number;
  totalDepartments: number;
  attendanceRate: number;
  pendingApprovals: number;
  totalPayroll: number;
}
