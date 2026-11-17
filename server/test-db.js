const pool = require('./db');

async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('MySQL connection successful.');
    console.log('Test query result:', rows[0].result);
    process.exit(0);
  } catch (error) {
    console.error('MySQL connection failed:');
    console.error(error.message || error);
    process.exit(1);
  }
}

testConnection();
