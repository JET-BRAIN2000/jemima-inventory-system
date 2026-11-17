const fs = require('fs');
const pool = require('./db');

async function run() {
  try {
    const sql = fs.readFileSync('./migrations/alter_stores.sql', 'utf8');
    // Split by ; but keep statements intact (simple approach)
    const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      console.log('Executing:', stmt.substring(0, 120).replace(/\n/g, ' ') + (stmt.length>120? '...':'') );
      await pool.query(stmt);
    }
    console.log('Migration applied successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exit(1);
  }
}

run();
