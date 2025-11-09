import { pool } from './config/database.js';

async function addPersonalInfoColumns() {
  try {
    console.log('🔧 Starting database migration: Adding personal information columns...');

    // Check if columns already exist
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'workzen_hrms' 
      AND TABLE_NAME = 'employees'
      AND COLUMN_NAME IN ('gender', 'marital_status', 'nationality', 'bank_name', 'account_number', 'ifsc_code', 'pan_number', 'uan_number')
    `);

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('📋 Existing columns:', existingColumns);

    // Add gender column if not exists
    if (!existingColumns.includes('gender')) {
      console.log('➕ Adding gender column...');
      await pool.query(`
        ALTER TABLE employees 
        ADD COLUMN gender ENUM('Male', 'Female', 'Other') AFTER date_of_birth
      `);
      console.log('✅ gender column added');
    } else {
      console.log('⏭️  gender column already exists');
    }

    // Add marital_status column if not exists
    if (!existingColumns.includes('marital_status')) {
      console.log('➕ Adding marital_status column...');
      await pool.query(`
        ALTER TABLE employees 
        ADD COLUMN marital_status ENUM('Single', 'Married', 'Divorced', 'Widowed') AFTER gender
      `);
      console.log('✅ marital_status column added');
    } else {
      console.log('⏭️  marital_status column already exists');
    }

    // Add nationality column if not exists
    if (!existingColumns.includes('nationality')) {
      console.log('➕ Adding nationality column...');
      await pool.query(`
        ALTER TABLE employees 
        ADD COLUMN nationality VARCHAR(100) AFTER marital_status
      `);
      console.log('✅ nationality column added');
    } else {
      console.log('⏭️  nationality column already exists');
    }

    // Add bank_name column if not exists
    if (!existingColumns.includes('bank_name')) {
      console.log('➕ Adding bank_name column...');
      await pool.query(`
        ALTER TABLE employees 
        ADD COLUMN bank_name VARCHAR(100) AFTER nationality
      `);
      console.log('✅ bank_name column added');
    } else {
      console.log('⏭️  bank_name column already exists');
    }

    // Add account_number column if not exists
    if (!existingColumns.includes('account_number')) {
      console.log('➕ Adding account_number column...');
      await pool.query(`
        ALTER TABLE employees 
        ADD COLUMN account_number VARCHAR(50) AFTER bank_name
      `);
      console.log('✅ account_number column added');
    } else {
      console.log('⏭️  account_number column already exists');
    }

    // Add ifsc_code column if not exists
    if (!existingColumns.includes('ifsc_code')) {
      console.log('➕ Adding ifsc_code column...');
      await pool.query(`
        ALTER TABLE employees 
        ADD COLUMN ifsc_code VARCHAR(20) AFTER account_number
      `);
      console.log('✅ ifsc_code column added');
    } else {
      console.log('⏭️  ifsc_code column already exists');
    }

    // Add pan_number column if not exists
    if (!existingColumns.includes('pan_number')) {
      console.log('➕ Adding pan_number column...');
      await pool.query(`
        ALTER TABLE employees 
        ADD COLUMN pan_number VARCHAR(20) AFTER ifsc_code
      `);
      console.log('✅ pan_number column added');
    } else {
      console.log('⏭️  pan_number column already exists');
    }

    // Add uan_number column if not exists
    if (!existingColumns.includes('uan_number')) {
      console.log('➕ Adding uan_number column...');
      await pool.query(`
        ALTER TABLE employees 
        ADD COLUMN uan_number VARCHAR(20) AFTER pan_number
      `);
      console.log('✅ uan_number column added');
    } else {
      console.log('⏭️  uan_number column already exists');
    }

    // Verify all columns were added
    const [finalColumns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'workzen_hrms' 
      AND TABLE_NAME = 'employees'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('\n📊 Final employees table structure:');
    finalColumns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}`);
    });

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

addPersonalInfoColumns();
