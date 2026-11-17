const pool = require('./db');
(async()=>{
  try{
    const [rows] = await pool.query('SELECT store_id, store_logo_path, CHAR_LENGTH(store_logo_path) AS len FROM stores');
    console.log(rows);
    process.exit(0);
  }catch(e){console.error(e);process.exit(1);} 
})();
