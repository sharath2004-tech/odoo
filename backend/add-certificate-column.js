import { pool } from './config/database.js';

async function addCertificateColumn() {
  try {
    console.log('Adding certificate_url column to leave_requests table...');
    
    // Check if column already exists
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'workzen_hrms' 
      AND TABLE_NAME = 'leave_requests' 
      AND COLUMN_NAME = 'certificate_url'
    `);
    
    if (columns.length > 0) {
      console.log('✅ Column certificate_url already exists');
    } else {
      // Add the column
      await pool.query(`
        ALTER TABLE leave_requests 
        ADD COLUMN certificate_url VARCHAR(500) AFTER reason
      `);
      console.log('✅ Column certificate_url added successfully');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding column:', error);
    process.exit(1);
  }
}

addCertificateColumn();
