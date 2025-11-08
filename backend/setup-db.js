import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import mysql from 'mysql2/promise';

dotenv.config();

async function setupDatabase() {
  let connection;
  try {
    // Connect to MySQL server (without database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('📦 Connected to MySQL server');

    // Create database if not exists
    await connection.query('CREATE DATABASE IF NOT EXISTS workzen_hrms');
    console.log('✅ Database created/verified: workzen_hrms');

    // Switch to the database
    await connection.query('USE workzen_hrms');
    console.log('✅ Using database: workzen_hrms');

    // Read the SQL schema file
    const schema = fs.readFileSync('./config/schema.sql', 'utf8');
    
    // Remove comments and split into statements
    const statements = schema
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('CREATE DATABASE') && !s.startsWith('USE'));

    // Execute each statement
    let successCount = 0;
    for (const statement of statements) {
      try {
        await connection.query(statement);
        const preview = statement.substring(0, 60).replace(/\n/g, ' ');
        console.log(`✅ Executed: ${preview}...`);
        successCount++;
      } catch (error) {
        const preview = statement.substring(0, 60).replace(/\n/g, ' ');
        console.log(`⚠️  Error: ${preview}...`);
        console.log(`   ${error.message}`);
      }
    }

    console.log(`\n🎉 Database setup completed!`);
    console.log(`✅ Executed ${successCount} statements successfully`);
    
    // Verify tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`\n📊 Tables in database (${tables.length}):`);
    tables.forEach(row => {
      console.log(`   - ${Object.values(row)[0]}`);
    });
    
    // Create sample users with properly hashed passwords
    console.log('\n👤 Creating sample users...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const sampleUsers = [
      ['Admin User', 'admin@company.com', hashedPassword, 'admin', 'active'],
      ['HR Manager', 'hr@company.com', hashedPassword, 'hr', 'active'],
      ['Payroll Officer', 'payroll@company.com', hashedPassword, 'payroll', 'active'],
      ['John Employee', 'employee@company.com', hashedPassword, 'employee', 'active']
    ];
    
    for (const user of sampleUsers) {
      try {
        const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [user[1]]);
        if (existing.length === 0) {
          await connection.query(
            'INSERT INTO users (full_name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
            user
          );
          console.log(`✅ Created user: ${user[1]} (${user[3]})`);
        } else {
          console.log(`ℹ️  User already exists: ${user[1]}`);
        }
      } catch (error) {
        console.log(`⚠️  Could not create user ${user[1]}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

setupDatabase();
