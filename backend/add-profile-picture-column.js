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

async function addProfilePictureColumn() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database');

    // Check if profile_picture column already exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'profile_picture'
    `, [config.database]);

    if (columns.length > 0) {
      console.log('✅ profile_picture column already exists');
      return;
    }

    console.log('🔄 Adding profile_picture column to users table...');
    
    // Add profile_picture column after login_id
    await connection.query(`
      ALTER TABLE users 
      ADD COLUMN profile_picture VARCHAR(255) AFTER login_id
    `);

    console.log('✅ Successfully added profile_picture column');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

// Run the migration
addProfilePictureColumn()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
