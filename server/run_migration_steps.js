const fs = require('fs');
const pool = require('./db');
(async () => {
  try {
    const sql = fs.readFileSync('./migrations/alter_stores.sql', 'utf8');
    // Extract the ALTER TABLE block
    const m = sql.match(/ALTER TABLE\s+stores\s*([\s\S]*);/i);
    if (!m) throw new Error('No ALTER TABLE stores block found');
    const body = m[1].trim();
    // Split by commas at top-level
    const parts = body.split(/,\s*\n/).map(p => p.trim()).filter(Boolean);
    for (const part of parts) {
      const stmt = 'ALTER TABLE stores ' + part + ';';
      console.log('\nExecuting:', stmt.replace(/\s+/g,' ').substring(0,200));
      try {
        const [res] = await pool.query(stmt);
        console.log('OK');
      } catch (err) {
        console.error('FAILED:', err.message || err);
        throw err;
      }
    }
    console.log('\nAll steps applied successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration steps failed:', err.message || err);
    process.exit(1);
  }
})();
