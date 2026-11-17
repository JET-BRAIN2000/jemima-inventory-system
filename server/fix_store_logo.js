const pool = require('./db');
(async ()=>{
  try {
    await pool.query("UPDATE stores SET store_logo_path = '' WHERE store_logo_path IS NULL");
    console.log('store_logo_path NULLs replaced');
    process.exit(0);
  } catch (e) { console.error(e); process.exit(1); }
})();
