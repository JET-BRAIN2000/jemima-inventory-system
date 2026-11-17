const pool = require('./db');

async function migrate() {
  try {
    // 1. Update existing NULL values to empty strings/defaults
    console.log('Updating existing NULL values...');
    await pool.query(`UPDATE profiles SET date_of_birth = '1900-01-01' WHERE date_of_birth IS NULL`);
    await pool.query(`UPDATE profiles SET address = '' WHERE address IS NULL`);
    await pool.query(`UPDATE profiles SET profile_picture_path = '' WHERE profile_picture_path IS NULL`);
    await pool.query(`UPDATE profiles SET phone_number = '' WHERE phone_number IS NULL`);
    await pool.query(`UPDATE profiles SET full_name = '' WHERE full_name IS NULL`);
    console.log('  OK: NULL values updated');

    // 2. Alter columns to NOT NULL with defaults
    console.log('Altering columns to NOT NULL...');
    await pool.query(`ALTER TABLE profiles MODIFY COLUMN full_name VARCHAR(255) NOT NULL DEFAULT ''`);
    await pool.query(`ALTER TABLE profiles MODIFY COLUMN phone_number VARCHAR(50) NOT NULL DEFAULT ''`);
    await pool.query(`ALTER TABLE profiles MODIFY COLUMN date_of_birth DATE NOT NULL DEFAULT '1900-01-01'`);
    await pool.query(`ALTER TABLE profiles MODIFY COLUMN address TEXT NOT NULL`);
    await pool.query(`ALTER TABLE profiles MODIFY COLUMN profile_picture_path VARCHAR(255) NOT NULL DEFAULT ''`);
    await pool.query(`ALTER TABLE profiles MODIFY COLUMN date_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
    console.log('  OK: Columns altered to NOT NULL');

    // 3. Verify
    const [cols] = await pool.query('DESCRIBE profiles');
    console.log('\nProfiles columns after migration:');
    cols.forEach(c => console.log(`  ${c.Field} | ${c.Type} | NULL=${c.Null} | Default=${c.Default}`));

    // 4. Show current data
    const [rows] = await pool.query('SELECT * FROM profiles LIMIT 5');
    console.log('\nCurrent profile data:');
    rows.forEach(r => {
      console.log(`  user_id: ${r.user_id}`);
      console.log(`    full_name: "${r.full_name}"`);
      console.log(`    phone_number: "${r.phone_number}"`);
      console.log(`    date_of_birth: "${r.date_of_birth}"`);
      console.log(`    address: "${r.address}"`);
      console.log(`    profile_picture_path: "${r.profile_picture_path}"`);
    });

    console.log('\nMigration complete!');
    process.exit(0);
  } catch (e) {
    console.error('Migration failed:', e.message);
    process.exit(1);
  }
}

migrate();
