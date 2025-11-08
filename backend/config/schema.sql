-- WorkZen HRMS Database Schema

-- Create Database
CREATE DATABASE IF NOT EXISTS workzen_hrms;
USE workzen_hrms;

-- Users Table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  login_id VARCHAR(50) UNIQUE,
  profile_picture VARCHAR(255),
  role ENUM('admin', 'hr', 'employee', 'payroll') DEFAULT 'employee',
  department VARCHAR(100),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status),
  INDEX idx_login_id (login_id)
);

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  manager_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  department_id INT,
  position VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  date_of_birth DATE,
  join_date DATE,
  salary DECIMAL(10, 2),
  
  -- Personal Information
  gender ENUM('Male', 'Female', 'Other'),
  marital_status ENUM('Single', 'Married', 'Divorced', 'Widowed'),
  nationality VARCHAR(100),
  
  -- Bank Details
  bank_name VARCHAR(100),
  account_number VARCHAR(50),
  ifsc_code VARCHAR(20),
  
  -- Documents
  pan_number VARCHAR(20),
  uan_number VARCHAR(20),
  
  -- Salary Configuration
  wage_type ENUM('monthly', 'hourly') DEFAULT 'monthly',
  working_days_per_week INT DEFAULT 5,
  break_time_hours DECIMAL(4, 2) DEFAULT 0,
  
  status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_department (department_id)
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status ENUM('present', 'absent', 'leave', 'half_day') DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_employee_date (employee_id, date),
  INDEX idx_date (date),
  INDEX idx_status (status)
);

-- Salary Components Table
CREATE TABLE IF NOT EXISTS salary_components (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  component_name VARCHAR(100) NOT NULL,
  component_type ENUM('earning', 'deduction') NOT NULL,
  computation_type ENUM('fixed', 'percentage') NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  percentage_of VARCHAR(50) DEFAULT 'basic_salary',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_employee (employee_id),
  INDEX idx_type (component_type)
);

-- Payroll Table
CREATE TABLE IF NOT EXISTS payroll (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  basic_salary DECIMAL(10, 2) NOT NULL,
  allowances DECIMAL(10, 2) DEFAULT 0,
  deductions DECIMAL(10, 2) DEFAULT 0,
  provident_fund DECIMAL(10, 2) DEFAULT 0,
  professional_tax DECIMAL(10, 2) DEFAULT 0,
  overtime_hours INT DEFAULT 0,
  overtime_pay DECIMAL(10, 2) DEFAULT 0,
  gross_salary DECIMAL(10, 2) NOT NULL,
  net_salary DECIMAL(10, 2) NOT NULL,
  worked_days INT DEFAULT 0,
  total_days INT DEFAULT 0,
  status ENUM('pending', 'paid') DEFAULT 'pending',
  payment_date DATE,
  processed_by INT,
  locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_employee_month_year (employee_id, month, year),
  INDEX idx_status (status),
  INDEX idx_month_year (month, year)
);

-- Payroll Components (stores breakdown of each payroll entry)
CREATE TABLE IF NOT EXISTS payroll_components (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payroll_id INT NOT NULL,
  component_name VARCHAR(100) NOT NULL,
  component_type ENUM('earning', 'deduction') NOT NULL,
  rate_percentage DECIMAL(5, 2),
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payroll_id) REFERENCES payroll(id) ON DELETE CASCADE,
  INDEX idx_payroll (payroll_id)
);

-- Time Off Balances Table
CREATE TABLE IF NOT EXISTS time_off_balances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  leave_type ENUM('paid', 'sick', 'casual', 'annual', 'unpaid') NOT NULL,
  total_days INT NOT NULL DEFAULT 0,
  used_days INT DEFAULT 0,
  available_days INT DEFAULT 0,
  year INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_employee_type_year (employee_id, leave_type, year),
  INDEX idx_employee (employee_id),
  INDEX idx_year (year)
);

-- Leave Requests Table (modified to work with users directly)
CREATE TABLE IF NOT EXISTS leave_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  leave_type ENUM('sick', 'casual', 'annual', 'unpaid', 'maternity', 'paternity', 'paid') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INT NOT NULL,
  reason TEXT,
  certificate_url VARCHAR(500),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by INT,
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_dates (start_date, end_date),
  INDEX idx_employee (employee_id)
);

-- Activity Logs Table (for system monitoring)
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  user_role VARCHAR(20) NOT NULL,
  action VARCHAR(50) NOT NULL,
  module VARCHAR(50) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_module (module),
  INDEX idx_action (action),
  INDEX idx_created (created_at)
);

-- Note: Sample users will be created by setup-db.js script with properly hashed passwords
