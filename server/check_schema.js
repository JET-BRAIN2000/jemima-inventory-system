const pool = require('./db');

async function verify() {
  try {
    // Check profiles data
    const [profiles] = await pool.query('SELECT * FROM profiles LIMIT 5');
    console.log('=== PROFILES ===');
    profiles.forEach(p => {
      console.log(`  user_id: ${p.user_id}`);
      console.log(`    full_name: ${p.full_name} (type: ${typeof p.full_name})`);
      console.log(`    job_title: ${p.job_title}`);
      console.log(`    phone_number: ${p.phone_number}`);
      console.log(`    date_of_birth: ${p.date_of_birth}`);
      console.log(`    address: ${p.address}`);
      console.log(`    date_modified: ${p.date_modified}`);
      console.log('');
    });

    // Check security_logs
    const [logs] = await pool.query('SELECT * FROM security_logs ORDER BY event_timestamp DESC LIMIT 10');
    console.log('=== SECURITY LOGS ===');
    if (logs.length === 0) {
      console.log('  No security logs yet');
    } else {
      logs.forEach(l => {
        console.log(`  [${l.event_timestamp}] ${l.event_type}: ${l.event_description} (user: ${l.user_id})`);
      });
    }

    // Check password_changed_at
    const [users] = await pool.query('SELECT user_id, username, password_changed_at, last_login FROM users');
    console.log('\n=== USERS ===');
    users.forEach(u => {
      console.log(`  ${u.username} (${u.user_id}): password_changed_at=${u.password_changed_at}, last_login=${u.last_login}`);
    });

    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

verify();
