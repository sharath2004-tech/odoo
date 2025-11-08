
import { Save } from 'lucide-react';

import { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';

interface SalaryInfo {

  monthlyWage: number;

  workingDaysPerWeek: number;

  breakTimeHours: number;

}

interface Props {

  employeeId: number;

  employeeName: string;

}

export const SalaryInfoTab = ({ employeeId, employeeName }: Props) => {

  const { user } = useAuth();

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [editMode, setEditMode] = useState(false);

  const [salaryInfo, setSalaryInfo] = useState<SalaryInfo>({

    monthlyWage: 50000,

    workingDaysPerWeek: 5,

    breakTimeHours: 1,

  });

  // Only Admin and Payroll can see this tab

  const canView = user?.role === 'admin' || user?.role === 'payroll';

  const canEdit = user?.role === 'admin' || user?.role === 'payroll';

  useEffect(() => {

    // Fetch salary data from backend

    fetchSalaryData();

  }, [employeeId]);

  const fetchSalaryData = async () => {

    try {

      setLoading(true);

      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:5000/api/employees/${employeeId}`, {

        headers: {

          Authorization: `Bearer ${token}`,

        },

      });

      const data = await response.json();

      if (data.success && data.data) {

        setSalaryInfo({

          monthlyWage: data.data.salary || 50000,

          workingDaysPerWeek: data.data.working_days_per_week || 5,

          breakTimeHours: data.data.break_time_hours || 1,

        });

      }

    } catch (error) {

      console.error('Error fetching salary data:', error);

    } finally {

      setLoading(false);

    }

  };

  const handleSave = async () => {

    try {

      setSaving(true);

      const token = localStorage.getItem('token');

      await fetch(`http://localhost:5000/api/employees/${employeeId}`, {

        method: 'PUT',

        headers: {

          'Content-Type': 'application/json',

          Authorization: `Bearer ${token}`,

        },

        body: JSON.stringify({

          salary: salaryInfo.monthlyWage,

          working_days_per_week: salaryInfo.workingDaysPerWeek,

          break_time_hours: salaryInfo.breakTimeHours,

        }),

      });

      alert('Salary information updated successfully!');

      setEditMode(false);

    } catch (error) {

      console.error('Error updating salary info:', error);

      alert('Failed to update salary information');

    } finally {

      setSaving(false);

    }

  };

  if (!canView) {

    return (

      <div className="text-center py-12">

        <p className="text-gray-400 text-lg">Salary information is only visible to Admin and Payroll Officer.</p>

      </div>

    );

  }

  if (loading) {

    return (

      <div className="text-center py-12">

        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>

        <p className="text-gray-400 mt-4">Loading salary information...</p>

      </div>

    );

  }

  // Calculate all components based on monthly wage

  const yearlyWage = salaryInfo.monthlyWage * 12;

  const basicSalary = salaryInfo.monthlyWage * 0.5; // 50% of monthly wage

  const hra = basicSalary * 0.5; // 50% of basic salary

  const standardAllowance = basicSalary * 0.0833; // 8.33% of basic salary

  const performanceBonus = basicSalary * 0.1667; // 16.67% of basic salary

  const lta = basicSalary * 0.0833; // 8.33% of basic salary

  const fixedAllowance = basicSalary * 0.1167; // 11.67% of basic salary

  // Deductions

  const employeePF = basicSalary * 0.12; // 12% of basic salary

  const employerPF = basicSalary * 0.12; // 12% of basic salary

  const professionalTax = 200; // Fixed ₹200

  // Totals

  const grossSalary = basicSalary + hra + standardAllowance + performanceBonus + lta + fixedAllowance;

  const totalDeductions = employeePF + professionalTax;

  const netSalary = grossSalary - totalDeductions;

  return (

    <div className="space-y-6">

      {/* Employee Name Header */}

      <div className="bg-black border-2 border-gray-700 rounded-lg p-6 text-white">

        <h2 className="text-2xl font-bold">{employeeName}</h2>

        <p className="text-gray-400">Salary Information</p>

      </div>

      {/* Month Wage & Yearly Wage */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-black border-2 border-gray-700 rounded-lg p-6">

          <p className="text-sm text-gray-400 mb-2">Month Wage</p>

          {editMode ? (

            <input

              type="number"

              value={salaryInfo.monthlyWage}

              onChange={(e) => setSalaryInfo({ ...salaryInfo, monthlyWage: parseFloat(e.target.value) || 0 })}

              className="w-full text-3xl font-bold text-white bg-black border-b-2 border-gray-600 focus:border-blue-500 outline-none"

            />

          ) : (

            <p className="text-3xl font-bold text-white">₹ {salaryInfo.monthlyWage.toLocaleString()}</p>

          )}

          <p className="text-sm text-gray-500 mt-1">/ Month</p>

        </div>

        <div className="bg-black border-2 border-gray-700 rounded-lg p-6">

          <p className="text-sm text-gray-400 mb-2">Yearly Wage</p>

          <p className="text-3xl font-bold text-white">₹ {yearlyWage.toLocaleString()}</p>

          <p className="text-sm text-gray-500 mt-1">/ Yearly</p>

        </div>

      </div>

      {/* Edit/Save Button */}

      {canEdit && (

        <div className="flex justify-end">

          {editMode ? (

            <div className="flex gap-3">

              <button

                onClick={() => setEditMode(false)}

                className="px-6 py-2 border-2 border-gray-600 rounded-lg text-white hover:bg-gray-800"

              >

                Cancel

              </button>

              <button

                onClick={handleSave}

                disabled={saving}

                className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 flex items-center gap-2"

              >

                <Save className="w-4 h-4" />

                {saving ? 'Saving...' : 'Save Changes'}

              </button>

            </div>

          ) : (

            <button

              onClick={() => setEditMode(true)}

              className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200"

            >

              Edit Salary Info

            </button>

          )}

        </div>

      )}

      {/* Salary Components */}

      <div className="bg-black border-2 border-gray-700 rounded-lg overflow-hidden">

        <div className="bg-gray-900 text-white px-6 py-4 border-b border-gray-700">

          <h3 className="text-xl font-bold">Salary Components</h3>

        </div>

        <div className="p-6 space-y-4">

          {/* Basic Salary */}

          <div className="flex items-center justify-between pb-4 border-b border-gray-700">

            <div className="flex-1">

              <p className="font-semibold text-white text-lg">Basic Salary</p>

              <p className="text-sm text-gray-400">Define Basic salary from company cost, computed based on monthly wages</p>

            </div>

            <div className="text-right">

              <p className="text-2xl font-bold text-white">₹ {basicSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>

              <p className="text-sm text-gray-500">/ month</p>

              <p className="text-sm font-medium text-blue-400">50.00%</p>

            </div>

          </div>

          {/* HRA */}

          <div className="flex items-center justify-between pb-4 border-b border-gray-700">

            <div className="flex-1">

              <p className="font-semibold text-white text-lg">House Rent Allowance</p>

              <p className="text-sm text-gray-400">HRA provided to employees, 50% of the basic salary</p>

            </div>

            <div className="text-right">

              <p className="text-2xl font-bold text-white">₹ {hra.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>

              <p className="text-sm text-gray-500">/ month</p>

              <p className="text-sm font-medium text-blue-400">50.00%</p>

            </div>

          </div>

          {/* Standard Allowance */}

          <div className="flex items-center justify-between pb-4 border-b border-gray-700">

            <div className="flex-1">

              <p className="font-semibold text-white text-lg">Standard Allowance</p>

              <p className="text-sm text-gray-400">A standard allowance is a predetermined, fixed amount provided to employee as part of their salary</p>

            </div>

            <div className="text-right">

              <p className="text-2xl font-bold text-white">₹ {standardAllowance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>

              <p className="text-sm text-gray-500">/ month</p>

              <p className="text-sm font-medium text-blue-400">8.33%</p>

            </div>

          </div>

          {/* Performance Bonus */}

          <div className="flex items-center justify-between pb-4 border-b border-gray-700">

            <div className="flex-1">

              <p className="font-semibold text-white text-lg">Performance Bonus</p>

              <p className="text-sm text-gray-400">Variable amount paid during payroll. The value defined by the company and calculated as a % of the basic salary</p>

            </div>

            <div className="text-right">

              <p className="text-2xl font-bold text-white">₹ {performanceBonus.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>

              <p className="text-sm text-gray-500">/ month</p>

              <p className="text-sm font-medium text-blue-400">16.67%</p>

            </div>

          </div>

          {/* LTA */}

          <div className="flex items-center justify-between pb-4 border-b border-gray-700">

            <div className="flex-1">

              <p className="font-semibold text-white text-lg">Leave Travel Allowance</p>

              <p className="text-sm text-gray-400">LTA is paid by the company to employees to cover their travel expenses, calculated as a % of the basic salary</p>

            </div>

            <div className="text-right">

              <p className="text-2xl font-bold text-white">₹ {lta.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>

              <p className="text-sm text-gray-500">/ month</p>

              <p className="text-sm font-medium text-blue-400">8.33%</p>

            </div>

          </div>

          {/* Fixed Allowance */}

          <div className="flex items-center justify-between pb-4 border-b border-gray-700">

            <div className="flex-1">

              <p className="font-semibold text-white text-lg">Fixed Allowance</p>

              <p className="text-sm text-gray-400">Fixed allowance portion of wages is determined after calculating all salary components</p>

            </div>

            <div className="text-right">

              <p className="text-2xl font-bold text-white">₹ {fixedAllowance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>

              <p className="text-sm text-gray-500">/ month</p>

              <p className="text-sm font-medium text-blue-400">11.67%</p>

            </div>

          </div>

          {/* Gross Salary Total */}

          <div className="flex items-center justify-between pt-4 bg-gray-900 px-4 py-3 rounded-lg border border-gray-700">

            <p className="text-xl font-bold text-white">Gross Salary</p>

            <p className="text-3xl font-bold text-green-400">₹ {grossSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>

          </div>

        </div>

      </div>

      {/* Working Days & Break Time */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-black border-2 border-gray-700 rounded-lg p-6">

          <p className="text-sm text-gray-400 mb-2">No of working days in a week</p>

          {editMode ? (

            <input

              type="number"

              min="1"

              max="7"

              value={salaryInfo.workingDaysPerWeek}

              onChange={(e) => setSalaryInfo({ ...salaryInfo, workingDaysPerWeek: parseInt(e.target.value) || 5 })}

              className="w-full text-2xl font-bold text-white bg-black border-b-2 border-gray-600 focus:border-blue-500 outline-none"

            />

          ) : (

            <p className="text-2xl font-bold text-white">{salaryInfo.workingDaysPerWeek} days</p>

          )}

        </div>

        <div className="bg-black border-2 border-gray-700 rounded-lg p-6">

          <p className="text-sm text-gray-400 mb-2">Break Time</p>

          {editMode ? (

            <input

              type="number"

              step="0.5"

              min="0"

              value={salaryInfo.breakTimeHours}

              onChange={(e) => setSalaryInfo({ ...salaryInfo, breakTimeHours: parseFloat(e.target.value) || 0 })}

              className="w-full text-2xl font-bold text-white bg-black border-b-2 border-gray-600 focus:border-blue-500 outline-none"

            />

          ) : (

            <p className="text-2xl font-bold text-white">{salaryInfo.breakTimeHours} hrs</p>

          )}

        </div>

      </div>

      {/* Deductions Section */}

      <div className="bg-black border-2 border-gray-700 rounded-lg overflow-hidden">

        <div className="bg-gray-900 text-white px-6 py-4 border-b border-gray-700">

          <h3 className="text-xl font-bold">Deductions</h3>

        </div>

        <div className="p-6 space-y-4">

          {/* PF Contribution */}

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">

            <p className="font-bold text-white text-lg mb-3">Provident Fund (PF) Contribution</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="flex items-center justify-between pb-3 border-b border-gray-700">

                <div>

                  <p className="font-semibold text-white">Employee</p>

                  <p className="text-sm text-gray-400">PF is calculated based on the basic salary</p>

                </div>

                <div className="text-right">

                  <p className="text-xl font-bold text-red-400">₹ {employeePF.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>

                  <p className="text-sm text-gray-500">/ month</p>

                  <p className="text-sm font-medium text-blue-400">12.00%</p>

                </div>

              </div>

              <div className="flex items-center justify-between pb-3 border-b border-gray-700">

                <div>

                  <p className="font-semibold text-white">Employer</p>

                  <p className="text-sm text-gray-400">PF is calculated based on the basic salary</p>

                </div>

                <div className="text-right">

                  <p className="text-xl font-bold text-white">₹ {employerPF.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>

                  <p className="text-sm text-gray-500">/ month</p>

                  <p className="text-sm font-medium text-blue-400">12.00%</p>

                </div>

              </div>

            </div>

          </div>

          {/* Tax Deductions */}

          <div>

            <p className="font-bold text-white text-lg mb-3">Tax Deductions</p>

            <div className="flex items-center justify-between pb-4 border-b border-gray-700">

              <div className="flex-1">

                <p className="font-semibold text-white">Professional Tax</p>

                <p className="text-sm text-gray-400">Professional Tax deducted from the Gross salary</p>

              </div>

              <div className="text-right">

                <p className="text-2xl font-bold text-red-400">₹ {professionalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>

                <p className="text-sm text-gray-500">/ month</p>

              </div>

            </div>

          </div>

          {/* Total Deductions */}

          <div className="flex items-center justify-between pt-4 bg-gray-900 px-4 py-3 rounded-lg border border-gray-700">

            <p className="text-xl font-bold text-white">Total Deductions</p>

            <p className="text-3xl font-bold text-red-400">₹ {totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>

          </div>

        </div>

      </div>

      {/* Net Salary */}

      <div className="bg-black border-2 border-green-500 rounded-lg p-8 text-white">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-lg text-gray-300">Net Payable Salary</p>

            <p className="text-sm text-gray-400">Gross Salary - Total Deductions</p>

          </div>

          <p className="text-4xl font-bold text-green-400">₹ {netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>

        </div>

      </div>

    </div>

  );

};
 
