import { motion } from 'framer-motion';
import { Calendar, CheckCircle, DollarSign, Download, Eye, Loader2, Plus, Trash2, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { GlassCard } from '../components/GlassCard';
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

const PayrollPage = () => {
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState('');
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipData | null>(null);

  // Fetch payroll records
  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const params: { month?: number; year?: number; status?: string } = {};
      if (filterMonth) params.month = filterMonth;
      if (filterYear) params.year = filterYear;
      if (filterStatus) params.status = filterStatus;

      const response = await payrollAPI.getAll(params);
      if (response.data.success) {
        setPayrollData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMonth, filterYear, filterStatus]);

  const totalPayroll = payrollData.reduce((sum, record) => sum + (record.gross_salary || record.net_salary), 0);
  const totalNetPayroll = payrollData.reduce((sum, record) => sum + record.net_salary, 0);
  const paidCount = payrollData.filter(p => p.status === 'paid').length;
  const pendingCount = payrollData.filter(p => p.status === 'pending').length;

  // Generate month options for filter
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  // Generate payroll for selected month/year
  const handleGeneratePayroll = async () => {
    if (!window.confirm(`Generate payroll for ${monthNames[filterMonth - 1]} ${filterYear}?\n\nThis will calculate salaries based on:\n- Attendance records\n- Approved leaves\n- Salary components\n- PF (12% of basic)\n- Professional Tax\n\nExisting unlocked records will be regenerated.`)) {
      return;
    }

    try {
      setGenerating(true);
      const response = await payrollAPI.generate(filterMonth, filterYear);
      
      if (response.data.success) {
        alert(`Success! Generated payroll for ${response.data.data.recordsCreated} employees.\n\n${response.data.message}`);
        fetchPayroll(); // Refresh the list
      }
    } catch (error: unknown) {
      console.error('Failed to generate payroll:', error);
      if (error instanceof Error) {
        alert(`Failed to generate payroll: ${error.message}`);
      }
    } finally {
      setGenerating(false);
    }
  };

  // Update status handler (Process payrun - mark as paid)
  const handleUpdateStatus = async (id: number, newStatus: string) => {
    const record = payrollData.find(p => p.id === id);
    if (!record) return;

    const paymentDate = new Date().toISOString().split('T')[0];
    
    if (!window.confirm(`Mark payroll as ${newStatus} for ${record.employee_name}?\n\nAmount: ₹${record.net_salary.toLocaleString()}\nPayment Date: ${paymentDate}`)) {
      return;
    }

    try {
      await payrollAPI.updateStatus(id, newStatus, paymentDate);
      fetchPayroll(); // Refresh to get updated locked status
      alert(`Payroll ${newStatus} successfully!`);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update payroll status');
    }
  };

  // Delete payroll
  const handleDeletePayroll = async (id: number) => {
    const record = payrollData.find(p => p.id === id);
    if (!record) return;

    if (record.locked) {
      alert('Cannot delete locked payroll. Locked payrolls have been processed and paid.');
      return;
    }

    if (!window.confirm(`Delete payroll for ${record.employee_name}?\n\nThis will remove the payroll record and all component breakdowns.`)) {
      return;
    }

    try {
      await payrollAPI.delete(id);
      fetchPayroll();
      alert('Payroll deleted successfully!');
    } catch (error) {
      console.error('Failed to delete payroll:', error);
      alert('Failed to delete payroll');
    }
  };

  // View payslip
  const handleViewPayslip = async (id: number) => {
    try {
      const response = await payrollAPI.getPayslip(id);
      if (response.data.success) {
        setSelectedPayslip(response.data.data);
        setShowPayslipModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch payslip:', error);
      alert('Failed to load payslip');
    }
  };

  // Print payslip
  const handlePrintPayslip = () => {
    if (!selectedPayslip) return;
    
    const newWindow = window.open('', '_blank');
    if (!newWindow) return;

    const totalDeductions = selectedPayslip.payroll.deductions + selectedPayslip.payroll.provident_fund + selectedPayslip.payroll.professional_tax;
    
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
              <div class="info-item"><span class="label">Days Worked:</span><span class="value">${selectedPayslip.payroll.worked_days} / ${selectedPayslip.payroll.total_days}</span></div>
              <div class="info-item"><span class="label">Payment Date:</span><span class="value">${selectedPayslip.payroll.payment_date || 'Pending'}</span></div>
              <div class="info-item"><span class="label">Status:</span><span class="value">${selectedPayslip.payroll.status.toUpperCase()}</span></div>
            </div>
          </div>
          <div class="earnings-deductions">
            <div class="section earnings">
              <h3>EARNINGS</h3>
              ${selectedPayslip.earnings.map(e => `
                <div class="line-item">
                  <span>${e.component_name}${e.rate_percentage ? ' (' + e.rate_percentage + '%)' : ''}</span>
                  <span>₹${e.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              `).join('')}
              <div class="line-item total">
                <span>GROSS EARNINGS</span>
                <span>₹${selectedPayslip.payroll.gross_salary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div class="section deductions">
              <h3>DEDUCTIONS</h3>
              ${selectedPayslip.deductions.map(d => `
                <div class="line-item">
                  <span>${d.component_name}${d.rate_percentage ? ' (' + d.rate_percentage + '%)' : ''}</span>
                  <span>₹${d.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              `).join('')}
              <div class="line-item total">
                <span>TOTAL DEDUCTIONS</span>
                <span>₹${totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
    }, 250);
  };

  if (loading) {
    return (
      <DashboardLayout title="Payroll Management">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading payroll records...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Payroll Management">
      {/* Filters and Generate Button */}
      <GlassCard className="mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <select 
              className="glass-input"
              value={filterMonth}
              onChange={(e) => setFilterMonth(parseInt(e.target.value))}
            >
              {monthNames.map((name, idx) => (
                <option key={idx} value={idx + 1}>{name}</option>
              ))}
            </select>
            <select 
              className="glass-input"
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select 
              className="glass-input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          
          <button
            onClick={handleGeneratePayroll}
            disabled={generating}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-semibold shadow-lg transition-all"
          >
            {generating ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Generating...
              </>
            ) : (
              <>
                <Plus size={18} />
                Generate Payroll
              </>
            )}
          </button>
        </div>
      </GlassCard>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <GlassCard delay={0}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 text-sm">Gross Payroll</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">₹{totalPayroll.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-gray-500 mt-1">Before deductions</p>
            </div>
            <DollarSign className="w-8 h-8 text-cyan-500" />
          </div>
        </GlassCard>

        <GlassCard delay={0.1}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 text-sm">Net Payable</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">₹{totalNetPayroll.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-gray-500 mt-1">After deductions</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </GlassCard>

        <GlassCard delay={0.2}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 text-sm">Paid</p>
              <h3 className="text-2xl font-bold text-green-600 mt-2">{paidCount}</h3>
              <p className="text-xs text-gray-500 mt-1">Completed payruns</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </GlassCard>

        <GlassCard delay={0.3}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 text-sm">Pending</p>
              <h3 className="text-2xl font-bold text-yellow-600 mt-2">{pendingCount}</h3>
              <p className="text-xs text-gray-500 mt-1">Awaiting payment</p>
            </div>
            <Zap className="w-8 h-8 text-yellow-400" />
          </div>
        </GlassCard>
      </div>

      {/* Chart */}
      {payrollData.length > 0 && (
        <GlassCard className="mb-8" delay={0.4}>
          <h3 className="heading-3 mb-6">{monthNames[filterMonth - 1]} {filterYear} Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              {
                name: 'Totals',
                'Gross Salary': payrollData.reduce((sum, r) => sum + (r.gross_salary || r.basic_salary + r.allowances), 0),
                'Basic Salary': payrollData.reduce((sum, r) => sum + r.basic_salary, 0),
                'Allowances': payrollData.reduce((sum, r) => sum + r.allowances, 0),
                'Deductions': payrollData.reduce((sum, r) => sum + r.deductions, 0),
                'PF': payrollData.reduce((sum, r) => sum + (r.provident_fund || 0), 0),
                'Prof. Tax': payrollData.reduce((sum, r) => sum + (r.professional_tax || 0), 0),
              }
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis stroke="rgba(255,255,255,0.5)" dataKey="name" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(6, 182, 212, 0.5)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="Gross Salary" fill="#06b6d4" />
              <Bar dataKey="Basic Salary" fill="#3b82f6" />
              <Bar dataKey="Allowances" fill="#10b981" />
              <Bar dataKey="Deductions" fill="#f59e0b" />
              <Bar dataKey="PF" fill="#ef4444" />
              <Bar dataKey="Prof. Tax" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      )}

      {/* Payroll Table */}
      <GlassCard delay={0.5}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="heading-3">{monthNames[filterMonth - 1]} {filterYear} Payroll</h3>
            <p className="text-sm text-gray-600 mt-1">{payrollData.length} employee{payrollData.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
            <Download size={16} />
            Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-3 py-3 text-left text-gray-700 font-semibold">Employee</th>
                <th className="px-3 py-3 text-center text-gray-700 font-semibold">Attendance</th>
                <th className="px-3 py-3 text-right text-gray-700 font-semibold">Basic</th>
                <th className="px-3 py-3 text-right text-gray-700 font-semibold">Gross</th>
                <th className="px-3 py-3 text-right text-gray-700 font-semibold">PF</th>
                <th className="px-3 py-3 text-right text-gray-700 font-semibold">PT</th>
                <th className="px-3 py-3 text-right text-gray-700 font-semibold">Deductions</th>
                <th className="px-3 py-3 text-right text-gray-700 font-semibold">Net Pay</th>
                <th className="px-3 py-3 text-center text-gray-700 font-semibold">Status</th>
                <th className="px-3 py-3 text-center text-gray-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrollData.length > 0 ? (
                payrollData.map((record, i) => (
                  <motion.tr
                    key={record.id}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td className="px-3 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-semibold">{record.employee_name}</span>
                        <span className="text-xs text-gray-500">{record.employee_code}</span>
                        <span className="text-xs text-gray-400">{record.position}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-gray-900 font-semibold">{record.worked_days}/{record.total_days}</span>
                        <span className="text-xs text-gray-500">days</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-right text-gray-700">
                      ₹{record.basic_salary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-3 py-4 text-right text-cyan-600 font-semibold">
                      ₹{(record.gross_salary || record.basic_salary + record.allowances).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-3 py-4 text-right text-red-600">
                      ₹{(record.provident_fund || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-3 py-4 text-right text-purple-600">
                      ₹{(record.professional_tax || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-3 py-4 text-right text-orange-600">
                      ₹{record.deductions.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-3 py-4 text-right font-bold text-green-600">
                      ₹{record.net_salary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span
                        className={
                          record.status === 'paid' ? 'status-paid' : 'status-pending'
                        }
                      >
                        {record.status}
                      </span>
                      {record.locked && (
                        <span className="block text-xs text-gray-500 mt-1">🔒 Locked</span>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewPayslip(record.id)}
                          className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors"
                          title="View Payslip"
                        >
                          <Eye size={16} />
                        </button>
                        
                        {record.status === 'pending' && !record.locked && (
                          <>
                            <button 
                              onClick={() => handleUpdateStatus(record.id, 'paid')}
                              className="text-green-600 hover:text-green-700 p-1 rounded transition-colors"
                              title="Mark as Paid"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleDeletePayroll(record.id)}
                              className="text-red-600 hover:text-red-700 p-1 rounded transition-colors"
                              title="Delete Payroll"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Calendar className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500">No payroll records found for {monthNames[filterMonth - 1]} {filterYear}</p>
                      <button
                        onClick={handleGeneratePayroll}
                        className="mt-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold"
                      >
                        <Plus size={16} />
                        Generate Payroll for this Month
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
      {/* Payslip Modal */}
      {showPayslipModal && selectedPayslip && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowPayslipModal(false)}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Payslip Header */}
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-8 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold mb-2">PAYSLIP</h2>
                  <p className="text-white/90">
                    {monthNames[selectedPayslip.payroll.month - 1]} {selectedPayslip.payroll.year}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/80">Payslip ID</p>
                  <p className="text-lg font-semibold">#{selectedPayslip.payroll.id}</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Employee Details */}
              <div className="grid grid-cols-2 gap-6 mb-8 pb-6 border-b border-gray-200">
                <div>
                  <h3 className="text-sm text-gray-500 mb-3 uppercase font-semibold">Employee Information</h3>
                  <div className="space-y-2">
                    <div><span className="text-gray-600 text-sm">Name:</span> <span className="font-semibold ml-2">{selectedPayslip.payroll.employee_name}</span></div>
                    <div><span className="text-gray-600 text-sm">Code:</span> <span className="font-semibold ml-2">{selectedPayslip.payroll.employee_code}</span></div>
                    <div><span className="text-gray-600 text-sm">Position:</span> <span className="font-semibold ml-2">{selectedPayslip.payroll.position}</span></div>
                    <div><span className="text-gray-600 text-sm">Department:</span> <span className="font-semibold ml-2">{selectedPayslip.payroll.department}</span></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm text-gray-500 mb-3 uppercase font-semibold">Payment Details</h3>
                  <div className="space-y-2">
                    <div><span className="text-gray-600 text-sm">Pay Period:</span> <span className="font-semibold ml-2">{monthNames[selectedPayslip.payroll.month - 1]} {selectedPayslip.payroll.year}</span></div>
                    <div><span className="text-gray-600 text-sm">Days Worked:</span> <span className="font-semibold ml-2">{selectedPayslip.payroll.worked_days} / {selectedPayslip.payroll.total_days}</span></div>
                    <div><span className="text-gray-600 text-sm">Payment Date:</span> <span className="font-semibold ml-2">{selectedPayslip.payroll.payment_date || 'Pending'}</span></div>
                    <div><span className="text-gray-600 text-sm">Status:</span> <span className={`font-semibold ml-2 ${selectedPayslip.payroll.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{selectedPayslip.payroll.status.toUpperCase()}</span></div>
                  </div>
                </div>
              </div>

              {/* Earnings and Deductions */}
              <div className="grid grid-cols-2 gap-8 mb-6">
                {/* Earnings */}
                <div>
                  <h3 className="text-lg font-bold mb-4 text-gray-800 border-b-2 border-green-500 pb-2">EARNINGS</h3>
                  <div className="space-y-3">
                    {selectedPayslip.earnings.map((earning) => (
                      <div key={earning.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-700">{earning.component_name}</p>
                          {earning.rate_percentage && (
                            <p className="text-xs text-gray-500">({earning.rate_percentage}%)</p>
                          )}
                        </div>
                        <p className="font-semibold text-green-600">
                          ₹{earning.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 border-t-2 border-green-200">
                      <p className="font-bold text-gray-800">GROSS EARNINGS</p>
                      <p className="font-bold text-green-600 text-lg">
                        ₹{selectedPayslip.payroll.gross_salary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <h3 className="text-lg font-bold mb-4 text-gray-800 border-b-2 border-red-500 pb-2">DEDUCTIONS</h3>
                  <div className="space-y-3">
                    {selectedPayslip.deductions.map((deduction) => (
                      <div key={deduction.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-700">{deduction.component_name}</p>
                          {deduction.rate_percentage && (
                            <p className="text-xs text-gray-500">({deduction.rate_percentage}%)</p>
                          )}
                        </div>
                        <p className="font-semibold text-red-600">
                          ₹{deduction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 border-t-2 border-red-200">
                      <p className="font-bold text-gray-800">TOTAL DEDUCTIONS</p>
                      <p className="font-bold text-red-600 text-lg">
                        ₹{(selectedPayslip.payroll.deductions + selectedPayslip.payroll.provident_fund + selectedPayslip.payroll.professional_tax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-xl mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white/80 text-sm mb-1">NET PAYABLE</p>
                    <p className="text-3xl font-bold">
                      ₹{selectedPayslip.payroll.net_salary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/70">Gross - Deductions</p>
                    <p className="text-sm text-white/90">
                      ₹{selectedPayslip.payroll.gross_salary.toLocaleString('en-IN')} - ₹{selectedPayslip.payroll.deductions.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end print:hidden">
                <button
                  onClick={() => setShowPayslipModal(false)}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handlePrintPayslip}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <Download size={16} />
                  Print Payslip
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default PayrollPage;
