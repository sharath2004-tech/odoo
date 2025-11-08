/**
 * Script to add login_id column to users table
 * Run this once to update the database schema
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'workzen_hrms',
  port: 3308,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function addLoginIdColumn() {
  try {
    console.log('🔄 Adding login_id column to users table...');

    // Add login_id column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN login_id VARCHAR(20) UNIQUE 
      AFTER email
    `);

    console.log('✅ login_id column added successfully!');

    // Generate Login IDs for existing users
    const [users] = await pool.query('SELECT id, full_name, created_at FROM users WHERE login_id IS NULL');
    
    console.log(`\n🔄 Generating Login IDs for ${users.length} existing users...`);

    for (const user of users) {
      const joiningYear = new Date(user.created_at).getFullYear();
      const loginId = await generateLoginId(user.full_name, joiningYear, user.id);
      
      await pool.query('UPDATE users SET login_id = ? WHERE id = ?', [loginId, user.id]);
      console.log(`✅ Generated Login ID for ${user.full_name}: ${loginId}`);
    }

    console.log('\n✅ All Login IDs generated successfully!');
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  login_id column already exists!');
      process.exit(0);
    } else {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

async function generateLoginId(fullName, joiningYear, userId) {
  // Extract first 2 letters of first and last name
  const names = fullName.trim().split(' ');
  const firstName = (names[0] || 'XX').substring(0, 2).toUpperCase();
  const lastName = (names[names.length - 1] || 'XX').substring(0, 2).toUpperCase();
  
  // Get count of users for this year (excluding current user if updating)
  const [result] = await pool.query(
    'SELECT COUNT(*) as count FROM users WHERE YEAR(created_at) = ? AND id != ?',
    [joiningYear, userId]
  );
  const serialNum = String(result[0].count + 1).padStart(4, '0');
  
  // Format: OIJODO20220001
  return `OI${firstName}${lastName}${joiningYear}${serialNum}`;
}

// Run the script
addLoginIdColumn();
