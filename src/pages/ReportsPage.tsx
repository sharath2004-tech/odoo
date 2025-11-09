import { Printer, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface Employee {
  id: string;
  fullName: string;
  designation: string;
  dateOfJoining: string;
}

interface SalaryComponent {
  name: string;
  type: 'earning' | 'deduction';
  amount: number;
}

interface SalaryReport {
  employeeName: string;
  designation: string;
  dateOfJoining: string;
  salaryEffectiveFrom: string;
  earnings: SalaryComponent[];
  deductions: SalaryComponent[];
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
}

const ReportsPage = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [salaryReport, setSalaryReport] = useState<SalaryReport | null>(null);
  const [loading, setLoading] = useState(false);
  
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const isAdmin = user?.role === 'admin';
  const canViewAllReports = ['admin', 'hr', 'payroll'].includes(user?.role || '');
  const canGenerateReports = ['admin', 'payroll'].includes(user?.role || '');

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    // Filter employees based on search term
    if (searchTerm.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(emp =>
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.designation.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/employees', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        // Map the employee data to match expected interface
        const mappedEmployees = data.data.map((emp: any) => ({
          id: emp.id.toString(),
          fullName: emp.full_name,
          designation: emp.position || 'N/A',
          dateOfJoining: emp.join_date,
        }));

        // If employee role, only show their own record
        if (user?.role === 'employee') {
          // Get the employee record for the logged-in user by matching user ID through a separate call
          const userResponse = await fetch(`http://localhost:5000/api/users/${user.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const userData = await userResponse.json();
          
          if (userData.success) {
            // Find employee record that matches this user
            const currentUserEmployees = mappedEmployees.filter((emp: any) => 
              emp.fullName === userData.data.fullName || emp.fullName === user.fullName
            );
            
            setEmployees(currentUserEmployees);
            setFilteredEmployees(currentUserEmployees);
            if (currentUserEmployees.length > 0) {
              setSelectedEmployee(currentUserEmployees[0].id);
            }
          }
        } else {
          // Admin, HR, Payroll can see all employees
          setEmployees(mappedEmployees);
          setFilteredEmployees(mappedEmployees);
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchSalaryReport = async () => {
    // Check access permissions
    if (!canGenerateReports) {
      alert('Access Denied: Only Admin and Payroll Officers can generate salary reports.');
      return;
    }

    if (!selectedEmployee) {
      alert('Please select an employee');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch employee details
      const employeeResponse = await fetch(
        `http://localhost:5000/api/employees/${selectedEmployee}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const employeeData = await employeeResponse.json();
      
      if (!employeeData.success) {
        throw new Error('Failed to fetch employee data');
      }

      const emp = employeeData.data;

      // Fetch actual payroll data for the selected month and year
      const payrollResponse = await fetch(
        `http://localhost:5000/api/payroll?employeeId=${selectedEmployee}&month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const payrollData = await payrollResponse.json();

      if (payrollData.success && payrollData.data.length > 0) {
        // Get the payroll record for the selected month/year
        const latestPayroll = payrollData.data[0];

        // Fetch payroll components breakdown
        const componentsResponse = await fetch(
          `http://localhost:5000/api/payroll/${latestPayroll.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const componentsData = await componentsResponse.json();

        const earnings: SalaryComponent[] = [];
        const deductions: SalaryComponent[] = [];

        if (componentsData.success && componentsData.data.components) {
          componentsData.data.components.forEach((comp: any) => {
            if (comp.component_type === 'earning') {
              earnings.push({
                name: comp.component_name,
                type: 'earning',
                amount: parseFloat(comp.amount) || 0,
              });
            } else {
              deductions.push({
                name: comp.component_name,
                type: 'deduction',
                amount: parseFloat(comp.amount) || 0,
              });
            }
          });
        }

        // Use actual payroll data
        setSalaryReport({
          employeeName: emp.full_name || emp.fullName,
          designation: emp.position || emp.designation,
          dateOfJoining: emp.join_date || emp.dateOfJoining,
          salaryEffectiveFrom: latestPayroll.created_at || emp.join_date || emp.dateOfJoining,
          earnings,
          deductions,
          grossSalary: parseFloat(latestPayroll.gross_salary) || 0,
          totalDeductions: parseFloat(latestPayroll.deductions) + parseFloat(latestPayroll.provident_fund) + parseFloat(latestPayroll.professional_tax) || 0,
          netSalary: parseFloat(latestPayroll.net_salary) || 0,
        });
      } else {
        // No payroll generated yet, show message
        const monthName = months.find(m => m.value === selectedMonth)?.label || selectedMonth;
        alert(`No payroll data found for ${emp.full_name || emp.fullName} for ${monthName} ${selectedYear}. Please generate payroll first.`);
        setSalaryReport(null);
      }
    } catch (error) {
      console.error('Error fetching salary report:', error);
      alert('Failed to fetch salary report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = () => {
    fetchSalaryReport();
  };

  const handlePrint = () => {
    if (!salaryReport) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const monthName = months.find(m => m.value === selectedMonth)?.label || '';

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Salary Statement - ${monthName} ${selectedYear}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #1a1a1a;
              margin-bottom: 5px;
            }
            .report-title {
              font-size: 18px;
              color: #e53e3e;
              font-weight: 600;
              margin-top: 10px;
            }
            .employee-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 30px;
              background: #f9f9f9;
              padding: 20px;
              border: 1px solid #ddd;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
            }
            .info-label {
              font-weight: 600;
              color: #555;
            }
            .info-value {
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background: #1a1a1a;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: 600;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #e0e0e0;
            }
            .section-title {
              background: #5a67d8;
              color: white;
              padding: 8px 12px;
              font-weight: 600;
              margin-top: 20px;
            }
            .earnings-section {
              margin-bottom: 20px;
            }
            .deduction-section {
              margin-bottom: 20px;
            }
            .deduction-title {
              color: #e53e3e;
              font-weight: 600;
            }
            .total-row {
              background: #f5f5f5;
              font-weight: bold;
              border-top: 2px solid #333;
            }
            .net-salary {
              background: #1a1a1a;
              color: white;
              font-size: 16px;
              font-weight: bold;
              border: none;
            }
            .amount-col {
              text-align: right;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">WorkZen HRMS</div>
            <div class="report-title">Salary Statement - ${monthName} ${selectedYear}</div>
          </div>
          
          <div class="employee-info">
            <div class="info-item">
              <span class="info-label">Employee Name</span>
              <span class="info-value">${salaryReport.employeeName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date Of Joining</span>
              <span class="info-value">${new Date(salaryReport.dateOfJoining).toLocaleDateString()}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Designation</span>
              <span class="info-value">${salaryReport.designation}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Salary Effective From</span>
              <span class="info-value">${new Date(salaryReport.salaryEffectiveFrom).toLocaleDateString()}</span>
            </div>
          </div>

          <div class="earnings-section">
            <div class="section-title">Salary Components</div>
            <table>
              <thead>
                <tr>
                  <th>Components</th>
                  <th class="amount-col">Monthly Amount</th>
                  <th class="amount-col">Yearly Amount</th>
                </tr>
              </thead>
              <tbody>
                ${salaryReport.earnings.map(earning => `
                  <tr>
                    <td>${earning.name}</td>
                    <td class="amount-col">[₹ ${earning.amount.toLocaleString()}]</td>
                    <td class="amount-col">[₹ ${(earning.amount * 12).toLocaleString()}]</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="deduction-section">
            <div class="section-title deduction-title">Deduction</div>
            <table>
              <tbody>
                ${salaryReport.deductions.map(deduction => `
                  <tr>
                    <td>${deduction.name}</td>
                    <td class="amount-col">[₹ ${deduction.amount.toLocaleString()}]</td>
                    <td class="amount-col">[₹ ${(deduction.amount * 12).toLocaleString()}]</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <table>
            <tbody>
              <tr class="total-row">
                <td>Net Salary</td>
                <td class="amount-col">[₹ ${salaryReport.netSalary.toLocaleString()}]</td>
                <td class="amount-col">[₹ ${(salaryReport.netSalary * 12).toLocaleString()}]</td>
              </tr>
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              }
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
          <p className="text-gray-600">
            {canGenerateReports 
              ? 'Search and generate comprehensive salary reports for all employees'
              : canViewAllReports
              ? 'Search employees - Report generation is restricted to Admin and Payroll Officers'
              : 'View and download your personal salary statement'
            }
          </p>
        </div>

        {/* Search Section - Only for Admin/HR/Payroll */}
        {canViewAllReports && (
          <div className="mb-6 bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <div className="relative">
              <Search className="absolute left-4 top-4 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by employee name or designation..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-2 focus:ring-gray-200 transition-all"
              />
            </div>
            {filteredEmployees.length === 0 && searchTerm && (
              <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg">
                <p className="text-gray-700">No employees found matching "{searchTerm}"</p>
              </div>
            )}
            {filteredEmployees.length > 0 && searchTerm && (
              <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg">
                <p className="text-gray-700">
                  Found {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Report Generation Form */}
        <div className="bg-white rounded-lg shadow-md border-2 border-gray-900 overflow-hidden">
          <div className="bg-gray-900 px-6 py-4 border-b-2 border-gray-900">
            <h2 className="text-xl font-bold text-white">Generate Salary Report</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Employee Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">
                  Select Employee
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-900 rounded-lg bg-white text-gray-900 font-medium focus:border-gray-900 focus:ring-2 focus:ring-gray-200 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={!canViewAllReports}
                >
                  <option value="">Select Employee</option>
                  {filteredEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} - {emp.designation}
                    </option>
                  ))}
                </select>
                {!canViewAllReports && (
                  <p className="text-sm text-gray-600 mt-2">
                    Your employee record is automatically selected
                  </p>
                )}
              </div>

              {/* Month Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">
                  Select Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-900 rounded-lg bg-white text-gray-900 font-medium focus:border-gray-900 focus:ring-2 focus:ring-gray-200 transition-all"
                >
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">
                  Select Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-900 rounded-lg bg-white text-gray-900 font-medium focus:border-gray-900 focus:ring-2 focus:ring-gray-200 transition-all"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Access Restriction Message for HR */}
            {!canGenerateReports && canViewAllReports && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm font-medium">
                  ⚠️ Access Restricted: Only Admin and Payroll Officers can generate salary reports.
                </p>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={generateReport}
              disabled={!selectedEmployee || loading || !canGenerateReports}
              className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating Report...
                </span>
              ) : !canGenerateReports ? (
                <span className="flex items-center justify-center gap-2">
                  🔒 Access Restricted - Admin & Payroll Only
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Printer className="w-5 h-5" />
                  Generate Salary Statement
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Salary Report Display */}
        {salaryReport && (
          <div className="mt-8 bg-white rounded-lg shadow-md border-2 border-gray-900 overflow-hidden">
            {/* Header with Print Button */}
            <div className="bg-gray-900 px-6 py-4 border-b-2 border-gray-900">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Salary Statement - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                  </h2>
                </div>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-all"
                >
                  <Printer size={20} />
                  Print Report
                </button>
              </div>
            </div>

            <div id="printable-report" className="p-8">
              {/* Employee Details */}
              <div className="mb-8 border-2 border-gray-900 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-900 pb-2 uppercase">
                  Employee Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-b border-gray-300 pb-3">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Full Name</p>
                    <p className="text-base font-bold text-gray-900">{salaryReport.employeeName}</p>
                  </div>
                  <div className="border-b border-gray-300 pb-3">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Designation</p>
                    <p className="text-base font-bold text-gray-900">{salaryReport.designation}</p>
                  </div>
                  <div className="border-b border-gray-300 pb-3">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Date of Joining</p>
                    <p className="text-base font-bold text-gray-900">
                      {new Date(salaryReport.dateOfJoining).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="border-b border-gray-300 pb-3">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Salary Effective From</p>
                    <p className="text-base font-bold text-gray-900">
                      {new Date(salaryReport.salaryEffectiveFrom).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Earnings Section */}
              <div className="mb-6 border-2 border-gray-900 rounded-lg overflow-hidden">
                <div className="bg-gray-900 px-6 py-3 border-b-2 border-gray-900">
                  <h3 className="text-lg font-bold text-white uppercase">Earnings</h3>
                </div>
                <div className="divide-y-2 divide-gray-900">
                  {salaryReport.earnings.map((earning, index) => (
                    <div key={index} className="flex justify-between px-6 py-3 bg-white">
                      <span className="font-semibold text-gray-800">{earning.name}</span>
                      <span className="font-bold text-gray-900">₹{earning.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between px-6 py-4 bg-gray-100 font-bold text-lg">
                    <span className="text-gray-900">GROSS SALARY</span>
                    <span className="text-gray-900">₹{salaryReport.grossSalary.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Section */}
              <div className="mb-6 border-2 border-gray-900 rounded-lg overflow-hidden">
                <div className="bg-gray-900 px-6 py-3 border-b-2 border-gray-900">
                  <h3 className="text-lg font-bold text-white uppercase">Deductions</h3>
                </div>
                <div className="divide-y-2 divide-gray-900">
                  {salaryReport.deductions.map((deduction, index) => (
                    <div key={index} className="flex justify-between px-6 py-3 bg-white">
                      <span className="font-semibold text-gray-800">{deduction.name}</span>
                      <span className="font-bold text-gray-900">₹{deduction.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between px-6 py-4 bg-gray-100 font-bold text-lg">
                    <span className="text-gray-900">TOTAL DEDUCTIONS</span>
                    <span className="text-gray-900">₹{salaryReport.totalDeductions.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary Section */}
              <div className="bg-gray-900 rounded-lg p-6 border-4 border-gray-900">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-white uppercase">Net Salary</span>
                  <span className="text-3xl font-bold text-white">₹{salaryReport.netSalary.toFixed(2)}</span>
                </div>
              </div>

              {/* Report Footer */}
              <div className="mt-6 pt-4 border-t-2 border-gray-300 text-center">
                <p className="text-gray-600 text-sm">
                  This is a system-generated report. No signature required.
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Generated on {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
