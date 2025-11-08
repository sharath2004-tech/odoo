# WorkZen HRMS Backend API

Node.js + Express + MySQL backend for WorkZen HRMS application.

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Database
1. Install MySQL Server if not already installed
2. Create a new database:
```sql
CREATE DATABASE workzen_hrms;
```

3. Import the schema:
```bash
mysql -u root -p workzen_hrms < config/schema.sql
```

### 3. Environment Variables
1. Copy `.env.example` to `.env`
```bash
cp .env.example .env
```

2. Update the `.env` file with your database credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=workzen_hrms
JWT_SECRET=your_secret_key
```

### 4. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create new employee (Admin/HR only)
- `PUT /api/employees/:id` - Update employee (Admin/HR only)
- `DELETE /api/employees/:id` - Delete employee (Admin only)

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance
- `GET /api/attendance/summary` - Get attendance summary

### Payroll
- `GET /api/payroll` - Get payroll records
- `POST /api/payroll/generate` - Generate payroll (Admin/HR only)
- `PUT /api/payroll/:id/status` - Update payroll status (Admin/HR only)

### Dashboard
- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/dashboard/activities` - Get recent activities

## Database Schema

The database includes the following tables:
- `users` - User authentication and roles
- `departments` - Company departments
- `employees` - Employee information
- `attendance` - Daily attendance records
- `payroll` - Monthly payroll records
- `leave_requests` - Leave applications

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Role-Based Access Control

- **Admin**: Full access to all endpoints
- **HR**: Access to employee, attendance, and payroll management
- **Employee**: Access to own records only

## Error Handling

All endpoints return JSON responses with the following structure:

Success:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Error:
```json
{
  "success": false,
  "message": "Error description"
}
```
