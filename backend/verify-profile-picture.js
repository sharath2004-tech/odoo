import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3308,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'workzen_hrms'
};

async function verifyColumn() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database');

    // Get all columns from users table
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `, [config.database]);

    console.log('\n📋 Users table structure:');
    console.log('='.repeat(80));
    columns.forEach(col => {
      console.log(`${col.COLUMN_NAME.padEnd(20)} | ${col.DATA_TYPE.padEnd(15)} | Length: ${(col.CHARACTER_MAXIMUM_LENGTH || 'N/A').toString().padEnd(10)} | Nullable: ${col.IS_NULLABLE}`);
    });
    console.log('='.repeat(80));

    // Check specifically for profile_picture
    const profilePictureCol = columns.find(col => col.COLUMN_NAME === 'profile_picture');
    if (profilePictureCol) {
      console.log('\n✅ profile_picture column found:');
      console.log(`   Type: ${profilePictureCol.DATA_TYPE}`);
      console.log(`   Max Length: ${profilePictureCol.CHARACTER_MAXIMUM_LENGTH}`);
      console.log(`   Nullable: ${profilePictureCol.IS_NULLABLE}`);
    } else {
      console.log('\n❌ profile_picture column not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

// Run the verification
verifyColumn()
  .then(() => {
    console.log('✅ Verification completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
