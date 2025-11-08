import { motion } from 'framer-motion';
import { Calendar, CheckCircle, DollarSign, Download, Eye, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { payrollAPI } from '../services/api';

interface PayrollRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  department: string;
  position: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  provident_fund: number;
  professional_tax: number;
  gross_salary: number;
  net_salary: number;
  worked_days: number;
  total_days: number;
  status: string;
  payment_date: string | null;
  locked: boolean;
}

interface PayrollComponent {
  id: number;
  component_name: string;
  component_type: 'earning' | 'deduction';
  rate_percentage: number | null;
  amount: number;
}

interface PayslipData {
  payroll: PayrollRecord;
  earnings: PayrollComponent[];
  deductions: PayrollComponent[];
}

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipData | null>(null);
  const [activeTab, setActiveTab] = useState<'worked-days' | 'salary-computation'>('salary-computation');

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    fetchMyPayroll();
  }, []);

  const fetchMyPayroll = async () => {
    try {
      setLoading(true);
      // Fetch only paid payroll records for the current user using dedicated endpoint
      const response = await payrollAPI.getMyPayroll({ status: 'paid' });
      if (response.data.success) {
        setPayrollRecords(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayslip = async (payrollId: number) => {
    try {
      const response = await payrollAPI.getPayslip(payrollId);
      if (response.data.success) {
        setSelectedPayslip(response.data.data);
        setShowPayslipModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch payslip:', error);
      alert('Failed to load payslip details');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="My Payroll">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Payroll">
      {/* Payslip Modal */}
      {showPayslipModal && selectedPayslip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8"
          >
            {/* Header */}
            <div className="border-b border-gray-200 px-8 py-6 flex justify-between items-center bg-gradient-to-r from-cyan-500 to-blue-500">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  {selectedPayslip.payroll.employee_name}
                </h3>
                <p className="text-white/90 mt-1">
                  Payrun {monthNames[selectedPayslip.payroll.month - 1]} {selectedPayslip.payroll.year}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPayslipModal(false);
                  setSelectedPayslip(null);
                }}
                className="text-white hover:text-white/80 transition-colors"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-8 pt-6 flex gap-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('worked-days')}
                className={`pb-3 px-4 font-semibold transition-all ${
                  activeTab === 'worked-days'
                    ? 'text-cyan-600 border-b-2 border-cyan-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Worked Days
              </button>
              <button
                onClick={() => setActiveTab('salary-computation')}
                className={`pb-3 px-4 font-semibold transition-all ${
                  activeTab === 'salary-computation'
                    ? 'text-cyan-600 border-b-2 border-cyan-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Salary Computation
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {activeTab === 'worked-days' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h4 className="text-gray-900 font-semibold mb-4 text-lg">Attendance Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600 text-sm">Total Working Days</p>
                        <p className="text-gray-900 text-2xl font-bold mt-1">
                          {selectedPayslip.payroll.total_days.toFixed(2)} days
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Days Worked</p>
                        <p className="text-green-600 text-2xl font-bold mt-1">
                          {selectedPayslip.payroll.worked_days.toFixed(2)} days
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h4 className="text-gray-900 font-semibold mb-4">Period</h4>
                    <p className="text-gray-700">
                      {new Date(selectedPayslip.payroll.year, selectedPayslip.payroll.month - 1, 1).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })} - {new Date(selectedPayslip.payroll.year, selectedPayslip.payroll.month, 0).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                    <p className="text-gray-700 text-sm mb-2 font-semibold">Salary Calculation Note</p>
                    <p className="text-gray-600">
                      Salary is calculated based on the employee's monthly attendance. Paid leaves are
                      included in the total payable days, while unpaid leaves are deducted from the salary.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'salary-computation' && (
                <div className="space-y-6">
                  {/* Salary Structure */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h4 className="text-gray-900 font-semibold mb-4 text-lg">Salary Structure</h4>
                    <p className="text-gray-600 text-sm mb-4">Regular Pay</p>

                    {/* Earnings */}
                    <div className="space-y-3 mb-6">
                      {selectedPayslip.earnings.map((earning) => (
                        <div key={earning.id} className="flex justify-between items-center">
                          <div>
                            <p className="text-gray-900 font-medium">{earning.component_name}</p>
                            {earning.rate_percentage && (
                              <p className="text-gray-500 text-xs">{earning.rate_percentage}%</p>
                            )}
                          </div>
                          <p className="text-green-600 font-semibold text-lg">
                            ₹ {earning.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Gross Salary */}
                    <div className="pt-4 border-t border-gray-200 mb-6">
                      <div className="flex justify-between items-center">
                        <p className="text-gray-900 font-bold text-lg">Gross</p>
                        <p className="text-gray-900 font-bold text-2xl">
                          ₹ {selectedPayslip.payroll.gross_salary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div className="space-y-3">
                      {selectedPayslip.deductions.map((deduction) => (
                        <div key={deduction.id} className="flex justify-between items-center">
                          <div>
                            <p className="text-gray-900 font-medium">{deduction.component_name}</p>
                            {deduction.rate_percentage && (
                              <p className="text-gray-500 text-xs">{deduction.rate_percentage}%</p>
                            )}
                          </div>
                          <p className="text-red-600 font-semibold text-lg">
                            - ₹ {deduction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Net Amount */}
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white/90 text-sm mb-1">Net Amount</p>
                        <p className="text-white/80 text-xs">Gross - Deductions</p>
                      </div>
                      <p className="text-white font-bold text-3xl">
                        ₹ {selectedPayslip.payroll.net_salary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="px-8 py-6 bg-gray-50 rounded-b-2xl flex justify-between items-center border-t border-gray-200 print:hidden">
              <p className="text-gray-600 text-sm">
                "Paid" status show once any pay run or payslip has been validated
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    const newWindow = window.open('', '_blank');
                    if (newWindow) {
                      newWindow.document.write(`
                        <html>
                          <head>
                            <title>Payslip - ${selectedPayslip.payroll.employee_name}</title>
                            <style>
                              body { font-family: Arial, sans-serif; padding: 20px; }
                              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #06b6d4; padding-bottom: 20px; }
                              .header h1 { color: #06b6d4; margin: 0; }
                              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                              .info-section h3 { font-size: 14px; color: #666; text-transform: uppercase; margin-bottom: 10px; }
                              .info-item { margin-bottom: 8px; }
                              .label { color: #666; font-size: 14px; }
                              .value { font-weight: bold; margin-left: 10px; }
                              .attendance-summary { border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                              .attendance-summary h3 { margin-top: 0; color: #06b6d4; }
                              .attendance-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px; }
                              .attendance-item { text-align: center; }
                              .attendance-value { font-size: 24px; font-weight: bold; color: #10b981; }
                              .earnings-deductions { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 30px 0; }
                              .section { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
                              .section h3 { margin-top: 0; border-bottom: 2px solid; padding-bottom: 10px; }
                              .earnings h3 { color: #10b981; border-color: #10b981; }
                              .deductions h3 { color: #ef4444; border-color: #ef4444; }
                              .line-item { display: flex; justify-content: space-between; margin-bottom: 10px; }
                              .line-item.total { border-top: 2px solid #ddd; padding-top: 10px; margin-top: 10px; font-weight: bold; }
                              .net-pay { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 20px; border-radius: 10px; margin-top: 20px; }
                              .net-pay .amount { font-size: 32px; font-weight: bold; margin-top: 10px; }
                              @media print { body { padding: 0; } }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              <h1>PAYSLIP</h1>
                              <p>${monthNames[selectedPayslip.payroll.month - 1]} ${selectedPayslip.payroll.year}</p>
                              <p>Payslip ID: #${selectedPayslip.payroll.id}</p>
                            </div>
                            <div class="info-grid">
                              <div class="info-section">
                                <h3>Employee Information</h3>
                                <div class="info-item"><span class="label">Name:</span><span class="value">${selectedPayslip.payroll.employee_name}</span></div>
                                <div class="info-item"><span class="label">Code:</span><span class="value">${selectedPayslip.payroll.employee_code}</span></div>
                                <div class="info-item"><span class="label">Position:</span><span class="value">${selectedPayslip.payroll.position}</span></div>
                                <div class="info-item"><span class="label">Department:</span><span class="value">${selectedPayslip.payroll.department}</span></div>
                              </div>
                              <div class="info-section">
                                <h3>Payment Details</h3>
                                <div class="info-item"><span class="label">Pay Period:</span><span class="value">${monthNames[selectedPayslip.payroll.month - 1]} ${selectedPayslip.payroll.year}</span></div>
                                <div class="info-item"><span class="label">Payment Date:</span><span class="value">${selectedPayslip.payroll.payment_date || 'Pending'}</span></div>
                                <div class="info-item"><span class="label">Status:</span><span class="value">${selectedPayslip.payroll.status.toUpperCase()}</span></div>
                              </div>
                            </div>
                            <div class="attendance-summary">
                              <h3>ATTENDANCE SUMMARY</h3>
                              <div class="attendance-grid">
                                <div class="attendance-item">
                                  <div class="label">Total Days</div>
                                  <div class="attendance-value">${selectedPayslip.payroll.total_days}</div>
                                </div>
                                <div class="attendance-item">
                                  <div class="label">Days Worked</div>
                                  <div class="attendance-value">${selectedPayslip.payroll.worked_days}</div>
                                </div>
                                <div class="attendance-item">
                                  <div class="label">Absent Days</div>
                                  <div class="attendance-value" style="color: #ef4444;">${selectedPayslip.payroll.total_days - selectedPayslip.payroll.worked_days}</div>
                                </div>
                              </div>
                            </div>
                            <div class="earnings-deductions">
                              <div class="section earnings">
                                <h3>EARNINGS</h3>
                                <div class="line-item">
                                  <span>Basic Salary</span>
                                  <span>₹${selectedPayslip.payroll.basic_salary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div class="line-item total">
                                  <span>GROSS EARNINGS</span>
                                  <span>₹${selectedPayslip.payroll.gross_salary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                              </div>
                              <div class="section deductions">
                                <h3>DEDUCTIONS</h3>
                                <div class="line-item total">
                                  <span>TOTAL DEDUCTIONS</span>
                                  <span>₹${selectedPayslip.payroll.deductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                              </div>
                            </div>
                            <div class="net-pay">
                              <div>NET PAYABLE</div>
                              <div class="amount">₹${selectedPayslip.payroll.net_salary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                              <div style="margin-top: 10px; font-size: 14px; opacity: 0.9;">Gross - Deductions</div>
                            </div>
                          </body>
                        </html>
                      `);
                      newWindow.document.close();
                      setTimeout(() => {
                        newWindow.print();
                        newWindow.close();
                      }, 250);
                    }
                  }}
                  className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Download size={18} />
                  Print
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Stats Cards */}
      {payrollRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GlassCard delay={0}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm">Total Paid</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  ₹{payrollRecords.reduce((sum, record) => sum + record.net_salary, 0).toLocaleString('en-IN')}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Lifetime earnings</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </GlassCard>

          <GlassCard delay={0.1}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm">Payslips</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{payrollRecords.length}</h3>
                <p className="text-xs text-gray-500 mt-1">Completed payments</p>
              </div>
              <CheckCircle className="w-8 h-8 text-cyan-500" />
            </div>
          </GlassCard>

          <GlassCard delay={0.2}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm">Latest Payment</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {payrollRecords[0] ? monthNames[payrollRecords[0].month - 1].substring(0, 3) : 'N/A'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{payrollRecords[0]?.year || ''}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </GlassCard>
        </div>
      )}

      {/* Payroll History */}
      <GlassCard delay={0.3}>
        <h3 className="text-xl font-bold text-gray-900 mb-6">My Payslips</h3>

        {payrollRecords.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium mb-2">No Payslips Available</p>
            <p className="text-gray-500 text-sm">Your payslips will appear here once the payroll officer processes and marks them as paid.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Period</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Gross Salary</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Deductions</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Net Pay</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Payment Date</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrollRecords.map((record, index) => (
                  <motion.tr
                    key={record.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {monthNames[record.month - 1]} {record.year}
                        </p>
                        <p className="text-xs text-gray-500">
                          {record.worked_days.toFixed(0)}/{record.total_days.toFixed(0)} days
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-gray-900">
                        ₹{record.gross_salary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-red-600">
                        ₹{record.deductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-green-600 text-lg">
                        ₹{record.net_salary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-gray-700">
                        {record.payment_date ? new Date(record.payment_date).toLocaleDateString('en-IN') : 'N/A'}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleViewPayslip(record.id)}
                        className="p-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                        title="View Payslip"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
