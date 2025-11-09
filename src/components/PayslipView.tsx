import { Printer } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface PayslipData {
  payroll: {
    id: number;
    month: number;
    year: number;
    employee_code: string;
    employee_name: string;
    position: string;
    department: string;
    email: string;
    join_date: string;
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
    payment_date: string;
  };
  earnings: Array<{
    component_name: string;
    rate_percentage: number | null;
    amount: number;
  }>;
  deductions: Array<{
    component_name: string;
    rate_percentage: number | null;
    amount: number;
  }>;
}

interface PayslipViewProps {
  payslipData: PayslipData;
}

export const PayslipView = ({ payslipData }: PayslipViewProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add print styles
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        #payslip-print-area, #payslip-print-area * {
          visibility: visible;
        }
        #payslip-print-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [payslipData]);

  const handlePrint = () => {
    window.print();
  };

  const { payroll, earnings, deductions } = payslipData;
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  // Validation check
  if (!payroll) {
    console.error('PayslipView: No payroll data provided!');
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-8 text-center">
        <p className="text-red-700 font-semibold text-lg mb-2">Error Loading Payslip</p>
        <p className="text-red-600">Payroll data is missing. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Print Button */}
      <div className="flex justify-end no-print mb-4">
        <button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Printer size={18} />
          Print Payslip
        </button>
      </div>

      {/* Payslip Content */}
      <div id="payslip-print-area" ref={printRef} className="bg-white border-2 border-gray-300 rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PAYSLIP</h1>
          <p className="text-lg text-gray-600">
            {monthNames[payroll.month - 1]} {payroll.year}
          </p>
        </div>

        {/* Employee Information */}
        <div className="grid grid-cols-2 gap-6 mb-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3">EMPLOYEE DETAILS</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-semibold text-gray-900">{payroll.employee_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Employee Code:</span>
                <span className="font-semibold text-gray-900">{payroll.employee_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Position:</span>
                <span className="font-semibold text-gray-900">{payroll.position || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Department:</span>
                <span className="font-semibold text-gray-900">{payroll.department || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3">PAY PERIOD</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Month/Year:</span>
                <span className="font-semibold text-gray-900">{monthNames[payroll.month - 1]} {payroll.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Working Days:</span>
                <span className="font-semibold text-gray-900">{payroll.total_days}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Days Worked:</span>
                <span className="font-semibold text-gray-900">{payroll.worked_days}</span>
              </div>
              {payroll.payment_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Date:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(payroll.payment_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Earnings and Deductions */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Earnings */}
          <div className="border-2 border-green-200 rounded-lg bg-green-50 p-6">
            <h3 className="text-lg font-bold text-green-700 mb-4 pb-2 border-b-2 border-green-300">
              EARNINGS
            </h3>
            <div className="space-y-3">
              {earnings.map((earning, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <span className="text-gray-700 font-medium">{earning.component_name}</span>
                    {earning.rate_percentage && (
                      <span className="text-xs text-gray-500 ml-2">({earning.rate_percentage}%)</span>
                    )}
                  </div>
                  <span className="font-semibold text-gray-900">
                    ₹{Number(earning.amount).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="pt-3 mt-3 border-t-2 border-green-300">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-green-700">GROSS SALARY</span>
                  <span className="text-lg font-bold text-green-700">
                    ₹{Number(payroll.gross_salary).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="border-2 border-red-200 rounded-lg bg-red-50 p-6">
            <h3 className="text-lg font-bold text-red-700 mb-4 pb-2 border-b-2 border-red-300">
              DEDUCTIONS
            </h3>
            <div className="space-y-3">
              {deductions.map((deduction, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <span className="text-gray-700 font-medium">{deduction.component_name}</span>
                    {deduction.rate_percentage && (
                      <span className="text-xs text-gray-500 ml-2">({deduction.rate_percentage}%)</span>
                    )}
                  </div>
                  <span className="font-semibold text-gray-900">
                    ₹{Number(deduction.amount).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="pt-3 mt-3 border-t-2 border-red-300">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-red-700">TOTAL DEDUCTIONS</span>
                  <span className="text-lg font-bold text-red-700">
                    ₹{Number(payroll.deductions).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Net Salary */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-blue-900">NET SALARY</span>
            <span className="text-3xl font-bold text-blue-900">
              ₹{Number(payroll.net_salary).toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-blue-700 mt-2">
            Amount in words: {convertToWords(Number(payroll.net_salary))} Rupees Only
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-6 border-t border-gray-300">
          <p>This is a computer-generated payslip and does not require a signature.</p>
          <p className="mt-2">For any queries, please contact your HR department.</p>
        </div>
      </div>
    </div>
  );
};

// Helper function to convert number to words
function convertToWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (amount === 0) return 'Zero';

  const num = Math.floor(amount);
  let words = '';

  if (num >= 10000000) {
    words += convertToWords(Math.floor(num / 10000000)) + ' Crore ';
    return words + convertToWords(num % 10000000);
  }

  if (num >= 100000) {
    words += convertToWords(Math.floor(num / 100000)) + ' Lakh ';
    return words + convertToWords(num % 100000);
  }

  if (num >= 1000) {
    words += convertToWords(Math.floor(num / 1000)) + ' Thousand ';
    return words + convertToWords(num % 1000);
  }

  if (num >= 100) {
    words += ones[Math.floor(num / 100)] + ' Hundred ';
    return words + convertToWords(num % 100);
  }

  if (num >= 20) {
    words += tens[Math.floor(num / 10)] + ' ';
    if (num % 10 > 0) {
      words += ones[num % 10];
    }
    return words.trim();
  }

  if (num >= 10) {
    return teens[num - 10];
  }

  return ones[num];
}
