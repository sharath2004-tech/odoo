import dotenv from 'dotenv';
import { pool } from './config/database.js';

// Load environment variables
dotenv.config();

/**
 * Generate Login ID based on format:
 * First 2 letters of first name + First 2 letters of last name + Year of joining + Serial number
 * Example: JODO20220001 (John Doe, joined 2022, serial 0001)
 */
function generateLoginId(fullName, joiningYear, serialNumber) {
  const names = fullName.trim().split(' ');
  const firstName = names[0] || '';
  const lastName = names[names.length - 1] || '';
  
  const prefix = (firstName.substring(0, 2) + lastName.substring(0, 2)).toUpperCase();
  const year = joiningYear.toString();
  const serial = String(serialNumber).padStart(4, '0');
  
  return `${prefix}${year}${serial}`;
}

async function addLoginIdColumn() {
  try {
    console.log('🔄 Adding login_id column to users table...');
    
    // Check if column exists first
    const [columns] = await pool.query(`
      SHOW COLUMNS FROM users LIKE 'login_id'
    `);
    
    // Add login_id column if it doesn't exist
    if (columns.length === 0) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN login_id VARCHAR(50) UNIQUE
      `);
      console.log('✅ login_id column added successfully');
    } else {
      console.log('✅ login_id column already exists');
    }
    
    // Generate login IDs for existing users
    console.log('🔄 Generating login IDs for existing users...');
    
    const [users] = await pool.query(`
      SELECT u.id, u.full_name, u.created_at, u.login_id
      FROM users u
      WHERE u.login_id IS NULL OR u.login_id = ''
      ORDER BY u.created_at ASC
    `);
    
    if (users.length === 0) {
      console.log('✅ All users already have login IDs');
      return;
    }
    
    console.log(`📋 Found ${users.length} users without login IDs`);
    
    // Group users by year
    const usersByYear = {};
    users.forEach(user => {
      const year = new Date(user.created_at).getFullYear();
      if (!usersByYear[year]) {
        usersByYear[year] = [];
      }
      usersByYear[year].push(user);
    });
    
    // Generate login IDs
    for (const year in usersByYear) {
      const yearUsers = usersByYear[year];
      
      for (let i = 0; i < yearUsers.length; i++) {
        const user = yearUsers[i];
        const serialNumber = i + 1; // Start from 1 for each year
        const loginId = generateLoginId(user.full_name, year, serialNumber);
        
        try {
          await pool.query(
            'UPDATE users SET login_id = ? WHERE id = ?',
            [loginId, user.id]
          );
          console.log(`✅ Generated login ID for ${user.full_name}: ${loginId}`);
        } catch (error) {
          console.error(`❌ Failed to generate login ID for ${user.full_name}:`, error.message);
        }
      }
    }
    
    console.log('✅ All login IDs generated successfully');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addLoginIdColumn();
