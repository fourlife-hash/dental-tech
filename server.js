require('dotenv').config();
const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {}
);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

const safeInt = (val) => { const n = parseInt(val, 10); return isNaN(n) ? 0 : n; };
const safeFloat = (val) => { const n = parseFloat(val); return isNaN(n) ? 0 : n; };

// ─── 医院名の正規化・あいまい補正ヘルパー ───
async function resolveClinicName(rawName) {
  if (!rawName) return '';
  const trimmed = rawName.trim();
  try {
    const { rows } = await pool.query('SELECT name FROM clinics');
    if (rows.length === 0) return trimmed;
    const exact = rows.find(c => c.name === trimmed);
    if (exact) return exact.name;

    const cleanInput = trimmed.replace(/歯科医院|歯科|クリニック/g, '');
    const matched = rows.find(c => {
      const cleanDbName = c.name.replace(/歯科医院|歯科|クリニック/g, '');
      return c.name.includes(trimmed) || trimmed.includes(c.name) || (cleanInput && cleanDbName.includes(cleanInput));
    });
    if (matched) return matched.name;
  } catch (e) {
    console.error('Clinic resolve error:', e);
  }
  return trimmed;
}

// ─── 集計期間（前月21日〜当月20日 または 月初〜月末）計算ヘルパー ───
function getBillingPeriod(year, month, monthEnd) {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  if (monthEnd) {
    const dateFrom = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const dateTo = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { dateFrom, dateTo };
  } else {
    let prevY = y;
    let prevM = m - 1;
    if (prevM === 0) {
      prevY--;
      prevM = 12;
    }
    const dateFrom = `${prevY}-${String(prevM).padStart(2, '0')}-21`;
    const dateTo = `${y}-${String(m).padStart(2, '0')}-20`;
    return { dateFrom, dateTo };
  }
}

// ─── DB初期化 ───
async function initDb() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, clinic TEXT NOT NULL, patient TEXT NOT NULL, set_date TEXT NOT NULL, set_time TEXT NOT NULL, shiki TEXT NOT NULL DEFAULT '', gikobutsu TEXT NOT NULL DEFAULT '', done BOOLEAN NOT NULL DEFAULT FALSE, created_at TEXT NOT NULL)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS clinics (id TEXT PRIMARY KEY, name TEXT NOT NULL, short_name TEXT NOT NULL, closing_day INTEGER NOT NULL)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, code TEXT NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS prices (clinic_id TEXT NOT NULL, product_id TEXT NOT NULL, price INTEGER NOT NULL, PRIMARY KEY (clinic_id, product_id))`);
    await pool.query(`CREATE TABLE IF NOT EXISTS delivery_notes (id TEXT PRIMARY KEY, delivery_no TEXT NOT NULL UNIQUE, clinic_id TEXT, clinic_name TEXT NOT NULL, delivery_date TEXT NOT NULL, patient_name TEXT NOT NULL DEFAULT '', shiki TEXT NOT NULL DEFAULT '', rows JSONB NOT NULL DEFAULT '[]', para_gram NUMERIC NOT NULL DEFAULT 0, miro_gram NUMERIC NOT NULL DEFAULT 0, subtotal_giko INTEGER NOT NULL DEFAULT 0, subtotal_material INTEGER NOT NULL DEFAULT 0, tax INTEGER NOT NULL DEFAULT 0, total INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)`);

    const alterQueries = [
      `ALTER TABLE delivery_notes ADD COLUMN patient_name TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE delivery_notes ADD COLUMN shiki TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE delivery_notes ADD COLUMN job_id TEXT DEFAULT NULL`,
      `ALTER TABLE clinics ADD COLUMN bank_info TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE clinics ADD COLUMN address TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE clinics ADD COLUMN postal_code TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE clinics ADD COLUMN month_end BOOLEAN NOT NULL DEFAULT FALSE`,
      `ALTER TABLE delivery_notes ADD COLUMN base_up_support INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE delivery_notes ADD COLUMN base_up_count INTEGER NOT NULL DEFAULT 0`
    ];
    for (const q of alterQueries) { try { await pool.query(q); } catch (e) {} }

    await pool.query(`CREATE TABLE IF NOT EXISTS metal_types (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS metal_stocks (id SERIAL PRIMARY KEY, date DATE NOT NULL, clinic_name TEXT, metal_type TEXT NOT NULL, transaction_type TEXT NOT NULL, weight DECIMAL(8,2) NOT NULL, note TEXT, delivery_note_id TEXT, created_at TIMESTAMP DEFAULT NOW())`);
    try { await pool.query(`ALTER TABLE metal_stocks ADD COLUMN delivery_note_id TEXT`); } catch (e) {}

    // 元の手入力売上テーブル（SalesReport.jsx 用）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales_manual (
        id SERIAL PRIMARY KEY,
        year INTEGER NOT NULL,
        clinic_name TEXT NOT NULL,
        month INTEGER NOT NULL,
        amount INTEGER NOT NULL DEFAULT 0,
        UNIQUE (year, clinic_name, month)
      )
    `);

    // 元の請求書履歴テーブル（Invoice.jsx 用）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoice_history (
        id SERIAL PRIMARY KEY,
        clinic_id TEXT NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        total_amount INTEGER NOT NULL DEFAULT 0,
        prev_amount INTEGER NOT NULL DEFAULT 0,
        paid_amount INTEGER NOT NULL DEFAULT 0,
        adjust_amount INTEGER NOT NULL DEFAULT 0,
        carry_over INTEGER NOT NULL DEFAULT 0,
        notes_snapshot JSONB NOT NULL DEFAULT '[]',
        grand_total INTEGER NOT NULL DEFAULT 0,
        bank_info TEXT NOT NULL DEFAULT '',
        period_from TEXT NOT NULL DEFAULT '',
        period_to TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (clinic_id, year, month)
      )
    `);

    await pool.query(`INSERT INTO metal_types (name) VALUES ('パラジウム'),('ミロ'),('金') ON CONFLICT (name) DO NOTHING`);
    await pool.query(`CREATE TABLE IF NOT EXISTS company_info (id SERIAL PRIMARY KEY, bank_info TEXT, base_up_price INTEGER DEFAULT 150, updated_at TIMESTAMP DEFAULT NOW())`);
    await pool.query(`INSERT INTO company_info (id, bank_info, base_up_price) VALUES (1, '', 150) ON CONFLICT (id) DO NOTHING`);
  } catch (e) { console.error(e); }
}

function jobFromRow(r) { return { id: r.id, clinic: r.clinic, patient: r.patient, setDate: r.set_date, setTime: r.set_time, shiki: r.shiki || '', gikobutsu: r.gikobutsu || '', done: r.done, createdAt: r.created_at }; }
function clinicFromRow(r) { return { id: r.id, name: r.name, shortName: r.short_name, closingDay: r.closing_day, bankInfo: r.bank_info || '', address: r.address || '', postalCode: r.postal_code || '', monthEnd: r.month_end || false }; }
function productFromRow(r) { return { id: r.id, code: r.code, name: r.name, category: r.category }; }
function priceFromRow(r) { return { clinicId: r.clinic_id, productId: r.product_id, price: r.price }; }
function deliveryNoteFromRow(r) { return { id: r.id, deliveryNo: r.delivery_no, clinicId: r.clinic_id, clinicName: r.clinic_name, deliveryDate: r.delivery_date, patientName: r.patient_name || '', shiki: r.shiki || '', rows: Array.isArray(r.rows) ? r.rows : JSON.parse(r.rows || '[]'), paraGram: parseFloat(r.para_gram) || 0, miroGram: parseFloat(r.miro_gram) || 0, subtotalGiko: parseInt(r.subtotal_giko, 10) || 0, subtotalMaterial: parseInt(r.subtotal_material, 10) || 0, tax: parseInt(r.tax, 10) || 0, total: parseInt(r.total, 10) || 0, baseUpSupport: parseInt(r.base_up_support, 10) || 0, baseUpCount: parseInt(r.base_up_count, 10) || 0, createdAt: r.created_at, jobId: r.job_id || null }; }

// ─── 案件（Jobs）API ───
app.get('/api/jobs', async (req, res) => {
  try {
    const { clinic, date, done } = req.query;
    const conditions = []; const params = [];
    if (clinic) { params.push(clinic); conditions.push(`clinic = $${params.length}`); }
    if (date) { params.push(date); conditions.push(`set_date::date = $${params.length}`); }
    if (done !== undefined) { params.push(done === 'true'); conditions.push(`done = $${params.length}`); }
    const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(`SELECT DISTINCT ON (clinic, patient, set_date, shiki, gikobutsu) * FROM jobs${where} ORDER BY clinic, patient, set_date, shiki, gikobutsu, created_at DESC`, params);
    res.json(rows.map(jobFromRow));
  } catch (err) { res.json([]); }
});

app.post('/api/jobs', async (req, res) => {
  const { clinic: rawClinic, patient: rawPatient, setDate, setTime, shiki, gikobutsu } = req.body;
  const clinic = await resolveClinicName(rawClinic);
  const patient = (rawPatient || '').trim();
  if (!clinic || !patient || !setDate || !setTime) return res.status(400).json({ error: '必須項目不足' });
  try {
    const dupCheck = await pool.query(`SELECT id FROM jobs WHERE clinic = $1 AND patient = $2 AND set_date = $3 AND shiki = $4 AND gikobutsu = $5`, [clinic, patient, setDate, shiki || '', gikobutsu || '']);
    if (dupCheck.rowCount > 0) {
      return res.status(409).json({ error: 'すでに同じ内容の案件が登録されています' });
    }
    const id = uuidv4(), createdAt = new Date().toISOString();
    await pool.query(`INSERT INTO jobs (id, clinic, patient, set_date, set_time, shiki, gikobutsu, done, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [id, clinic, patient, setDate, setTime, shiki || '', gikobutsu || '', false, createdAt]);
    res.status(201).json({ id, clinic, patient, setDate, setTime, shiki: shiki || '', gikobutsu: gikobutsu || '', done: false, createdAt });
  } catch (err) { res.status(500).json({ error: 'DBエラー' }); }
});

app.patch('/api/jobs/:id', async (req, res) => {
  const { id } = req.params;
  const { clinic: rawClinic, patient, setDate, setTime, shiki, gikobutsu } = req.body;
  const clinic = rawClinic ? await resolveClinicName(rawClinic) : undefined;
  try {
    const { rows } = await pool.query('SELECT * FROM jobs WHERE id=$1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: '案件なし' });
    const j = rows[0];
    const result = await pool.query(`UPDATE jobs SET clinic=$1, patient=$2, set_date=$3, set_time=$4, shiki=$5, gikobutsu=$6 WHERE id=$7 RETURNING *`, [clinic ?? j.clinic, patient ?? j.patient, setDate ?? j.set_date, setTime ?? j.set_time, shiki ?? j.shiki, gikobutsu ?? j.gikobutsu, id]);
    res.json(jobFromRow(result.rows[0]));
  } catch (err) { res.status(500).json({ error: 'DBエラー' }); }
});

app.patch('/api/jobs/:id/done', async (req, res) => {
  const { id } = req.params;
  const { done } = req.body;
  try {
    const result = await pool.query('UPDATE jobs SET done=$1 WHERE id=$2 RETURNING *', [Boolean(done), id]);
    if (result.rowCount === 0) return res.status(404).json({ error: '案件なし' });
    res.json(jobFromRow(result.rows[0]));
  } catch (err) { res.status(500).json({ error: 'DBエラー' }); }
});

app.delete('/api/jobs/:id', async (req, res) => { try { await pool.query('DELETE FROM jobs WHERE id=$1', [req.params.id]); res.json({ success: true }); } catch (err) { res.status(500).json({ error: 'DBエラー' }); } });

// ─── 医院・商品・単価 API ───
app.get('/api/clinics', async (req, res) => { try { const { rows } = await pool.query('SELECT * FROM clinics ORDER BY id'); res.json(rows.map(clinicFromRow)); } catch (err) { res.json([]); } });

app.patch('/api/clinics/:id', async (req, res) => {
  const { id } = req.params;
  const { postalCode, address, bankInfo, monthEnd } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM clinics WHERE id=$1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: '医院なし' });
    const c = rows[0];
    const result = await pool.query(
      `UPDATE clinics SET postal_code=$1, address=$2, bank_info=$3, month_end=$4 WHERE id=$5 RETURNING *`,
      [
        postalCode !== undefined ? postalCode : c.postal_code,
        address !== undefined ? address : c.address,
        bankInfo !== undefined ? bankInfo : c.bank_info,
        monthEnd !== undefined ? Boolean(monthEnd) : c.month_end,
        id
      ]
    );
    res.json(clinicFromRow(result.rows[0]));
  } catch (err) { res.status(500).json({ error: 'DBエラー' }); }
});

app.get('/api/products', async (req, res) => { try { const { rows } = await pool.query('SELECT * FROM products ORDER BY code'); res.json(rows.map(productFromRow)); } catch (err) { res.json([]); } });
app.get('/api/prices/:clinicId', async (req, res) => { try { const { rows } = await pool.query('SELECT * FROM prices WHERE clinic_id=$1 ORDER BY product_id', [req.params.clinicId]); res.json(rows.map(priceFromRow)); } catch (err) { res.json([]); } });

// ─── 納品書（Delivery Notes）API ───
app.get('/api/delivery-notes/search', async (req, res) => {
  try {
    const q = `%${req.query.q || ''}%`;
    const { rows } = await pool.query(`SELECT * FROM ( SELECT DISTINCT ON (clinic_name, delivery_date, COALESCE(NULLIF(patient_name,''),id)) * FROM delivery_notes ORDER BY clinic_name, delivery_date, COALESCE(NULLIF(patient_name,''),id), created_at DESC ) d WHERE patient_name ILIKE $1 OR clinic_name ILIKE $1 ORDER BY delivery_date DESC, delivery_no DESC`, [q]);
    res.json(rows.map(deliveryNoteFromRow));
  } catch (err) { res.json([]); }
});

app.get('/api/delivery-notes', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM ( SELECT DISTINCT ON ( clinic_name, delivery_date, COALESCE(NULLIF(patient_name, ''), id) ) * FROM delivery_notes ORDER BY clinic_name, delivery_date, COALESCE(NULLIF(patient_name, ''), id), created_at DESC ) deduped ORDER BY delivery_no DESC`);
    res.json(rows.map(deliveryNoteFromRow));
  } catch (err) { res.json([]); }
});

app.get('/api/delivery-notes/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM delivery_notes WHERE id=$1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: '納品書なし' });
    res.json(deliveryNoteFromRow(rows[0]));
  } catch (err) { res.status(500).json({ error: 'DBエラー' }); }
});

app.post('/api/delivery-notes', async (req, res) => {
  const { clinicId, clinicName: rawClinicName, deliveryDate, patientName, shiki, rows, paraGram, miroGram, subtotalGiko, subtotalMaterial, tax, total, baseUpSupport, baseUpCount, jobId } = req.body;
  const clinicName = await resolveClinicName(rawClinicName);
  if (!clinicName || !deliveryDate) return res.status(400).json({ error: '必須項目不足' });
  const pGram = safeFloat(paraGram), mGram = safeFloat(miroGram);
  try {
    if (jobId) {
      const byJob = await pool.query('SELECT id FROM delivery_notes WHERE job_id=$1', [jobId]);
      if (byJob.rowCount > 0) {
        const existId = byJob.rows[0].id;
        const result = await pool.query(`UPDATE delivery_notes SET clinic_id=$1, clinic_name=$2, patient_name=$3, shiki=$4, rows=$5, para_gram=$6, miro_gram=$7, subtotal_giko=$8, subtotal_material=$9, tax=$10, total=$11, base_up_support=$12, base_up_count=$13, delivery_date=$14 WHERE id=$15 RETURNING *`, [clinicId || null, clinicName, patientName || '', shiki || '', JSON.stringify(rows || []), pGram, mGram, safeInt(subtotalGiko), safeInt(subtotalMaterial), safeInt(tax), safeInt(total), safeInt(baseUpSupport), safeInt(baseUpCount), deliveryDate, existId]);
        await syncMetalStocksForNote(existId, deliveryDate, clinicName, pGram, mGram);
        return res.json(deliveryNoteFromRow(result.rows[0]));
      }
    }
    const { rows: seq } = await pool.query("SELECT COALESCE(MAX(delivery_no::integer), 0) + 1 AS next_no FROM delivery_notes");
    const deliveryNo = String(seq[0].next_no).padStart(6, '0'), id = uuidv4(), createdAt = new Date().toISOString();
    await pool.query(`INSERT INTO delivery_notes (id, delivery_no, clinic_id, clinic_name, delivery_date, patient_name, shiki, rows, para_gram, miro_gram, subtotal_giko, subtotal_material, tax, total, base_up_support, base_up_count, created_at, job_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`, [id, deliveryNo, clinicId || null, clinicName, deliveryDate, patientName || '', shiki || '', JSON.stringify(rows || []), pGram, mGram, safeInt(subtotalGiko), safeInt(subtotalMaterial), safeInt(tax), safeInt(total), safeInt(baseUpSupport), safeInt(baseUpCount), createdAt, jobId || null]);
    const { rows: saved } = await pool.query('SELECT * FROM delivery_notes WHERE id=$1', [id]);
    await syncMetalStocksForNote(id, deliveryDate, clinicName, pGram, mGram);
    res.status(201).json(deliveryNoteFromRow(saved[0]));
  } catch (err) { res.status(500).json({ error: 'DBエラー: ' + err.message }); }
});

app.put('/api/delivery-notes/:id', async (req, res) => {
  const { id } = req.params;
  const { clinicId, clinicName: rawClinicName, deliveryDate, patientName, shiki, rows, paraGram, miroGram, subtotalGiko, subtotalMaterial, tax, total, baseUpSupport, baseUpCount } = req.body;
  const clinicName = await resolveClinicName(rawClinicName);
  const pGram = safeFloat(paraGram), mGram = safeFloat(miroGram);
  try {
    const result = await pool.query(`UPDATE delivery_notes SET clinic_id=$1, clinic_name=$2, delivery_date=$3, patient_name=$4, shiki=$5, rows=$6, para_gram=$7, miro_gram=$8, subtotal_giko=$9, subtotal_material=$10, tax=$11, total=$12, base_up_support=$13, base_up_count=$14 WHERE id=$15 RETURNING *`, [clinicId || null, clinicName, deliveryDate, patientName || '', shiki || '', JSON.stringify(rows || []), pGram, mGram, safeInt(subtotalGiko), safeInt(subtotalMaterial), safeInt(tax), safeInt(total), safeInt(baseUpSupport), safeInt(baseUpCount), id]);
    if (result.rowCount === 0) return res.status(404).json({ error: '納品書なし' });
    await syncMetalStocksForNote(id, deliveryDate, clinicName, pGram, mGram);
    res.json(deliveryNoteFromRow(result.rows[0]));
  } catch (err) { res.status(500).json({ error: 'DBエラー' }); }
});

app.delete('/api/delivery-notes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM metal_stocks WHERE delivery_note_id