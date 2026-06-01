import { useState, useEffect } from 'react';
import MetalReceiptPrint from './MetalReceiptPrint.jsx';

const TX_TYPES = ['預かり', '使用', '返却'];

// clinic×metal の残量を stocks 配列から計算
function calcClinicBalance(allStocks, clinicName, metalType) {
  return allStocks
    .filter(s => s.clinicName === clinicName && s.metalType === metalType)
    .reduce((acc, s) => s.transactionType === '預かり' ? acc + s.weight : acc - s.weight, 0);
}

export default function MetalStock() {
  const [stocks, setStocks]       = useState([]);
  const [summary, setSummary]     = useState([]); // [{clinicName, metalType, balance}]
  const [types, setTypes]         = useState([]);
  const [clinics, setClinics]     = useState([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [printData, setPrintData] = useState(null);
  const [form, setForm] = useState({
    date: today(), clinicName: '', metalType: '', transactionType: '預かり', weight: '', note: '',
  });

  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  async function load() {
    const [s, sum, t, cl] = await Promise.all([
      fetch('/api/metal-stocks').then(r => r.json()),
      fetch('/api/metal-stocks/summary').then(r => r.json()),
      fetch('/api/metal-types').then(r => r.json()),
      fetch('/api/clinics').then(r => r.json()),
    ]);
    setStocks(s);
    setSummary(sum);
    setTypes(t);
    setClinics(cl);
    if (!form.metalType && t.length > 0) setForm(f => ({ ...f, metalType: t[0].name }));
  }

  useEffect(() => { load(); }, []);

  // 全体残量（全医院合計）per metal_type
  function totalBalance(metalType) {
    return summary
      .filter(s => s.metalType === metalType)
      .reduce((acc, s) => acc + s.balance, 0);
  }

  // 医院ごとの残量マップ: { clinicName -> { metalType -> balance } }
  function buildClinicMap() {
    const map = {};
    for (const s of summary) {
      if (!map[s.clinicName]) map[s.clinicName] = {};
      map[s.clinicName][s.metalType] = s.balance;
    }
    return map;
  }

  async function postStock() {
    await fetch('/api/metal-stocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, weight: parseFloat(form.weight) }),
    });
  }

  async function handleAddStock(e) {
    e.preventDefault();
    if (!form.date || !form.metalType || !form.transactionType || !form.weight) return;
    await postStock();
    setForm(f => ({ ...f, weight: '', note: '' }));
    await load();
  }

  async function handleAddWithPrint(e) {
    e.preventDefault();
    if (!form.date || !form.metalType || !form.weight) return;
    const depositWeight = parseFloat(form.weight);

    // 保存前の残量を記録
    const balanceBefore = calcClinicBalance(stocks, form.clinicName, form.metalType);

    await postStock();

    // 最新データを直接取得
    const freshStocks = await fetch('/api/metal-stocks').then(r => r.json());
    setStocks(freshStocks);
    fetch('/api/metal-stocks/summary').then(r => r.json()).then(setSummary);

    const clinicAllBalances = types.map(t => ({
      metalType: t.name,
      balance:   calcClinicBalance(freshStocks, form.clinicName, t.name),
    }));

    setPrintData({
      clinicName:        form.clinicName,
      receiptDate:       form.date,
      metalType:         form.metalType,
      depositWeight,
      balanceBefore,
      clinicAllBalances,
    });

    setForm(f => ({ ...f, weight: '', note: '' }));
  }

  async function handleDeleteStock(id) {
    if (!confirm('この履歴を削除しますか？')) return;
    await fetch(`/api/metal-stocks/${id}`, { method: 'DELETE' });
    await load();
  }

  async function handleAddType(e) {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    const r = await fetch('/api/metal-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTypeName.trim() }),
    });
    if (r.ok) { setNewTypeName(''); await load(); }
    else { const d = await r.json(); alert(d.error); }
  }

  async function handleDeleteType(id, name) {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    await fetch(`/api/metal-types/${id}`, { method: 'DELETE' });
    await load();
  }

  function fmtDate(str) {
    if (!str) return '';
    const d = new Date(str);
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
  }

  const isAzukari = form.transactionType === '預かり';
  const clinicMap = buildClinicMap();
  // 残量がある医院一覧（null clinicName は「医院未指定」として表示）
  const clinicNames = [...new Set(summary.map(s => s.clinicName))].sort((a, b) => (a || '').localeCompare(b || ''));

  return (
    <div style={{ padding: '1rem', maxWidth: 960, margin: '0 auto' }}>

      {/* ─── 全体残量カード ─── */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {types.map(t => {
          const bal = totalBalance(t.name);
          return (
            <div key={t.id} style={{
              background: '#f0f4ff', borderRadius: 10, padding: '0.75rem 1.25rem',
              minWidth: 120, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>全体残量</div>
              <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: bal < 0 ? '#c0392b' : '#1a3a5c' }}>
                {bal.toFixed(2)}<span style={{ fontSize: 12, marginLeft: 2 }}>g</span>
              </div>
            </div>
          );
        })}
        {types.length === 0 && <p style={{ color: '#888' }}>金属種類を登録してください</p>}
      </div>

      {/* ─── 医院別残量テーブル ─── */}
      {clinicNames.length > 0 && types.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#1a3a5c', color: '#fff' }}>
                <th style={{ padding: '7px 12px', textAlign: 'left', border: '1px solid #4a6a8c' }}>医院名</th>
                {types.map(t => (
                  <th key={t.id} style={{ padding: '7px 12px', textAlign: 'right', border: '1px solid #4a6a8c' }}>{t.name}(g)</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clinicNames.map(cn => (
                <tr key={cn || '__none__'} style={{ borderBottom: '1px solid #e0e4f0' }}>
                  <td style={{ padding: '7px 12px', border: '1px solid #dde', fontWeight: 'bold' }}>
                    {cn || '（医院名未設定）'}
                  </td>
                  {types.map(t => {
                    const bal = clinicMap[cn]?.[t.name] ?? 0;
                    return (
                      <td key={t.id} style={{
                        padding: '7px 12px', textAlign: 'right', border: '1px solid #dde',
                        color: bal < 0 ? '#c0392b' : bal === 0 ? '#aaa' : '#1a3a5c',
                        fontWeight: bal !== 0 ? 'bold' : 'normal',
                      }}>
                        {bal !== 0 ? bal.toFixed(2) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── 入力フォーム ─── */}
      <form onSubmit={handleAddStock} style={{
        background: '#fafafa', borderRadius: 10, padding: '1rem', marginBottom: '1.5rem',
        display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-end',
      }}>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, gap: 3 }}>
          日付
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #ccc' }} required />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, gap: 3 }}>
          医院名
          <select value={form.clinicName} onChange={e => setForm(f => ({ ...f, clinicName: e.target.value }))}
            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #ccc', minWidth: 120 }}>
            <option value="">（未選択）</option>
            {clinics.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, gap: 3 }}>
          金属種類
          <select value={form.metalType} onChange={e => setForm(f => ({ ...f, metalType: e.target.value }))}
            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #ccc' }} required>
            <option value="">選択</option>
            {types.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, gap: 3 }}>
          区分
          <select value={form.transactionType} onChange={e => setForm(f => ({ ...f, transactionType: e.target.value }))}
            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #ccc' }}>
            {TX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, gap: 3 }}>
          重量(g)
          <input type="number" step="0.01" min="0" value={form.weight}
            onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #ccc', width: 80 }} required />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, gap: 3 }}>
          備考
          <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #ccc', width: 140 }} />
        </label>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-end' }}>
          <button type="submit"
            style={{ padding: '6px 18px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>
            登録
          </button>
          {isAzukari && (
            <button type="button" onClick={handleAddWithPrint}
              style={{ padding: '6px 14px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>
              保存して預かり票を印刷
            </button>
          )}
        </div>
      </form>

      {/* ─── 履歴テーブル ─── */}
      <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f0f4ff' }}>
              {['日付', '医院名', '金属種類', '区分', '重量(g)', '備考', ''].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #dde', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stocks.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '1.5rem', color: '#888' }}>履歴がありません</td></tr>
            )}
            {stocks.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{fmtDate(s.date)}</td>
                <td style={{ padding: '7px 10px' }}>{s.clinicName || '—'}</td>
                <td style={{ padding: '7px 10px' }}>{s.metalType}</td>
                <td style={{ padding: '7px 10px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 'bold',
                    background: s.transactionType === '預かり' ? '#e8f5e9' : s.transactionType === '使用' ? '#fff3e0' : '#fce4ec',
                    color:      s.transactionType === '預かり' ? '#2e7d32' : s.transactionType === '使用' ? '#e65100' : '#c62828',
                  }}>{s.transactionType}</span>
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>{s.weight.toFixed(2)}</td>
                <td style={{ padding: '7px 10px', color: '#666' }}>{s.note || ''}</td>
                <td style={{ padding: '7px 10px' }}>
                  <button onClick={() => handleDeleteStock(s.id)}
                    style={{ background: 'none', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', padding: '2px 8px', color: '#999', fontSize: 12 }}>
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── 金属使用量 再計算 ─── */}
      <div style={{ background: '#fff8e1', border: '1px solid #ffc107', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ fontSize: 13, color: '#555' }}>
          納品書の金属使用量が正しく反映されていない場合は再計算してください
        </div>
        <button
          onClick={async () => {
            const res = await fetch('/api/recalculate-metals', { method: 'POST' });
            const d = await res.json();
            alert(d.message || d.error);
            await load();
          }}
          style={{ padding: '6px 16px', background: '#e65100', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 13 }}>
          金属使用量を再計算
        </button>
      </div>

      {/* ─── 金属種類マスタ ─── */}
      <div style={{ background: '#fafafa', borderRadius: 10, padding: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: 15 }}>金属種類マスタ</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {types.map(t => (
            <span key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#e8eaf6', borderRadius: 20, padding: '4px 12px', fontSize: 14 }}>
              {t.name}
              <button onClick={() => handleDeleteType(t.id, t.name)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
            </span>
          ))}
        </div>
        <form onSubmit={handleAddType} style={{ display: 'flex', gap: '0.5rem' }}>
          <input type="text" value={newTypeName} onChange={e => setNewTypeName(e.target.value)}
            placeholder="新しい金属種類名" style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #ccc', flex: 1, maxWidth: 200 }} />
          <button type="submit" style={{ padding: '5px 14px', background: '#4a90e2', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>追加</button>
        </form>
      </div>

      {/* ─── 預かり票印刷オーバーレイ ─── */}
      {printData && (
        <MetalReceiptPrint
          clinicName={printData.clinicName}
          receiptDate={printData.receiptDate}
          metalType={printData.metalType}
          depositWeight={printData.depositWeight}
          balanceBefore={printData.balanceBefore}
          clinicAllBalances={printData.clinicAllBalances}
          onClose={() => setPrintData(null)}
        />
      )}
    </div>
  );
}
