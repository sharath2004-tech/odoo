import { pool } from './config/database.js';

async function addColumns() {
  try {
    const alterStatements = [
      `ALTER TABLE payroll ADD COLUMN gross_salary DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER overtime_pay`,
      `ALTER TABLE payroll ADD COLUMN worked_days DECIMAL(10,2) DEFAULT 0 AFTER net_salary`,
      `ALTER TABLE payroll ADD COLUMN total_days DECIMAL(10,2) DEFAULT 0 AFTER worked_days`
    ];

    for (const statement of alterStatements) {
      try {
        await pool.query(statement);
      } catch (innerError) {
        // Ignore duplicate column errors
        if (innerError.code !== 'ER_DUP_FIELDNAME') {
          throw innerError;
        }
      }
    }

    console.log('✅ Payroll columns ensured');
  } catch (error) {
    console.error('Alter error:', error.message);
  } finally {
    process.exit(0);
  }
}

addColumns();
