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
  { id: 'p001', code: '001', name: 'CAD／CAM冠Ⅱ',                   category: '保険技工' },
  { id: 'p002', code: '002', name: 'CAD／CAM冠Ⅲ',                   category: '保険技工' },
  { id: 'p003', code: '003', name: 'CAD／CAM冠Ⅳ',                   category: '保険技工' },
  { id: 'p004', code: '004', name: 'CAD／CAM冠Ⅴ',                   category: '保険技工' },
  { id: 'p005', code: '005', name: 'CAD／CAMエンドクラウン',         category: '保険技工' },
  { id: 'p006', code: '006', name: 'CAD／CAMインレー',               category: '保険技工' },
  { id: 'p007', code: '007', name: 'CAD／CAMブロックⅡ',             category: '材料' },
  { id: 'p008', code: '008', name: 'CAD／CAMブロックⅢ',             category: '材料' },
  { id: 'p009', code: '009', name: 'CAD／CAMブロックⅣ',             category: '材料' },
  { id: 'p010', code: '010', name: 'CAD／CAMブロックⅤ',             category: '材料' },
  { id: 'p011', code: '011', name: 'FMC',                            category: '保険技工' },
  { id: 'p012', code: '012', name: 'メタルインレー複雑',             category: '保険技工' },
  { id: 'p013', code: '013', name: 'メタルインレー単純',             category: '保険技工' },
  { id: 'p014', code: '014', name: 'メタルコア',                     category: '保険技工' },
  { id: 'p015', code: '015', name: '硬質レジン前装冠',               category: '保険技工' },
  { id: 'p016', code: '016', name: '硬質レジンフレーム試適',         category: '保険技工' },
  { id: 'p017', code: '017', name: '硬質レジン完成',                 category: '保険技工' },
  { id: 'p018', code: '018', name: 'レジンポンティック',             category: '保険技工' },
  { id: 'p019', code: '019', name: '４／５',                         category: '保険技工' },
  { id: 'p020', code: '020', name: '３／４',                         category: '保険技工' },
  { id: 'p021', code: '021', name: 'ロー着',                         category: '保険技工' },
  { id: 'p022', code: '022', name: 'TEK',                            category: '保険技工' },
  { id: 'p023', code: '023', name: 'ジルコニア',                     category: '自費技工' },
  { id: 'p024', code: '024', name: 'ジルコニア連結',                 category: '自費技工' },
  { id: 'p025', code: '025', name: 'ジルコニア試適',                 category: '自費技工' },
  { id: 'p026', code: '026', name: 'ジルコニア完成',                 category: '自費技工' },
  { id: 'p027', code: '027', name: 'フルジルコニア',                 category: '自費技工' },
  { id: 'p028', code: '028', name: 'ジルコニアインレー',             category: '自費技工' },
  { id: 'p029', code: '029', name: 'メタルボンド',                   category: '自費技工' },
  { id: 'p030', code: '030', name: 'カラーレス',                     category: '自費技工' },
  { id: 'p031', code: '031', name: 'ゴールドFMC',                    category: '自費技工' },
  { id: 'p032', code: '032', name: 'ゴールドインレー',               category: '自費技工' },
  { id: 'p033', code: '033', name: 'コバルトHR',                     category: '自費技工' },
  { id: 'p034', code: '034', name: 'コバルトFMC',                    category: '自費技工' },
  { id: 'p035', code: '035', name: 'コバルトHB',                     category: '自費技工' },
  { id: 'p036', code: '036', name: 'コバルト連結',                   category: '自費技工' },
  { id: 'p037', code: '037', name: 'コバルトFMCフレームミリング',   category: '自費技工' },
  { id: 'p038', code: '038', name: 'コバルトHRフレームミリング',    category: '自費技工' },
  { id: 'p039', code: '039', name: 'コバルトHBフレームミリング',    category: '自費技工' },
  { id: 'p040', code: '040', name: 'セラミックインレー',             category: '自費技工' },
  { id: 'p041', code: '041', name: 'セラミックオンレー',             category: '自費技工' },
  { id: 'p042', code: '042', name: 'インプラント作業用模型',         category: '自費技工' },
  { id: 'p043', code: '043', name: 'インプラントガム模型',           category: '自費技工' },
  { id: 'p044', code: '044', name: '既成アバットメント調整',         category: '自費技工' },
  { id: 'p045', code: '045', name: '既成アバットメント',             category: '自費技工' },
  { id: 'p046', code: '046', name: 'ラボアナログ',                   category: '自費技工' },
  { id: 'p047', code: '047', name: 'インプラント技工',               category: '自費技工' },
  { id: 'p048', code: '048', name: 'チタンカスタムアバットメント',   category: '自費技工' },
  { id: 'p049', code: '049', name: 'ジルコニアアバットメント',       category: '自費技工' },
  { id: 'p050', code: '050', name: 'ナイトガード',                   category: '保険技工' },
  { id: 'p051', code: '051', name: 'スプリント',                     category: '自費技工' },
  { id: 'p052', code: '052', name: 'パラ',                           category: '材料' },
  { id: 'p053', code: '053', name: 'ミロ',                           category: '材料' },
  { id: 'p054', code: '054', name: 'タイプ3',                        category: '材料' },
  { id: 'p055', code: '055', name: 'セミプレシャス',                 category: '材料' },
];

// 0円は「未設定」扱いのため登録しない
const SEED_PRICES = [
  // CAD／CAM冠Ⅱ
  { clinicId: 'c1', productId: 'p001', price:  6390 },
  { clinicId: 'c2', productId: 'p001', price:  4000 },
  { clinicId: 'c3', productId: 'p001', price:  4000 },
  { clinicId: 'c4', productId: 'p001', price:  8400 },
  { clinicId: 'c5', productId: 'p001', price:  8400 },
  { clinicId: 'c6', productId: 'p001', price:  4000 },
  { clinicId: 'c7', productId: 'p001', price:  4000 },
  { clinicId: 'c8', productId: 'p001', price:  5000 },
  // CAD／CAM冠Ⅲ
  { clinicId: 'c1', productId: 'p002', price:  6300 },
  { clinicId: 'c2', productId: 'p002', price:  4000 },
  { clinicId: 'c3', productId: 'p002', price:  4000 },
  { clinicId: 'c4', productId: 'p002', price:  8400 },
  { clinicId: 'c5', productId: 'p002', price:  8400 },
  { clinicId: 'c6', productId: 'p002', price:  5000 },
  { clinicId: 'c7', productId: 'p002', price:  4000 },
  { clinicId: 'c8', productId: 'p002', price:  5000 },
  // CAD／CAM冠Ⅳ
  { clinicId: 'c1', productId: 'p003', price:  6390 },
  { clinicId: 'c2', productId: 'p003', price:  4000 },
  { clinicId: 'c3', productId: 'p003', price:  4000 },
  { clinicId: 'c4', productId: 'p003', price:  8400 },
  { clinicId: 'c5', productId: 'p003', price:  8400 },
  { clinicId: 'c6', productId: 'p003', price:  5620 },
  { clinicId: 'c7', productId: 'p003', price:  6000 },
  { clinicId: 'c8', productId: 'p003', price:  5000 },
  // CAD／CAM冠Ⅴ
  { clinicId: 'c1', productId: 'p004', price:  6390 },
  { clinicId: 'c2', productId: 'p004', price:  4000 },
  { clinicId: 'c3', productId: 'p004', price:  4000 },
  { clinicId: 'c4', productId: 'p004', price:  8400 },
  { clinicId: 'c5', productId: 'p004', price:  8400 },
  { clinicId: 'c6', productId: 'p004', price:  5000 },
  { clinicId: 'c7', productId: 'p004', price:  6000 },
  { clinicId: 'c8', productId: 'p004', price:  6000 },
  // CAD／CAMエンドクラウン
  { clinicId: 'c1', productId: 'p005', price:  7300 },
  { clinicId: 'c2', productId: 'p005', price:  5000 },
  { clinicId: 'c3', productId: 'p005', price:  5000 },
  { clinicId: 'c4', productId: 'p005', price:  9400 },
  { clinicId: 'c5', productId: 'p005', price:  9400 },
  { clinicId: 'c6', productId: 'p005', price:  6000 },
  { clinicId: 'c7', productId: 'p005', price:  5000 },
  { clinicId: 'c8', productId: 'p005', price:  6000 },
  // CAD／CAMインレー
  { clinicId: 'c1', productId: 'p006', price:  4690 },
  { clinicId: 'c2', productId: 'p006', price:  3000 },
  { clinicId: 'c3', productId: 'p006', price:  3000 },
  { clinicId: 'c4', productId: 'p006', price:  5000 },
  { clinicId: 'c5', productId: 'p006', price:  5250 },
  { clinicId: 'c6', productId: 'p006', price:  3000 },
  { clinicId: 'c7', productId: 'p006', price:  3000 },
  { clinicId: 'c8', productId: 'p006', price:  4000 },
  // CAD／CAMブロックⅡ
  { clinicId: 'c1', productId: 'p007', price:  1630 },
  { clinicId: 'c2', productId: 'p007', price:  1630 },
  { clinicId: 'c3', productId: 'p007', price:  1630 },
  { clinicId: 'c4', productId: 'p007', price:  1630 },
  { clinicId: 'c5', productId: 'p007', price:  1630 },
  { clinicId: 'c6', productId: 'p007', price:  1630 },
  { clinicId: 'c7', productId: 'p007', price:  2500 },
  { clinicId: 'c8', productId: 'p007', price:  1630 },
  // CAD／CAMブロックⅢ
  { clinicId: 'c1', productId: 'p008', price:  3160 },
  { clinicId: 'c2', productId: 'p008', price:  3160 },
  { clinicId: 'c3', productId: 'p008', price:  3160 },
  { clinicId: 'c4', productId: 'p008', price:  3160 },
  { clinicId: 'c5', productId: 'p008', price:  3160 },
  { clinicId: 'c6', productId: 'p008', price:  3160 },
  { clinicId: 'c7', productId: 'p008', price:  3500 },
  { clinicId: 'c8', productId: 'p008', price:  3160 },
  // CAD／CAMブロックⅣ
  { clinicId: 'c1', productId: 'p009', price:  3880 },
  { clinicId: 'c2', productId: 'p009', price:  3880 },
  { clinicId: 'c3', productId: 'p009', price:  3880 },
  { clinicId: 'c4', productId: 'p009', price:  3880 },
  { clinicId: 'c5', productId: 'p009', price:  3880 },
  { clinicId: 'c6', productId: 'p009', price:  3880 },
  { clinicId: 'c7', productId: 'p009', price:  3880 },
  { clinicId: 'c8', productId: 'p009', price:  3880 },
  // CAD／CAMブロックⅤ
  { clinicId: 'c1', productId: 'p010', price:  6150 },
  { clinicId: 'c2', productId: 'p010', price:  6150 },
  { clinicId: 'c3', productId: 'p010', price:  6150 },
  { clinicId: 'c4', productId: 'p010', price:  6150 },
  { clinicId: 'c5', productId: 'p010', price:  6150 },
  { clinicId: 'c6', productId: 'p010', price:  6150 },
  { clinicId: 'c7', productId: 'p010', price:  6150 },
  { clinicId: 'c8', productId: 'p010', price:  6150 },
  // FMC
  { clinicId: 'c1', productId: 'p011', price:  1900 },
  { clinicId: 'c2', productId: 'p011', price:  2000 },
  { clinicId: 'c3', productId: 'p011', price:  2000 },
  { clinicId: 'c4', productId: 'p011', price:  2000 },
  { clinicId: 'c5', productId: 'p011', price:  2000 },
  { clinicId: 'c6', productId: 'p011', price:  2000 },
  { clinicId: 'c7', productId: 'p011', price:  2000 },
  { clinicId: 'c8', productId: 'p011', price:  2000 },
  // メタルインレー複雑
  { clinicId: 'c1', productId: 'p012', price:  1300 },
  { clinicId: 'c2', productId: 'p012', price:  1300 },
  { clinicId: 'c3', productId: 'p012', price:  1500 },
  { clinicId: 'c4', productId: 'p012', price:  1500 },
  { clinicId: 'c5', productId: 'p012', price:  1200 },
  { clinicId: 'c6', productId: 'p012', price:  1500 },
  { clinicId: 'c7', productId: 'p012', price:  1500 },
  { clinicId: 'c8', productId: 'p012', price:  1500 },
  // メタルインレー単純
  { clinicId: 'c1', productId: 'p013', price:  1000 },
  { clinicId: 'c2', productId: 'p013', price:  1000 },
  { clinicId: 'c3', productId: 'p013', price:  1300 },
  { clinicId: 'c4', productId: 'p013', price:  1300 },
  { clinicId: 'c5', productId: 'p013', price:  1100 },
  { clinicId: 'c6', productId: 'p013', price:  1300 },
  { clinicId: 'c7', productId: 'p013', price:  1300 },
  { clinicId: 'c8', productId: 'p013', price:  1300 },
  // メタルコア
  { clinicId: 'c1', productId: 'p014', price:  1000 },
  { clinicId: 'c2', productId: 'p014', price:   800 },
  { clinicId: 'c3', productId: 'p014', price:  1000 },
  { clinicId: 'c4', productId: 'p014', price:  1000 },
  { clinicId: 'c5', productId: 'p014', price:  1000 },
  { clinicId: 'c6', productId: 'p014', price:  1000 },
  { clinicId: 'c7', productId: 'p014', price:  1000 },
  { clinicId: 'c8', productId: 'p014', price:  1000 },
  // 硬質レジン前装冠
  { clinicId: 'c1', productId: 'p015', price:  4000 },
  { clinicId: 'c2', productId: 'p015', price:  4000 },
  { clinicId: 'c3', productId: 'p015', price:  4500 },
  { clinicId: 'c4', productId: 'p015', price:  4500 },
  { clinicId: 'c5', productId: 'p015', price:  4200 },
  { clinicId: 'c6', productId: 'p015', price:  4500 },
  { clinicId: 'c7', productId: 'p015', price:  4500 },
  { clinicId: 'c8', productId: 'p015', price:  4500 },
  // 硬質レジンフレーム試適（吉岡・きむらのみ）
  { clinicId: 'c1', productId: 'p016', price:  2400 },
  { clinicId: 'c7', productId: 'p016', price:  2600 },
  // 硬質レジン完成（吉岡・きむらのみ）
  { clinicId: 'c1', productId: 'p017', price:  1600 },
  { clinicId: 'c7', productId: 'p017', price:  1400 },
  // レジンポンティック
  { clinicId: 'c1', productId: 'p018', price:  2300 },
  { clinicId: 'c2', productId: 'p018', price:  2500 },
  { clinicId: 'c3', productId: 'p018', price:  2500 },
  { clinicId: 'c4', productId: 'p018', price:  2500 },
  { clinicId: 'c5', productId: 'p018', price:  2300 },
  { clinicId: 'c6', productId: 'p018', price:  2500 },
  { clinicId: 'c7', productId: 'p018', price:  2500 },
  { clinicId: 'c8', productId: 'p018', price:  2500 },
  // ４／５
  { clinicId: 'c1', productId: 'p019', price:  1700 },
  { clinicId: 'c2', productId: 'p019', price:  1700 },
  { clinicId: 'c3', productId: 'p019', price:  1800 },
  { clinicId: 'c4', productId: 'p019', price:  1800 },
  { clinicId: 'c5', productId: 'p019', price:  1800 },
  { clinicId: 'c6', productId: 'p019', price:  1800 },
  { clinicId: 'c7', productId: 'p019', price:  1800 },
  { clinicId: 'c8', productId: 'p019', price:  1800 },
  // ３／４
  { clinicId: 'c1', productId: 'p020', price:  1700 },
  { clinicId: 'c2', productId: 'p020', price:  1700 },
  { clinicId: 'c3', productId: 'p020', price:  1800 },
  { clinicId: 'c4', productId: 'p020', price:  1800 },
  { clinicId: 'c5', productId: 'p020', price:  1800 },
  { clinicId: 'c6', productId: 'p020', price:  1800 },
  { clinicId: 'c7', productId: 'p020', price:  1800 },
  { clinicId: 'c8', productId: 'p020', price:  1800 },
  // ロー着
  { clinicId: 'c1', productId: 'p021', price:   950 },
  { clinicId: 'c2', productId: 'p021', price:   950 },
  { clinicId: 'c3', productId: 'p021', price:  1000 },
  { clinicId: 'c4', productId: 'p021', price:  1000 },
  { clinicId: 'c5', productId: 'p021', price:   900 },
  { clinicId: 'c6', productId: 'p021', price:  1000 },
  { clinicId: 'c7', productId: 'p021', price:  1000 },
  { clinicId: 'c8', productId: 'p021', price:  1000 },
  // TEK
  { clinicId: 'c1', productId: 'p022', price:   800 },
  { clinicId: 'c2', productId: 'p022', price:  1000 },
  { clinicId: 'c3', productId: 'p022', price:  1000 },
  { clinicId: 'c4', productId: 'p022', price:  1000 },
  { clinicId: 'c5', productId: 'p022', price:  1000 },
  { clinicId: 'c6', productId: 'p022', price:   800 },
  { clinicId: 'c7', productId: 'p022', price:   800 },
  { clinicId: 'c8', productId: 'p022', price:   800 },
  // ジルコニア
  { clinicId: 'c1', productId: 'p023', price: 23000 },
  { clinicId: 'c2', productId: 'p023', price: 20000 },
  { clinicId: 'c3', productId: 'p023', price: 20000 },
  { clinicId: 'c4', productId: 'p023', price: 23000 },
  { clinicId: 'c5', productId: 'p023', price: 21000 },
  { clinicId: 'c6', productId: 'p023', price: 23000 },
  { clinicId: 'c7', productId: 'p023', price: 23000 },
  { clinicId: 'c8', productId: 'p023', price: 24000 },
  // ジルコニア連結
  { clinicId: 'c1', productId: 'p024', price:  3000 },
  { clinicId: 'c2', productId: 'p024', price:  3000 },
  { clinicId: 'c3', productId: 'p024', price:  3000 },
  { clinicId: 'c4', productId: 'p024', price:  3000 },
  { clinicId: 'c5', productId: 'p024', price:  3000 },
  { clinicId: 'c6', productId: 'p024', price:  3000 },
  { clinicId: 'c7', productId: 'p024', price:  3000 },
  { clinicId: 'c8', productId: 'p024', price:  3000 },
  // ジルコニア試適（織田・高尾は未設定）
  { clinicId: 'c1', productId: 'p025', price: 13000 },
  { clinicId: 'c2', productId: 'p025', price: 13000 },
  { clinicId: 'c4', productId: 'p025', price: 13000 },
  { clinicId: 'c5', productId: 'p025', price: 13000 },
  { clinicId: 'c6', productId: 'p025', price: 13000 },
  { clinicId: 'c7', productId: 'p025', price: 13000 },
  // ジルコニア完成（織田・高尾は未設定）
  { clinicId: 'c1', productId: 'p026', price: 10000 },
  { clinicId: 'c2', productId: 'p026', price: 10000 },
  { clinicId: 'c4', productId: 'p026', price: 10000 },
  { clinicId: 'c5', productId: 'p026', price: 10000 },
  { clinicId: 'c6', productId: 'p026', price: 10000 },
  { clinicId: 'c7', productId: 'p026', price: 10000 },
  // フルジルコニア
  { clinicId: 'c1', productId: 'p027', price: 16000 },
  { clinicId: 'c2', productId: 'p027', price: 16000 },
  { clinicId: 'c3', productId: 'p027', price: 16000 },
  { clinicId: 'c4', productId: 'p027', price: 16000 },
  { clinicId: 'c5', productId: 'p027', price: 15000 },
  { clinicId: 'c6', productId: 'p027', price: 16000 },
  { clinicId: 'c7', productId: 'p027', price: 16000 },
  { clinicId: 'c8', productId: 'p027', price: 11000 },
  // ジルコニアインレー（きむらのみ）
  { clinicId: 'c7', productId: 'p028', price: 11000 },
  // メタルボンド（高尾は未設定）
  { clinicId: 'c1', productId: 'p029', price: 12000 },
  { clinicId: 'c2', productId: 'p029', price: 10000 },
  { clinicId: 'c3', productId: 'p029', price: 10000 },
  { clinicId: 'c4', productId: 'p029', price: 15000 },
  { clinicId: 'c5', productId: 'p029', price: 12000 },
  { clinicId: 'c6', productId: 'p029', price: 12000 },
  { clinicId: 'c7', productId: 'p029', price: 12000 },
  // カラーレス（高尾は未設定）
  { clinicId: 'c1', productId: 'p030', price:  2000 },
  { clinicId: 'c2', productId: 'p030', price:  2000 },
  { clinicId: 'c3', productId: 'p030', price:  2000 },
  { clinicId: 'c4', productId: 'p030', price:  3000 },
  { clinicId: 'c5', productId: 'p030', price:  2000 },
  { clinicId: 'c6', productId: 'p030', price:  2000 },
  { clinicId: 'c7', productId: 'p030', price:  2000 },
  // ゴールドFMC（高尾は未設定）
  { clinicId: 'c1', productId: 'p031', price:  3000 },
  { clinicId: 'c2', productId: 'p031', price:  3000 },
  { clinicId: 'c3', productId: 'p031', price:  3000 },
  { clinicId: 'c4', productId: 'p031', price:  3000 },
  { clinicId: 'c5', productId: 'p031', price:  3000 },
  { clinicId: 'c6', productId: 'p031', price:  3000 },
  { clinicId: 'c7', productId: 'p031', price:  3000 },
  // ゴールドインレー（高尾は未設定）
  { clinicId: 'c1', productId: 'p032', price:  2500 },
  { clinicId: 'c2', productId: 'p032', price:  2500 },
  { clinicId: 'c3', productId: 'p032', price:  2500 },
  { clinicId: 'c4', productId: 'p032', price:  2500 },
  { clinicId: 'c5', productId: 'p032', price:  2500 },
  { clinicId: 'c6', productId: 'p032', price:  2500 },
  { clinicId: 'c7', productId: 'p032', price:  2500 },
  // コバルトHR（吉岡〜田伏のみ）
  { clinicId: 'c1', productId: 'p033', price:  7500 },
  { clinicId: 'c2', productId: 'p033', price:  7500 },
  { clinicId: 'c3', productId: 'p033', price:  7500 },
  { clinicId: 'c4', productId: 'p033', price:  7500 },
  { clinicId: 'c5', productId: 'p033', price:  7500 },
  // コバルトFMC（吉岡〜田伏のみ）
  { clinicId: 'c1', productId: 'p034', price:  4500 },
  { clinicId: 'c2', productId: 'p034', price:  4500 },
  { clinicId: 'c3', productId: 'p034', price:  4500 },
  { clinicId: 'c4', productId: 'p034', price:  4500 },
  { clinicId: 'c5', productId: 'p034', price:  4500 },
  // コバルトHB（吉岡〜田伏のみ）
  { clinicId: 'c1', productId: 'p035', price:  9000 },
  { clinicId: 'c2', productId: 'p035', price:  9000 },
  { clinicId: 'c3', productId: 'p035', price:  9000 },
  { clinicId: 'c4', productId: 'p035', price:  9000 },
  { clinicId: 'c5', productId: 'p035', price:  9000 },
  // コバルト連結（吉岡〜田伏のみ）
  { clinicId: 'c1', productId: 'p036', price:  1000 },
  { clinicId: 'c2', productId: 'p036', price:  1000 },
  { clinicId: 'c3', productId: 'p036', price:  1000 },
  { clinicId: 'c4', productId: 'p036', price:  1000 },
  { clinicId: 'c5', productId: 'p036', price:  1000 },
  // コバルトFMCフレームミリング（吉岡〜田伏のみ）
  { clinicId: 'c1', productId: 'p037', price:  7000 },
  { clinicId: 'c2', productId: 'p037', price:  7000 },
  { clinicId: 'c3', productId: 'p037', price:  7000 },
  { clinicId: 'c4', productId: 'p037', price:  7000 },
  { clinicId: 'c5', productId: 'p037', price:  7000 },
  // コバルトHRフレームミリング（吉岡〜田伏のみ）
  { clinicId: 'c1', productId: 'p038', price: 10000 },
  { clinicId: 'c2', productId: 'p038', price: 10000 },
  { clinicId: 'c3', productId: 'p038', price: 10000 },
  { clinicId: 'c4', productId: 'p038', price: 10000 },
  { clinicId: 'c5', productId: 'p038', price: 10000 },
  // コバルトHBフレームミリング（吉岡〜田伏のみ）
  { clinicId: 'c1', productId: 'p039', price: 11500 },
  { clinicId: 'c2', productId: 'p039', price: 11500 },
  { clinicId: 'c3', productId: 'p039', price: 11500 },
  { clinicId: 'c4', productId: 'p039', price: 11500 },
  { clinicId: 'c5', productId: 'p039', price: 11500 },
  // セラミックインレー（吉岡〜クロイのみ）
  { clinicId: 'c1', productId: 'p040', price: 13000 },
  { clinicId: 'c2', productId: 'p040', price: 13000 },
  { clinicId: 'c3', productId: 'p040', price: 13000 },
  { clinicId: 'c4', productId: 'p040', price: 13000 },
  { clinicId: 'c5', productId: 'p040', price: 13000 },
  { clinicId: 'c6', productId: 'p040', price: 13000 },
  // セラミックオンレー（吉岡〜クロイのみ）
  { clinicId: 'c1', productId: 'p041', price: 15000 },
  { clinicId: 'c2', productId: 'p041', price: 15000 },
  { clinicId: 'c3', productId: 'p041', price: 15000 },
  { clinicId: 'c4', productId: 'p041', price: 15000 },
  { clinicId: 'c5', productId: 'p041', price: 15000 },
  { clinicId: 'c6', productId: 'p041', price: 15000 },
  // インプラント作業用模型（織田・田伏のみ）
  { clinicId: 'c3', productId: 'p042', price:  1000 },
  { clinicId: 'c5', productId: 'p042', price:  1000 },
  // インプラントガム模型（織田・田伏のみ）
  { clinicId: 'c3', productId: 'p043', price:  1000 },
  { clinicId: 'c5', productId: 'p043', price:  1000 },
  // 既成アバットメント調整（織田のみ）
  { clinicId: 'c3', productId: 'p044', price:  3000 },
  // 既成アバットメント（織田のみ）
  { clinicId: 'c3', productId: 'p045', price: 16000 },
  // ラボアナログ（織田のみ）
  { clinicId: 'c3', productId: 'p046', price:  3500 },
  // インプラント技工（くいなばし・三村のみ）
  { clinicId: 'c2', productId: 'p047', price:  5000 },
  { clinicId: 'c4', productId: 'p047', price:  5000 },
  // チタンカスタムアバットメント（くいなばし・田伏のみ）
  { clinicId: 'c2', productId: 'p048', price: 23000 },
  { clinicId: 'c5', productId: 'p048', price: 23000 },
  // ジルコニアアバットメント（くいなばし・田伏のみ）
  { clinicId: 'c2', productId: 'p049', price: 29000 },
  { clinicId: 'c5', productId: 'p049', price: 29000 },
  // ナイトガード（高尾のみ）
  { clinicId: 'c8', productId: 'p050', price:  4000 },
  // スプリント（高尾のみ）
  { clinicId: 'c8', productId: 'p051', price:  7500 },
  // パラ・ミロ・タイプ3・セミプレシャスは全医院0円のため登録なし
];

const SEED_JOBS = [
  { id: '046fc02b-8d02-4aba-abd5-abc01302eb10', clinic: '田伏歯科医院',               patient: '松本 光正',   setDate: '2026-04-22', setTime: '10:30', done: true,  createdAt: '2026-04-26T14:09:32.894Z' },
  { id: '3ef9eb49-7661-452a-ab15-9ae21d7223c7', clinic: 'クロイ歯科医院',              patient: '田中 茂行',   setDate: '2026-04-27', setTime: '09:00', done: false, createdAt: '2026-04-26T14:09:32.902Z' },
  { id: 'c994f223-e4b1-4ce6-ba98-dd9b1f630c1f', clinic: '吉岡歯科医院',              patient: '岡田 三奈',   setDate: '2026-04-21', setTime: '07:00', done: true,  createdAt: '2026-04-26T14:09:32.908Z' },
  { id: '44688d21-bb82-4944-b05a-cac0c1435740', clinic: 'くいなばしデンタルクリニック', patient: '田路 真柘美', setDate: '2026-04-21', setTime: '16:30', done: true,  createdAt: '2026-04-26T14:09:32.913Z' },
  { id: '3620f929-2162-492e-90f1-766bd52d7aca', clinic: 'きむら歯科医院',             patient: '林山 安美',   setDate: '2026-04-21', setTime: '11:00', done: true,  createdAt: '2026-04-26T14:09:32.918Z' },
  { id: '49b6fc99-292a-4868-a13f-3d008d225532', clinic: '吉岡歯科医院',              patient: '土井 居子',   setDate: '2026-04-22', setTime: '11:00', done: true,  createdAt: '2026-04-26T14:09:32.923Z' },
  { id: 'b67f28a2-f598-4bb8-8043-b7cadfed8fa0', clinic: 'クロイ歯科医院',              patient: '大西 寛子',   setDate: '2026-04-21', setTime: '17:30', done: true,  createdAt: '2026-04-26T14:09:32.928Z' },
  { id: '5432c7b8-13fb-46e9-a8ee-3958f1a95344', clinic: '高尾歯科医院',              patient: '白石',        setDate: '2026-04-21', setTime: '10:00', done: true,  createdAt: '2026-04-26T14:09:32.933Z' },
  { id: 'f87c898b-38e3-425e-830e-58710ec60cd0', clinic: 'クロイ歯科医院',              patient: '西台 雅子',   setDate: '2026-04-22', setTime: '11:00', done: true,  createdAt: '2026-04-26T14:09:32.937Z' },
  { id: 'ce52e055-475a-4664-b4e4-e1f302f143d7', clinic: 'クロイ歯科医院',              patient: '米田 尚且',   setDate: '2026-04-22', setTime: '06:00', done: true,  createdAt: '2026-04-26T14:09:32.942Z' },
  { id: '6541de7b-3065-4fdd-8ec4-ce338f3bf559', clinic: 'クロイ歯科医院',              patient: '石井 貞温',   setDate: '2026-04-24', setTime: '17:45', done: true,  createdAt: '2026-04-26T14:09:32.947Z' },
  { id: '9b81e1b9-d255-4f40-91c0-62b473d395e7', clinic: '三村歯科医院',              patient: '仲田 耕平介', setDate: '2026-04-25', setTime: '09:00', done: true,  createdAt: '2026-04-26T14:09:32.951Z' },
  { id: 'd7733b48-d879-421f-bf90-e130caccefdc', clinic: '吉岡歯科医院',              patient: '中田 里美',   setDate: '2026-04-24', setTime: '17:30', done: true,  createdAt: '2026-04-26T14:09:32.955Z' },
  { id: '8d775965-3b85-4279-963f-368ef3f8aabd', clinic: '田伏歯科医院',              patient: '石井 明',     setDate: '2026-04-24', setTime: '09:00', done: true,  createdAt: '2026-04-26T14:09:32.959Z' },
  { id: 'a4913b56-8304-4b26-b31a-2b9006251227', clinic: '吉岡歯科医院',              patient: '六布 智子',   setDate: '2026-04-27', setTime: '07:00', done: false, createdAt: '2026-04-26T14:09:32.965Z' },
  { id: '018a6ed9-9bd8-41a3-96fd-445caf2f30d3', clinic: 'きむら歯科医院',            patient: '日原 慧大',   setDate: '2026-04-24', setTime: '16:00', done: true,  createdAt: '2026-04-26T14:09:32.969Z' },
  { id: '9cc6c448-e04b-4ed4-bb9e-55be39936cf6', clinic: '吉岡歯科医院',              patient: '宮里 篤志',   setDate: '2026-04-22', setTime: '18:00', done: true,  createdAt: '2026-04-26T14:09:32.973Z' },
  { id: 'e57f2fe7-6c6e-443b-91b2-fb02ddab2db5', clinic: '高尾歯科医院',              patient: '三島',        setDate: '2026-05-01', setTime: '10:00', done: false, createdAt: '2026-04-26T14:09:32.977Z' },
  { id: 'a51ade14-70cb-4cd7-adee-78d927ebcd5e', clinic: 'くいなばしデンタルクリニック', patient: '山田 友美',  setDate: '2026-04-22', setTime: '19:00', done: true,  createdAt: '2026-04-26T14:09:32.982Z' },
  { id: '965a2a5b-44e0-4038-83c7-589fa7c88431', clinic: '吉岡歯科医院',              patient: '杉津 知永',   setDate: '2026-05-13', setTime: '16:00', done: false, createdAt: '2026-04-26T14:09:32.986Z' },
  { id: '3ae4646e-b291-4cf2-8f07-5059c9fc8b8c', clinic: 'クロイ歯科医院',              patient: '渡邊 美智子', setDate: '2026-05-01', setTime: '15:00', done: false, createdAt: '2026-04-26T14:09:32.991Z' },
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
      patient_name      TEXT NOT NULL DEFAULT '',
      shiki             TEXT NOT NULL DEFAULT '',
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
  // 既存テーブルへのカラム追加（idempotent）
  await pool.query(`ALTER TABLE delivery_notes ADD COLUMN IF NOT EXISTS patient_name TEXT NOT NULL DEFAULT ''`);
  await pool.query(`ALTER TABLE delivery_notes ADD COLUMN IF NOT EXISTS shiki TEXT NOT NULL DEFAULT ''`);
  await pool.query(`ALTER TABLE clinics ADD COLUMN IF NOT EXISTS bank_info TEXT NOT NULL DEFAULT ''`);
  await pool.query(`ALTER TABLE clinics ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT ''`);
  await pool.query(`ALTER TABLE clinics ADD COLUMN IF NOT EXISTS postal_code TEXT NOT NULL DEFAULT ''`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS metal_types (
      id   SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS metal_stocks (
      id               SERIAL PRIMARY KEY,
      date             DATE NOT NULL,
      clinic_name      TEXT,
      metal_type       TEXT NOT NULL,
      transaction_type TEXT NOT NULL,
      weight           DECIMAL(8,2) NOT NULL,
      note             TEXT,
      created_at       TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    INSERT INTO metal_types (name) VALUES ('パラジウム'),('ミロ'),('金')
    ON CONFLICT (name) DO NOTHING
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_info (
      id         SERIAL PRIMARY KEY,
      bank_info  TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    ALTER TABLE company_info ADD COLUMN IF NOT EXISTS base_up_price INTEGER DEFAULT 150
  `);
  await pool.query(`
    INSERT INTO company_info (id, bank_info) VALUES (1, '')
    ON CONFLICT (id) DO NOTHING
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoice_history (
      id            SERIAL PRIMARY KEY,
      clinic_id     TEXT,
      year          INTEGER,
      month         INTEGER,
      total_amount  INTEGER,
      prev_amount   INTEGER,
      paid_amount   INTEGER,
      adjust_amount INTEGER DEFAULT 0,
      carry_over    INTEGER,
      created_at    TIMESTAMP DEFAULT NOW(),
      UNIQUE(clinic_id, year, month)
    )
  `);

  await pool.query(`
    ALTER TABLE metal_stocks ADD COLUMN IF NOT EXISTS delivery_note_id TEXT
  `);

  await pool.query(`
    ALTER TABLE delivery_notes ADD COLUMN IF NOT EXISTS base_up_support INTEGER NOT NULL DEFAULT 0
  `);
  await pool.query(`
    ALTER TABLE delivery_notes ADD COLUMN IF NOT EXISTS base_up_count INTEGER NOT NULL DEFAULT 0
  `);

  await pool.query(`
    ALTER TABLE invoice_history ADD COLUMN IF NOT EXISTS notes_snapshot JSONB DEFAULT '[]'
  `);
  await pool.query(`
    ALTER TABLE invoice_history ADD COLUMN IF NOT EXISTS grand_total INTEGER DEFAULT 0
  `);
  await pool.query(`
    ALTER TABLE invoice_history ADD COLUMN IF NOT EXISTS bank_info TEXT DEFAULT ''
  `);

  // 医院名の表記揺れを修正（既存DBデータ対応）
  await pool.query("UPDATE jobs SET clinic = 'クロイ歯科医院' WHERE clinic = 'クロイD・C'");

  // 製品・料金表を常に最新シードデータで同期（差し替え）
  await pool.query('DELETE FROM prices');
  await pool.query('DELETE FROM products');
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
  console.log(`製品・料金表を更新しました（製品${SEED_PRODUCTS.length}件 / 料金${SEED_PRICES.length}件）`);

  // 初回のみシード（clinicsが空なら clinics・jobs に初期データを投入）
  const { rows } = await pool.query('SELECT COUNT(*)::int AS cnt FROM clinics');
  if (rows[0].cnt === 0) {
    for (const c of SEED_CLINICS) {
      await pool.query(
        'INSERT INTO clinics (id, name, short_name, closing_day) VALUES ($1,$2,$3,$4)',
        [c.id, c.name, c.shortName, c.closingDay]
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
  return {
    id: r.id, name: r.name, shortName: r.short_name, closingDay: r.closing_day,
    bankInfo: r.bank_info || '', address: r.address || '', postalCode: r.postal_code || '',
  };
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
    patientName:      r.patient_name || '',
    shiki:            r.shiki || '',
    rows:             Array.isArray(r.rows) ? r.rows : JSON.parse(r.rows || '[]'),
    paraGram:         parseFloat(r.para_gram) || 0,
    miroGram:         parseFloat(r.miro_gram) || 0,
    subtotalGiko:     parseInt(r.subtotal_giko)     || 0,
    subtotalMaterial: parseInt(r.subtotal_material) || 0,
    tax:              parseInt(r.tax)               || 0,
    total:            parseInt(r.total)             || 0,
    baseUpSupport:    parseInt(r.base_up_support)   || 0,
    baseUpCount:      parseInt(r.base_up_count)     || 0,
    createdAt:        r.created_at,
  };
}

// ─── Jobs API ────────────────────────────────────────────────────────────────

app.get('/api/jobs', async (req, res) => {
  try {
    const { clinic, date, done } = req.query;
    const conditions = [];
    const params = [];

    if (clinic) {
      params.push(clinic);
      conditions.push(`clinic = $${params.length}`);
    }
    if (date) {
      params.push(date);
      conditions.push(`set_date::date = $${params.length}`);
    }
    if (done !== undefined) {
      params.push(done === 'true');
      conditions.push(`done = $${params.length}`);
    }

    const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT * FROM jobs${where} ORDER BY created_at DESC`,
      params
    );
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
    // 同一医院・日付・患者名の重複は最新1件のみ返す
    const { rows } = await pool.query(`
      SELECT * FROM (
        SELECT DISTINCT ON (
          clinic_name, delivery_date,
          COALESCE(NULLIF(patient_name, ''), id)
        ) *
        FROM delivery_notes
        ORDER BY
          clinic_name, delivery_date,
          COALESCE(NULLIF(patient_name, ''), id),
          created_at DESC
      ) deduped
      ORDER BY delivery_no DESC
    `);
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
  const { clinicId, clinicName, deliveryDate, patientName, shiki,
          rows, paraGram, miroGram,
          subtotalGiko, subtotalMaterial, tax, total, baseUpSupport, baseUpCount,
          jobId } = req.body;
  if (!clinicName || !deliveryDate) {
    return res.status(400).json({ error: '必須項目が不足しています' });
  }
  try {
    // 同一医院・日付・患者名が既存なら UPDATE（upsert）
    if (patientName) {
      const dup = await pool.query(
        'SELECT id FROM delivery_notes WHERE clinic_name=$1 AND delivery_date=$2 AND patient_name=$3',
        [clinicName, deliveryDate, patientName]
      );
      if (dup.rowCount > 0) {
        const dupId = dup.rows[0].id;
        const result = await pool.query(
          `UPDATE delivery_notes SET
             clinic_id=$1, shiki=$2,
             rows=$3, para_gram=$4, miro_gram=$5,
             subtotal_giko=$6, subtotal_material=$7, tax=$8, total=$9,
             base_up_support=$10, base_up_count=$11
           WHERE id=$12 RETURNING *`,
          [
            clinicId || null, shiki || '',
            JSON.stringify(rows || []),
            paraGram || 0, miroGram || 0,
            subtotalGiko || 0, subtotalMaterial || 0, tax || 0, total || 0,
            baseUpSupport || 0, baseUpCount || 0,
            dupId,
          ]
        );
        await syncMetalStocksForNote(dupId, deliveryDate, clinicName, paraGram || 0, miroGram || 0);
        return res.json(deliveryNoteFromRow(result.rows[0]));
      }
    }

    // 新規作成
    const { rows: seq } = await pool.query(
      "SELECT COALESCE(MAX(delivery_no::integer), 0) + 1 AS next_no FROM delivery_notes"
    );
    const deliveryNo = String(seq[0].next_no).padStart(6, '0');
    const id        = uuidv4();
    const createdAt = new Date().toISOString();

    await pool.query(
      `INSERT INTO delivery_notes
         (id, delivery_no, clinic_id, clinic_name, delivery_date,
          patient_name, shiki,
          rows, para_gram, miro_gram, subtotal_giko, subtotal_material, tax, total,
          base_up_support, base_up_count, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        id, deliveryNo, clinicId || null, clinicName, deliveryDate,
        patientName || '', shiki || '',
        JSON.stringify(rows || []),
        paraGram || 0, miroGram || 0,
        subtotalGiko || 0, subtotalMaterial || 0, tax || 0, total || 0,
        baseUpSupport || 0, baseUpCount || 0,
        createdAt,
      ]
    );
    const { rows: saved } = await pool.query('SELECT * FROM delivery_notes WHERE id=$1', [id]);
    await syncMetalStocksForNote(id, deliveryDate, clinicName, paraGram || 0, miroGram || 0);
    // 対応する指示書の医院名・患者名も更新
    if (jobId) {
      await pool.query(
        'UPDATE jobs SET clinic=$1, patient=$2 WHERE id=$3',
        [clinicName, patientName || '', jobId]
      );
    }
    res.status(201).json(deliveryNoteFromRow(saved[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

app.put('/api/delivery-notes/:id', async (req, res) => {
  const { id } = req.params;
  const { clinicId, clinicName, deliveryDate, patientName, shiki,
          rows, paraGram, miroGram,
          subtotalGiko, subtotalMaterial, tax, total, baseUpSupport, baseUpCount } = req.body;
  if (!clinicName || !deliveryDate) {
    return res.status(400).json({ error: '必須項目が不足しています' });
  }
  try {
    const result = await pool.query(
      `UPDATE delivery_notes SET
         clinic_id=$1, clinic_name=$2, delivery_date=$3,
         patient_name=$4, shiki=$5,
         rows=$6, para_gram=$7, miro_gram=$8,
         subtotal_giko=$9, subtotal_material=$10, tax=$11, total=$12,
         base_up_support=$13, base_up_count=$14
       WHERE id=$15 RETURNING *`,
      [
        clinicId || null, clinicName, deliveryDate,
        patientName || '', shiki || '',
        JSON.stringify(rows || []),
        paraGram || 0, miroGram || 0,
        subtotalGiko || 0, subtotalMaterial || 0, tax || 0, total || 0,
        baseUpSupport || 0, baseUpCount || 0,
        id,
      ]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: '納品書が見つかりません' });
    await syncMetalStocksForNote(id, deliveryDate, clinicName, paraGram || 0, miroGram || 0);
    res.json(deliveryNoteFromRow(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

app.delete('/api/delivery-notes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM metal_stocks WHERE delivery_note_id=$1', [req.params.id]);
    const result = await pool.query('DELETE FROM delivery_notes WHERE id=$1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: '納品書が見つかりません' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

// ─── Metal Stock 連動ヘルパー ─────────────────────────────────────────────────

async function syncMetalStocksForNote(deliveryNoteId, deliveryDate, clinicName, paraGram, miroGram) {
  await pool.query('DELETE FROM metal_stocks WHERE delivery_note_id=$1', [deliveryNoteId]);
  if (parseFloat(paraGram) > 0) {
    await pool.query(
      `INSERT INTO metal_stocks (date, clinic_name, metal_type, transaction_type, weight, delivery_note_id)
       VALUES ($1, $2, 'パラジウム', '使用', $3, $4)`,
      [deliveryDate, clinicName || null, paraGram, deliveryNoteId]
    );
  }
  if (parseFloat(miroGram) > 0) {
    await pool.query(
      `INSERT INTO metal_stocks (date, clinic_name, metal_type, transaction_type, weight, delivery_note_id)
       VALUES ($1, $2, 'ミロ', '使用', $3, $4)`,
      [deliveryDate, clinicName || null, miroGram, deliveryNoteId]
    );
  }
}

// ─── Metal Types API ─────────────────────────────────────────────────────────

app.get('/api/metal-types', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM metal_types ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

app.post('/api/metal-types', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: '名前は必須です' });
    const { rows } = await pool.query(
      'INSERT INTO metal_types (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING *',
      [name]
    );
    if (rows.length === 0) return res.status(409).json({ error: '既に存在します' });
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

app.delete('/api/metal-types/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM metal_types WHERE id=$1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: '見つかりません' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

// ─── Metal Stocks API ─────────────────────────────────────────────────────────

app.get('/api/metal-stocks/summary', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        clinic_name,
        metal_type,
        SUM(CASE WHEN transaction_type = '預かり' THEN weight ELSE 0 END) -
        SUM(CASE WHEN transaction_type = '使用'   THEN weight ELSE 0 END) -
        SUM(CASE WHEN transaction_type = '返却'   THEN weight ELSE 0 END) AS balance
      FROM metal_stocks
      GROUP BY clinic_name, metal_type
    `);
    res.json(rows.map(r => ({
      clinicName: r.clinic_name,
      metalType:  r.metal_type,
      balance:    parseFloat(r.balance),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

app.get('/api/metal-stocks', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM metal_stocks ORDER BY date DESC, created_at DESC');
    res.json(rows.map(r => ({
      id:              r.id,
      date:            r.date,
      clinicName:      r.clinic_name,
      metalType:       r.metal_type,
      transactionType: r.transaction_type,
      weight:          parseFloat(r.weight),
      note:            r.note,
      createdAt:       r.created_at,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

app.post('/api/metal-stocks', async (req, res) => {
  try {
    const { date, clinicName, metalType, transactionType, weight, note } = req.body;
    if (!date || !metalType || !transactionType || weight == null) {
      return res.status(400).json({ error: '必須項目が不足しています' });
    }
    const { rows } = await pool.query(
      `INSERT INTO metal_stocks (date, clinic_name, metal_type, transaction_type, weight, note)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [date, clinicName || null, metalType, transactionType, weight, note || null]
    );
    const r = rows[0];
    res.status(201).json({
      id: r.id, date: r.date, clinicName: r.clinic_name,
      metalType: r.metal_type, transactionType: r.transaction_type,
      weight: parseFloat(r.weight), note: r.note, createdAt: r.created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

app.delete('/api/metal-stocks/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM metal_stocks WHERE id=$1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: '見つかりません' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

// ─── Invoice API ─────────────────────────────────────────────────────────────

app.get('/api/invoices', async (req, res) => {
  try {
    const { clinicId, year, month } = req.query;
    if (!clinicId || !year || !month) {
      return res.status(400).json({ error: 'clinicId, year, month は必須です' });
    }
    const y = parseInt(year), m = parseInt(month);

    // 締め日ルール: 前月21日〜当月20日
    const pad = n => String(n).padStart(2, '0');
    const prevY = m === 1 ? y - 1 : y;
    const prevM = m === 1 ? 12 : m - 1;
    const dateFrom = `${prevY}-${pad(prevM)}-21`;
    const dateTo   = `${y}-${pad(m)}-20`;

    // 医院情報取得
    const clinicRes = await pool.query('SELECT * FROM clinics WHERE id=$1', [clinicId]);
    if (clinicRes.rowCount === 0) return res.status(404).json({ error: '医院が見つかりません' });
    const clinic = clinicFromRow(clinicRes.rows[0]);

    // 対象期間の納品書取得（delivery_date は TEXT 型）
    const { rows } = await pool.query(
      `SELECT * FROM delivery_notes
       WHERE clinic_id = $1
         AND delivery_date >= $2
         AND delivery_date <= $3
       ORDER BY delivery_date ASC, delivery_no ASC`,
      [clinicId, dateFrom, dateTo]
    );

    const notes = rows.map(deliveryNoteFromRow);
    const totalGiko     = notes.reduce((s, n) => s + n.subtotalGiko, 0);
    const totalMaterial = notes.reduce((s, n) => s + n.subtotalMaterial, 0);
    const totalTax      = notes.reduce((s, n) => s + n.tax, 0);
    const totalBaseUp   = notes.reduce((s, n) => s + (n.baseUpSupport || 0), 0);
    const totalAmount   = notes.reduce((s, n) => s + n.total, 0);

    res.json({
      clinic,
      year: y, month: m,
      dateFrom, dateTo,
      notes,
      totalGiko, totalMaterial, totalTax, totalBaseUp, totalAmount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

// PATCH clinics/:id （bank_info / address / postal_code 更新用）
app.patch('/api/clinics/:id', async (req, res) => {
  try {
    const { bankInfo, address, postalCode } = req.body;
    const { rows } = await pool.query(
      `UPDATE clinics SET
         bank_info   = COALESCE($1, bank_info),
         address     = COALESCE($2, address),
         postal_code = COALESCE($3, postal_code)
       WHERE id=$4 RETURNING *`,
      [bankInfo ?? null, address ?? null, postalCode ?? null, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: '医院が見つかりません' });
    res.json(clinicFromRow(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

// ─── Invoice History API ─────────────────────────────────────────────────────

app.get('/api/invoice-history', async (req, res) => {
  try {
    const { clinicId, year, month } = req.query;
    const { rows } = await pool.query(
      'SELECT * FROM invoice_history WHERE clinic_id=$1 AND year=$2 AND month=$3',
      [clinicId, parseInt(year), parseInt(month)]
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

app.get('/api/invoice-history/list', async (req, res) => {
  try {
    const { clinicId } = req.query;
    const where = clinicId ? 'WHERE clinic_id=$1' : '';
    const params = clinicId ? [clinicId] : [];
    const { rows } = await pool.query(
      `SELECT id, clinic_id, year, month, total_amount, grand_total, carry_over,
              prev_amount, paid_amount, adjust_amount, bank_info, notes_snapshot, created_at
       FROM invoice_history ${where} ORDER BY year DESC, month DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

app.post('/api/invoice-history', async (req, res) => {
  try {
    const { clinicId, year, month, totalAmount, prevAmount, paidAmount, adjustAmount, carryOver,
            notesSnapshot, grandTotal, bankInfo } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO invoice_history
         (clinic_id, year, month, total_amount, prev_amount, paid_amount, adjust_amount, carry_over,
          notes_snapshot, grand_total, bank_info)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (clinic_id, year, month)
       DO UPDATE SET
         total_amount=$4, prev_amount=$5, paid_amount=$6, adjust_amount=$7, carry_over=$8,
         notes_snapshot=$9, grand_total=$10, bank_info=$11,
         created_at=NOW()
       RETURNING *`,
      [clinicId, year, month, totalAmount, prevAmount, paidAmount, adjustAmount ?? 0, carryOver,
       JSON.stringify(notesSnapshot ?? []), grandTotal ?? 0, bankInfo ?? '']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

app.delete('/api/invoice-history/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM invoice_history WHERE id=$1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: '見つかりません' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

// ─── Company Info API ────────────────────────────────────────────────────────

app.get('/api/company-info', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM company_info WHERE id=1');
    const r = rows[0] || { id: 1, bank_info: '', base_up_price: 150 };
    res.json({ ...r, baseUpPrice: r.base_up_price ?? 150 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

app.put('/api/company-info', async (req, res) => {
  try {
    const { bankInfo, baseUpPrice } = req.body;
    const { rows } = await pool.query(
      `UPDATE company_info SET bank_info=$1, base_up_price=$2, updated_at=NOW() WHERE id=1 RETURNING *`,
      [bankInfo ?? '', baseUpPrice ?? 150]
    );
    const r = rows[0];
    res.json({ ...r, baseUpPrice: r.base_up_price ?? 150 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DBエラー' });
  }
});

// ─── Backup API ──────────────────────────────────────────────────────────────

app.get('/api/backup', async (req, res) => {
  try {
    const [jobs, deliveryNotes, metalStocks, metalTypes, clinics, prices] = await Promise.all([
      pool.query('SELECT * FROM jobs ORDER BY created_at'),
      pool.query('SELECT * FROM delivery_notes ORDER BY created_at'),
      pool.query('SELECT * FROM metal_stocks ORDER BY created_at'),
      pool.query('SELECT * FROM metal_types ORDER BY id'),
      pool.query('SELECT * FROM clinics ORDER BY id'),
      pool.query('SELECT * FROM prices'),
    ]);
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="backup_${stamp}.json"`);
    res.json({
      exportedAt:    now.toISOString(),
      jobs:          jobs.rows,
      deliveryNotes: deliveryNotes.rows,
      metalStocks:   metalStocks.rows,
      metalTypes:    metalTypes.rows,
      clinics:       clinics.rows,
      prices:        prices.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'バックアップ失敗' });
  }
});

// ─── Restore API ─────────────────────────────────────────────────────────────

app.post('/api/restore', async (req, res) => {
  const { metalTypes = [], clinics = [], products = [], prices = [],
          jobs = [], metalStocks = [], deliveryNotes = [] } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const r of metalTypes) {
      await client.query(
        'INSERT INTO metal_types (id, name) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [r.id, r.name]
      );
    }

    for (const r of clinics) {
      await client.query(
        'INSERT INTO clinics (id, name, short_name, closing_day) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
        [r.id, r.name, r.short_name, r.closing_day]
      );
    }

    for (const r of products) {
      await client.query(
        'INSERT INTO products (id, code, name, category) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
        [r.id, r.code, r.name, r.category]
      );
    }

    for (const r of prices) {
      await client.query(
        'INSERT INTO prices (clinic_id, product_id, price) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
        [r.clinic_id, r.product_id, r.price]
      );
    }

    for (const r of jobs) {
      await client.query(
        `INSERT INTO jobs (id, clinic, patient, set_date, set_time, shiki, gikobutsu, done, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING`,
        [r.id, r.clinic, r.patient, r.set_date, r.set_time,
         r.shiki ?? '', r.gikobutsu ?? '', r.done ?? false, r.created_at]
      );
    }

    for (const r of metalStocks) {
      await client.query(
        `INSERT INTO metal_stocks (id, date, clinic_name, metal_type, transaction_type, weight, note, delivery_note_id, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING`,
        [r.id, r.date, r.clinic_name, r.metal_type, r.transaction_type,
         r.weight, r.note ?? null, r.delivery_note_id ?? null, r.created_at]
      );
    }

    for (const r of deliveryNotes) {
      await client.query(
        `INSERT INTO delivery_notes
           (id, delivery_no, clinic_id, clinic_name, delivery_date,
            patient_name, shiki, rows, para_gram, miro_gram,
            subtotal_giko, subtotal_material, tax, total, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT DO NOTHING`,
        [r.id, r.delivery_no, r.clinic_id ?? null, r.clinic_name, r.delivery_date,
         r.patient_name ?? '', r.shiki ?? '',
         typeof r.rows === 'string' ? r.rows : JSON.stringify(r.rows ?? []),
         r.para_gram ?? 0, r.miro_gram ?? 0,
         r.subtotal_giko ?? 0, r.subtotal_material ?? 0, r.tax ?? 0, r.total ?? 0,
         r.created_at]
      );
    }

    // SERIALシーケンスを最大IDに合わせてリセット（復元後の重複を防ぐ）
    await client.query(`SELECT setval('metal_types_id_seq',    COALESCE((SELECT MAX(id) FROM metal_types),    0) + 1, false)`);
    await client.query(`SELECT setval('metal_stocks_id_seq',   COALESCE((SELECT MAX(id) FROM metal_stocks),   0) + 1, false)`);
    await client.query(`SELECT setval('invoice_history_id_seq',COALESCE((SELECT MAX(id) FROM invoice_history),0) + 1, false)`);
    await client.query(`SELECT setval('company_info_id_seq',   COALESCE((SELECT MAX(id) FROM company_info),   0) + 1, false)`);

    await client.query('COMMIT');
    res.json({
      restored: {
        metalTypes:    metalTypes.length,
        clinics:       clinics.length,
        products:      products.length,
        prices:        prices.length,
        jobs:          jobs.length,
        metalStocks:   metalStocks.length,
        deliveryNotes: deliveryNotes.length,
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: '復元失敗: ' + err.message });
  } finally {
    client.release();
  }
});

// ─── 金属使用量 一括再同期 ───────────────────────────────────────────────────────

app.post('/api/recalculate-metals', async (req, res) => {
  try {
    // 全納品書を取得して金属使用量を再同期
    const { rows } = await pool.query('SELECT * FROM delivery_notes');
    let count = 0;
    for (const r of rows) {
      await syncMetalStocksForNote(
        r.id,
        r.delivery_date,
        r.clinic_name,
        parseFloat(r.para_gram) || 0,
        parseFloat(r.miro_gram) || 0
      );
      count++;
    }
    res.json({ message: `${count}件の納品書から金属使用量を再計算しました` });
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
