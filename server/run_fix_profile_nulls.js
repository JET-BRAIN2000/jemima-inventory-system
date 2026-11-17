const pool = require('./db');

async function fix() {
  try {
    // 1. Check current column definitions
    const [cols] = await pool.query(
      `SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT, DATA_TYPE 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = 'jemima' AND TABLE_NAME = 'profiles'
       ORDER BY ORDINAL_POSITION`
    );
    console.log('=== CURRENT PROFILES COLUMNS ===');
    cols.forEach(c => {
      console.log(`  ${c.COLUMN_NAME}: nullable=${c.IS_NULLABLE}, default=${c.COLUMN_DEFAULT}, type=${c.DATA_TYPE}`);
    });

    // 2. ALTER columns to allow NULL
    console.log('\n=== ALTERING COLUMNS TO ALLOW NULL ===');

    const alterStatements = [
      "ALTER TABLE profiles MODIFY COLUMN date_of_birth DATE NULL DEFAULT NULL",
      "ALTER TABLE profiles MODIFY COLUMN address TEXT NULL DEFAULT NULL",
      "ALTER TABLE profiles MODIFY COLUMN profile_picture_path VARCHAR(255) NULL DEFAULT NULL",
      "ALTER TABLE profiles MODIFY COLUMN phone_number VARCHAR(50) NULL DEFAULT NULL",
    ];

    for (const stmt of alterStatements) {
      try {
        await pool.query(stmt);
        console.log(`  ✅ ${stmt}`);
      } catch (err) {
        console.log(`  ⚠️  ${stmt} — ${err.message}`);
      }
    }

    // 3. Clean up sentinel values
    console.log('\n=== CLEANING UP SENTINEL VALUES ===');
    
    const [r1] = await pool.query("UPDATE profiles SET date_of_birth = NULL WHERE date_of_birth = '1900-01-01'");
    console.log(`  date_of_birth sentinels cleaned: ${r1.affectedRows} rows`);
    
    const [r2] = await pool.query("UPDATE profiles SET address = NULL WHERE address = ''");
    console.log(`  empty address cleaned: ${r2.affectedRows} rows`);
    
    const [r3] = await pool.query("UPDATE profiles SET profile_picture_path = NULL WHERE profile_picture_path = ''");
    console.log(`  empty profile_picture_path cleaned: ${r3.affectedRows} rows`);

    // 4. Verify
    const [cols2] = await pool.query(
      `SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT, DATA_TYPE 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = 'jemima' AND TABLE_NAME = 'profiles'
       ORDER BY ORDINAL_POSITION`
    );
    console.log('\n=== UPDATED PROFILES COLUMNS ===');
    cols2.forEach(c => {
      console.log(`  ${c.COLUMN_NAME}: nullable=${c.IS_NULLABLE}, default=${c.COLUMN_DEFAULT}, type=${c.DATA_TYPE}`);
    });

    console.log('\n✅ All done!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fix();
