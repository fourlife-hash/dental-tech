require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function fix() {
  await p.query("SELECT setval('metal_stocks_id_seq',    COALESCE((SELECT MAX(id) FROM metal_stocks),    0)+1, false)");
  await p.query("SELECT setval('metal_types_id_seq',     COALESCE((SELECT MAX(id) FROM metal_types),     0)+1, false)");
  await p.query("SELECT setval('invoice_history_id_seq', COALESCE((SELECT MAX(id) FROM invoice_history), 0)+1, false)");
  console.log('シーケンスリセット完了');
  p.end();
}

fix().catch(e => { console.error(e); p.end(); });
