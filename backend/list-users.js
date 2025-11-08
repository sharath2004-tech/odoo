import { pool } from './config/database.js';

const main = async () => {
  try {
    const [rows] = await pool.query('SELECT id, email, role FROM users LIMIT 10');
    console.log(rows);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
};

main();
