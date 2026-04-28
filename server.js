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

// ─── 初期データ ───────────────────────────────────────────────────────────────

const SEED_CLINICS = [
  { id: 'c1', name: '吉岡歯科医院',               shortName: '吉岡',       closingDay: 20 },
  { id: 'c2', name: 'くいなばしデンタルクリニック', shortName: 'くいなばし', closingDay: 20 },
  { id: 'c3', name: '織田歯科医院',               shortName: '織田',       closingDay: 20 },
  { id: 'c4', name: '三村歯科医院',               shortName: '三村',       closingDay: 20 },
  { id: 'c5', name: '田伏歯科医院',               shortName: '田伏',       closingDay: 20 },
  { id: 'c6', name: 'クロイ歯科医院',             shortName: 'クロイ',     closingDay: 20 },
  { id: 'c7', name: 'きむら歯科医院',             shortName: 'きむら',     closingDay: 20 },
  { id: 'c8', name: '高尾歯科医院',               shortName: '高尾',       closingDay: 20 },
];

const SEED_PRODUCTS = [
  { id: 'p001', code: '001', name: '前装冠（1本）',          category: '保険技工' },
  { id: 'p002', code: '002', name: '前装冠（2本ブリッジ）',  category: '保険技工' },
  { id: 'p003', code: '003', name: '前装冠（3本ブリッジ）',  category: '保険技工' },
  { id: 'p004', code: '004', name: 'CAD/CAM冠（1本）',       category: '保険技工' },
  { id: 'p005', code: '005', name: '金属冠（1本）',          category: '保険技工' },
  { id: 'p006', code: '006', name: '部分床義歯（片顎）',     category: '保険技工' },
  { id: 'p007', code: '007', name: '総義歯（片顎）',         category: '保険技工' },
  { id: 'p008', code: '008', name: 'ジルコニアクラウン',     category: '自費技工' },
  { id: 'p009', code: '009', name: 'セラミッククラウン（e.max）', category: '自費技工' },
  { id: 'p010', code: '010', name: '石膏模型',               category: '材料' },
  { id: 'p011', code: '011', name: 'ロウ型',                 category: '材料' },
  { id: 'p012', code: '012', name: '預かり',                 category: '預かり' },
];

const SEED_PRICES = [
  { clinicId: 'c1', productId: 'p001', price: 6390 },
  { clinicId: 'c1', productId: 'p005', price: 4000 },
  { clinicId: 'c1', productId: 'p007', price: 31800 },
  { clinicId: 'c2', productId: 'p001', price: 5000 },
  { clinicId: 'c2', productId: 'p004', price: 14500 },
  { clinicId: 'c2', productId: 'p008', price: 44000 },
  { clinicId: 'c4', productId: 'p004', price: 8400 },
  { clinicId: 'c5', productId: 'p001', price: 5250 },
  { clinicId: 'c5', productId: 'p004', price: 8400 },
  { clinicId: 'c5', productId: 'p006', price: 10400 },
  { clinicId: 'c6', productId: 'p001', price: 4000 },
  { clinicId: 'c7', productId: 'p001', price: 4000 },
  { clinicId: 'c8', productId: 'p001', price: 5000 },
];

const SEED_JOBS = [
  { id: '046fc02b-8d02-4aba-abd5-abc01302eb10', clinic: '田伏歯科医院',               patient: '松本 光正',   setDate: '2026-04-22', setTime: '10:30', done: true,  createdAt: '2026-04-26T14:09:32.894Z' },
  { id: '3ef9eb49-7661-452a-ab15-9ae21d7223c7', clinic: 'クロイD・C',                patient: '田中 茂行',   setDate: '2026-04-27', setTime: '09:00', done: false, createdAt: '2026-04-26T14:09:32.902Z' },
  { id: 'c994f223-e4b1-4ce6-ba98-dd9b1f630c1f', clinic: '吉岡歯科医院',              patient: '岡田 三奈',   setDate: '2026-04-21', setTime: '07:00', done: true,  createdAt: '2026-04-26T14:09:32.908Z' },
  { id: '44688d21-bb82-4944-b05a-cac0c1435740', clinic: 'くいなばしデンタルクリニック', patient: '田路 真柘美', setDate: '2026-04-21', setTime: '16:30', done: true,  createdAt: '2026-04-26T14:09:32.913Z' },
  { id: '3620f929-2162-492e-90f1-766bd52d7aca', clinic: 'きむら歯科医院',             patient: '林山 安美',   setDate: '2026-04-21', setTime: '11:00', done: true,  createdAt: '2026-04-26T14:09:32.918Z' },
  { id: '49b6fc99-292a-4868-a13f-3d008d225532', clinic: '吉岡歯科医院',              patient: '土井 居子',   setDate: '2026-04-22', setTime: '11:00', done: true,  createdAt: '2026-04-26T14:09:32.923Z' },
  { id: 'b67f28a2-f598-4bb8-8043-b7cadfed8fa0', clinic: 'クロイD・C',                patient: '大西 寛子',   setDate: '2026-04-21', setTime: '17:30', done: true,  createdAt: '2026-04-26T14:09:32.928Z' },
  { id: '5432c7b8-13fb-46e9-a8ee-3958f1a95344', clinic: '高尾歯科医院',              patient: '白石',        setDate: '2026-04-21', setTime: '10:00', done: true,  createdAt: '2026-04-26T14:09:32.933Z' },
  { id: 'f87c898b-38e3-425e-830e-58710ec60cd0', clinic: 'クロイD・C',                patient: '西台 雅子',   setDate: '2026-04-22', setTime: '11:00', done: true,  createdAt: '2026-04-26T14:09:32.937Z' },
  { id: 'ce52e055-475a-4664-b4e4-e1f302f143d7', clinic: 'クロイD・C',                patient: '米田 尚且',   setDate: '2026-04-22', setTime: '06:00', done: true,  createdAt: '2026-04-26T14:09:32.942Z' },
  { id: '6541de7b-3065-4fdd-8ec4-ce338f3bf559', clinic: 'クロイD・C',                patient: '石井 貞温',   setDate: '2026-04-24', setTime: '17:45', done: true,  createdAt: '2026-04-26T14:09:32.947Z' },
  { id: '9b81e1b9-d255-4f40-91c0-62b473d395e7', clinic: '三村歯科医院',              patient: '仲田 耕平介', setDate: '2026-04-25', setTime: '09:00', done: true,  createdAt: '2026-04-26T14:09:32.951Z' },
  { id: 'd7733b48-d879-421f-bf90-e130caccefdc', clinic: '吉岡歯科医院',              patient: '中田 里美',   setDate: '2026-04-24', setTime: '17:30', done: true,  createdAt: '2026-04-26T14:09:32.955Z' },
  { id: '8d775965-3b85-4279-963f-368ef3f8aabd', clinic: '田伏歯科医院',              patient: '石井 明',     setDate: '2026-04-24', setTime: '09:00', done: true,  createdAt: '2026-04-26T14:09:32.959Z' },
  { id: 'a4913b56-8304-4b26-b31a-2b9006251227', clinic: '吉岡歯科医院',              patient: '六布 智子',   setDate: '2026-04-27', setTime: '07:00', done: false, createdAt: '2026-04-26T14:09:32.965Z' },
  { id: '018a6ed9-9bd8-41a3-96fd-445caf2f30d3', clinic: 'きむら歯科医院',            patient: '日原 慧大',   setDate: '2026-04-24', setTime: '16:00', done: true,  createdAt: '2026-04-26T14:09:32.969Z' },
  { id: '9cc6c448-e04b-4ed4-bb9e-55be39936cf6', clinic: '吉岡歯科医院',              patient: '宮里 篤志',   setDate: '2026-04-22', setTime: '18:00', done: true,  createdAt: '2026-04-26T14:09:32.973Z' },
  { id: 'e57f2fe7-6c6e-443b-91b2-fb02ddab2db5', clinic: '高尾歯科医院',              patient: '三島',        setDate: '2026-05-01', setTime: '10:00', done: false, createdAt: '2026-04-26T14:09:32.977Z' },
  { id: 'a51ade14-70cb-4cd7-adee-78d927ebcd5e', clinic: 'くいなばしデンタルクリニック', patient: '山田 友美',  setDate: '2026-04-22', setTime: '19:00', done: true,  createdAt: '2026-04-26T14:09:32.982Z' },
  { id: '965a2a5b-44e0-4038-83c7-589fa7c88431', clinic: '吉岡歯科医院',              patient: '杉津 知永',   setDate: '2026-05-13', setTime: '16:00', done: false, createdAt: '2026-04-26T14:09:32.986Z' },
  { id: '3ae4646e-b291-4cf2-8f07-5059c9fc8b8c', clinic: 'クロイD・C',                patient: '渡邊 美智子', setDate: '2026-05-01', setTime: '15:00', done: false, createdAt: '2026-04-26T14:09:32.991Z' },
  { id: '13fe032d-ae64-41af-ae56-50f9a98c906e', clinic: '三村歯科医院',              patient: '矢野 祐輔',   setDate: '2026-04-23', setTime: '17:00', done: true,  createdAt: '2026-04-26T14:09:32.996Z' },
  { id: 'bdd22ebb-587d-4dc8-a21b-6be02e737895', clinic: '吉岡歯科医院',              patient: '力石 留美子', setDate: '2026-04-22', setTime: '15:30', done: true,  createdAt: '2026-04-26T14:09:33.000Z' },
  { id: 'c9438220-0fe9-4163-9da4-67df8a726efe', clinic: '吉岡歯科医院',              patient: '石田 哲也',   setDate: '2026-04-24', setTime: '16:00', done: true,  createdAt: '2026-04-26T14:09:33.005Z' },
  { id: 'd4588fc3-fb77-4a05-b0e2-838ed2811840', clinic: '吉岡歯科医院',              patient: '永井 光男',   setDate: '2026-04-27', setTime: '11:00', done: false, createdAt: '2026-04-26T14:09:33.011Z' },
  { id: 'c8d53864-bcff-4fd6-9f0b-328fe590e836', clinic: '高尾歯科医院',              patient: '輪木',        setDate: '2026-04-25', setTime: '10:00', done: true,  createdAt: '2026-04-26T14:09:33.019Z' },
  { id: 'f8b35464-070f-42e5-8504-bbbd7d92b8d4', clinic: 'くいなばしデンタルクリニック', patient: '新井 順子',  setDate: '2026-04-30', setTime: '10:30', done: false, createdAt: '2026-04-26T14:09:33.025Z' },
  { id: 'e4a97015-2d3a-42c9-8e07-c31fa316f889', clinic: 'きむら歯科医院',            patient: '奥村 立美',   setDate: '2026-04-21', setTime: '10:30', done: true,  createdAt: '2026-04-26T14:09:33.030Z' },
  { id: '795272ae-11cb-4819-ba43-d6f96b1e4271', clinic: '三村歯科医院',              patient: '北野 鶴留子', setDate: '2026-05-01', setTime: '10:30', done: false, createdAt: '2026-04-26T14:09:33.035Z' },
  { id: '7e6c7b69-0b9f-4721-9521-a61dbbbbb017', clinic: '田伏歯科医院',              patient: '荒木 美帆',   setDate: '2026-04-27', setTime: '10:00', done: false, createdAt: '2026-04-26T14:09:33.041Z' },
  { id: '157bc7b6-17cf-401d-8a23-f4ba2630e150', clinic: '田伏歯科医院',              patient: '清水 直子',   setDate: '2026-04-27', setTime: '17:30', done: false, createdAt: '2026-04-26T14:09:33.047Z' },
  { id: 'e9495ea6-0eaa-4b06-b371-589b776dc616', clinic: '三村歯科医院',              patient: '黒木 君子',   setDate: '2026-05-01', setTime: '11:30', done: false, createdAt: '2026-04-26T14:09:33.056Z' },
  { id: '07415dc3-fcc7-469e-a32e-1d9f2e0862f3', clinic: '三村歯科医院',              patient: '田中 純一',   setDate: '2026-04-28', setTime: '15:00', done: false, createdAt: '2026-04-26T14:09:33.063Z' },
  { id: 'e8bc26a2-664f-4c27-87f8-79b9b93eae8b', clinic: '田伏歯科医院',              patient: '高桑 光弘',   setDate: '2026-04-28', setTime: '09:30', done: false, createdAt: '2026-04-26T14:09:33.070Z' },
  { id: 'f78a49e4-e750-44f8-a992-4d02df3c918e', clinic: '田伏歯科医院',              patient: '山本 友希',   setDate: '2026-04-28', setTime: '17:00', done: false, createdAt: '2026-04-26T14:09:33.077Z' },
  { id: 'a8cc4e14-e1b4-4f6b-964d-900f49a44242', clinic: '三村歯科医院',              patient: '寺地　進',    setDate: '2026-04-30', setTime: '18:00', done: false, createdAt: '2026-04-26T18:46:27.950Z' },
  { id: '1fffc089-e400-4ef9-b461-0a837854159a', clinic: 'きむら歯科医院',            patient: '峠　徹',      setDate: '2026-05-01', setTime: '11:00', done: false, createdAt: '2026-04-26T18:47:38.308Z' },
];

// ─── DBテーブル作成 & 初期データ投入 ─────────────────────────────────────────

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id         TEXT PRIMARY KEY,
      clinic     TEXT NOT NULL,
      patient    TEXT NOT NULL,
      set_date   TEXT NOT NULL,
      set_time   TEXT NOT NULL,
      shiki      TEXT NOT NULL DEFAULT '',
      gikobutsu  TEXT NOT NULL DEFAULT '',
      done       BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TEXT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS clinics (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      short_name  TEXT NOT NULL,
      closing_day INTEGER NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id       TEXT PRIMARY KEY,
      code     TEXT NOT NULL,
      name     TEXT NOT NULL,
      category TEXT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS prices (
      clinic_id  TEXT NOT NULL,
      product_id TEXT NOT NULL,
      price      INTEGER NOT NULL,
      PRIMARY KEY (clinic_id, product_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS delivery_notes (
      id                TEXT PRIMARY KEY,
      delivery_no       TEXT NOT NULL UNIQUE,
      clinic_id         TEXT,
      clinic_name       TEXT NOT NULL,
      delivery_date     TEXT NOT NULL,
      rows              JSONB NOT NULL DEFAULT '[]',
      para_gram         NUMERIC NOT NULL DEFAULT 0,
      miro_gram         NUMERIC NOT NULL DEFAULT 0,
      subtotal_giko     INTEGER NOT NULL DEFAULT 0,
      subtotal_material INTEGER NOT NULL DEFAULT 0,
      tax               INTEGER NOT NULL DEFAULT 0,
      total             INTEGER NOT NULL DEFAULT 0,
      created_at        TEXT NOT NULL
    )
  `);

  // 初回のみシード（clinicsが空なら全テーブルに初期データを投入）
  const { rows } = await pool.query('SELECT COUNT(*)::int AS cnt FROM clinics');
  if (rows[0].cnt === 0) {
    for (const c of SEED_CLINICS) {
      await pool.query(
        'INSERT INTO clinics (id, name, short_name, closing_day) VALUES ($1,$2,$3,$4)',
        [c.id, c.name, c.shortName, c.closingDay]
      );
    }
    for (const p of SEED_PRODUCTS) {
      await pool.query(
        'INSERT INTO products (id, code, name, category) VALUES ($1,$2,$3,$4)',
        [p.id, p.code, p.name, p.category]
      );
    }
    for (const pr of SEED_PRICES) {
      await pool.query(
        'INSERT INTO prices (clinic_id, product_id, price) VALUES ($1,$2,$3)',
        [pr.clinicId, pr.productId, pr.price]
      );
    }
    for (const j of SEED_JOBS) {
      await pool.query(
        `INSERT INTO jobs (id, clinic, patient, set_date, set_time, shiki, gikobutsu, done, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [j.id, j.clinic, j.patient, j.setDate, j.setTime, j.shiki || '', j.gikobutsu || '', j.done, j.createdAt]
      );
    }
    console.log('初期データを登録しました');
  }
}

// ─── 行→オブジェクト変換 ─────────────────────────────────────────────────────

function jobFromRow(r) {
  return {
    id:         r.id,
    clinic:     r.clinic,
    patient:    r.patient,
    setDate:    r.set_date,
    setTime:    r.set_time,
    shiki:      r.shiki,
    gikobutsu:  r.gikobutsu,
    done:       r.done,
    createdAt:  r.created_at,
  };
}

function clinicFromRow(r) {
  return { id: r.id, name: r.name, shortName: r.short_name, closingDay: r.closing_day };
}

function productFromRow(r) {
  return { id: r.id, code: r.code, name: r.name, category: r.category };
}

function priceFromRow(r) {
  return { clinicId: r.clinic_id, productId: r.product_id, price: r.price };
}

function deliveryNoteFromRow(r) {
  return {
    id:               r.id,
    deliveryNo:       r.delivery_no,
    clinicId:         r.clinic_id,
    clinicName:       r.clinic_name,
    deliveryDate:     r.delivery_date,
    rows:             Array.isArray(r.rows) ? r.rows : JSON.parse(r.rows || '[]'),
    paraGram:         parseFloat(r.para_gram) || 0,
    miroGram:         parseFloat(r.miro_gram) || 0,
    subtotalGiko:     parseInt(r.subtotal_giko)     || 0,
    subtotalMaterial: parseInt(r.subtotal_material) || 0,
    tax:              parseInt(r.tax)               || 0,
    total:            parseInt(r.total)             || 0,
    createdAt:        r.created_at,
  };
}

// ─── Jobs API ────────────────────────────────────────────────────────────────

app.get('/api/jobs', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM jobs ORDER BY created_at DESC');
    res.json(rows.map(jobFromRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

app.post('/api/jobs', async (req, res) => {
  const { clinic, patient, setDate, setTime, shiki, gikobutsu } = req.body;
  if (!clinic || !patient || !setDate || !setTime) {
    return res.status(400).json({ error: '必須項目が不足しています' });
  }
  try {
    const dup = await pool.query(
      'SELECT 1 FROM jobs WHERE clinic=$1 AND patient=$2 AND set_date=$3 AND set_time=$4',
      [clinic, patient, setDate, setTime]
    );
    if (dup.rowCount > 0) return res.status(409).json({ error: '重複しています' });

    const id = uuidv4();
    const createdAt = new Date().toISOString();
    await pool.query(
      `INSERT INTO jobs (id, clinic, patient, set_date, set_time, shiki, gikobutsu, done, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, clinic, patient, setDate, setTime, shiki || '', gikobutsu || '', false, createdAt]
    );
    res.status(201).json({ id, clinic, patient, setDate, setTime, shiki: shiki || '', gikobutsu: gikobutsu || '', done: false, createdAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

app.patch('/api/jobs/:id', async (req, res) => {
  const { id } = req.params;
  const { clinic, patient, setDate, setTime, shiki, gikobutsu } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM jobs WHERE id=$1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: '案件が見つかりません' });
    const j = rows[0];
    const result = await pool.query(
      `UPDATE jobs SET clinic=$1, patient=$2, set_date=$3, set_time=$4, shiki=$5, gikobutsu=$6
       WHERE id=$7 RETURNING *`,
      [
        clinic     ?? j.clinic,
        patient    ?? j.patient,
        setDate    ?? j.set_date,
        setTime    ?? j.set_time,
        shiki      ?? j.shiki,
        gikobutsu  ?? j.gikobutsu,
        id,
      ]
    );
    res.json(jobFromRow(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

app.patch('/api/jobs/:id/done', async (req, res) => {
  const { id } = req.params;
  const { done } = req.body;
  try {
    const result = await pool.query(
      'UPDATE jobs SET done=$1 WHERE id=$2 RETURNING *',
      [Boolean(done), id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: '案件が見つかりません' });
    res.json(jobFromRow(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM jobs WHERE id=$1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: '案件が見つかりません' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

// ─── Clinics API ─────────────────────────────────────────────────────────────

app.get('/api/clinics', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clinics ORDER BY id');
    res.json(rows.map(clinicFromRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

// ─── Products API ────────────────────────────────────────────────────────────

app.get('/api/products', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY code');
    res.json(rows.map(productFromRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

// ─── Prices API ──────────────────────────────────────────────────────────────

app.get('/api/prices/:clinicId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM prices WHERE clinic_id=$1 ORDER BY product_id',
      [req.params.clinicId]
    );
    res.json(rows.map(priceFromRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

app.post('/api/prices', async (req, res) => {
  const { clinicId, productId, price } = req.body;
  if (!clinicId || !productId || price == null) {
    return res.status(400).json({ error: '必須項目が不足しています' });
  }
  try {
    await pool.query(
      `INSERT INTO prices (clinic_id, product_id, price) VALUES ($1,$2,$3)
       ON CONFLICT (clinic_id, product_id) DO UPDATE SET price = EXCLUDED.price`,
      [clinicId, productId, price]
    );
    res.json({ clinicId, productId, price });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

// ─── Delivery Notes API ──────────────────────────────────────────────────────

app.get('/api/delivery-notes', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM delivery_notes ORDER BY delivery_no DESC');
    res.json(rows.map(deliveryNoteFromRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

app.get('/api/delivery-notes/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM delivery_notes WHERE id=$1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: '納品書が見つかりません' });
    res.json(deliveryNoteFromRow(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

app.post('/api/delivery-notes', async (req, res) => {
  const { clinicId, clinicName, deliveryDate, rows, paraGram, miroGram,
          subtotalGiko, subtotalMaterial, tax, total } = req.body;
  if (!clinicName || !deliveryDate) {
    return res.status(400).json({ error: '必須項目が不足しています' });
  }
  try {
    const { rows: seq } = await pool.query(
      "SELECT COALESCE(MAX(delivery_no::integer), 0) + 1 AS next_no FROM delivery_notes"
    );
    const deliveryNo = String(seq[0].next_no).padStart(6, '0');
    const id        = uuidv4();
    const createdAt = new Date().toISOString();

    await pool.query(
      `INSERT INTO delivery_notes
         (id, delivery_no, clinic_id, clinic_name, delivery_date,
          rows, para_gram, miro_gram, subtotal_giko, subtotal_material, tax, total, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        id, deliveryNo, clinicId || null, clinicName, deliveryDate,
        JSON.stringify(rows || []),
        paraGram || 0, miroGram || 0,
        subtotalGiko || 0, subtotalMaterial || 0, tax || 0, total || 0,
        createdAt,
      ]
    );
    const { rows: saved } = await pool.query('SELECT * FROM delivery_notes WHERE id=$1', [id]);
    res.status(201).json(deliveryNoteFromRow(saved[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

// ─── SPA fallback ────────────────────────────────────────────────────────────

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ─── 起動 ─────────────────────────────────────────────────────────────────────

initDb()
  .then(() => app.listen(PORT, () => console.log(`APIサーバー起動: http://localhost:${PORT}`)))
  .catch(err => { console.error('DB初期化エラー:', err); process.exit(1); });
