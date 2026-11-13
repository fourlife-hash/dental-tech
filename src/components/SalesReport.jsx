import { useState, useEffect, useRef, useCallback } from 'react';

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const MANUAL_MONTHS = 4; // 1〜4月は手入力

const GREEN = '#2e7d32';

export default function SalesReport() {
  const currentYear = new Date().getFullYear();
  const [year, setYear]     = useState(currentYear);
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState({});
  const printRef = useRef();

  const loadManual = useCallback(async (y) => {
    try {
      const rows = await fetch(`/api/sales-manual?year=${y}`).then(r => r.json());
      const obj = {};
      for (const row of rows) {
        if (!obj[row.clinic_name]) obj[row.clinic_name] = Array(MANUAL_MONTHS).fill(0);
        if (row.month >= 1 && row.month <= MANUAL_MONTHS) {
          obj[row.clinic_name][row.month - 1] = row.amount;
        }
      }
      setManual(obj);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/sales/annual?year=${year}`).then(r => r.json()),
      loadManual(year),
    ]).then(([d]) => setData(d)).finally(() => setLoading(false));
  }, [year, loadManual]);

  async function handleManualChange(clinicName, monthIdx, rawValue) {
    const amount = rawValue === '' ? 0 : (parseInt(rawValue.replace(/,/g, '')) || 0);
    setManual(prev => {
      const next = { ...prev, [clinicName]: [...(prev[clinicName] || Array(MANUAL_MONTHS).fill(0))] };
      next[clinicName][monthIdx] = amount;
      return next;
    });
    try {
      await fetch('/api/sales-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, clinicName, month: monthIdx + 1, amount }),
      });
    } catch (e) { console.error(e); }
  }

  // 表示用: 月インデックスiに対して表示値を返す（0〜3は手入力、4〜11はDB値）
  function displayValue(clinicName, monthIdx, dbValue) {
    if (monthIdx < MANUAL_MONTHS) {
      return (manual[clinicName] || [])[monthIdx] || 0;
    }
    return dbValue;
  }

  // クリニック一覧（DBにある医院 + 手入力だけある医院）
  function getClinics() {
    if (!data) return [];
    const dbNames = data.clinics.map(c => c.name);
    const manualNames = Object.keys(manual).filter(n => !dbNames.includes(n));
    const allNames = [...dbNames, ...manualNames].sort();
    return allNames.map(name => {
      const dbClinic = data.clinics.find(c => c.name === name);
      const dbMonths = dbClinic ? dbClinic.months : Array(12).fill(0);
      const months = Array.from({ length: 12 }, (_, i) => displayValue(name, i, dbMonths[i]));
      const total = months.reduce((s, v) => s + v, 0);
      return { name, months, total };
    });
  }

  function handlePrint() {
    const el = printRef.current;
    if (!el) return;
    const win = window.open('', '_blank', 'width=1100,height=800');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        @page { size: A4 landscape; margin: 10mm; }
        body { font-family: 'Hiragino Kaku Gothic ProN','Meiryo',sans-serif; font-size: 10px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 0.5pt solid #aaa; padding: 4px 6px; text-align: right; }
        th { background: #2e7d32; color: #fff; text-align: center; }
        td:first-child { text-align: left; }
        .zero { color: #bbb; }
        .total-row { background: #e8f5e9; font-weight: bold; }
        .grand { background: #1b5e20; color: #fff; }
        h2 { margin: 0 0 8px; font-size: 14px; }
        input { display: none; }
        .manual-val { display: inline; }
      </style>
    </head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  }

  const years = [currentYear - 1, currentYear, currentYear + 1];
  const clinics = getClinics();
  const monthlyTotals = Array.from({ length: 12 }, (_, i) =>
    clinics.reduce((s, c) => s + c.months[i], 0)
  );
  const grandTotal = monthlyTotals.reduce((s, v) => s + v, 0);

  return (
    <div style={{ padding: '1rem', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <h2 style={{ color: GREEN, fontSize: 20, margin: 0 }}>年間売上レポート</h2>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 14 }}>
          {years.map(y => <option key={y} value={y}>{y}年</option>)}
        </select>
        <button onClick={handlePrint}
          style={{ padding: '6px 18px', background: GREEN, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
          印刷
        </button>
        {loading && <span style={{ fontSize: 13, color: '#888' }}>読み込み中...</span>}
      </div>

      <div ref={printRef}>
        <h2 style={{ color: GREEN, fontSize: 16, marginBottom: 4 }}>{year}年　医院別月別売上（納品書より集計）</h2>
        <p style={{ fontSize: 11, color: '#777', margin: '0 0 8px' }}>
          ※ 1〜4月は手入力、5〜12月は前月21日〜当月20日の納品分で集計
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ background: GREEN, color: '#fff', padding: '6px 10px', textAlign: 'left', border: '0.5pt solid #666', minWidth: 140 }}>医院名</th>
                {MONTHS.map((m, i) => (
                  <th key={m} style={{
                    background: i < MANUAL_MONTHS ? '#1565c0' : GREEN,
                    color: '#fff', padding: '6px 8px', textAlign: 'center',
                    border: '0.5pt solid #666', minWidth: 80,
                    fontSize: 11,
                  }}>
                    {m}
                    {i < MANUAL_MONTHS && <div style={{ fontSize: 9, opacity: 0.85 }}>手入力</div>}
                  </th>
                ))}
                <th style={{ background: '#1b5e20', color: '#fff', padding: '6px 8px', textAlign: 'right', border: '0.5pt solid #666', minWidth: 85 }}>合計</th>
              </tr>
            </thead>
            <tbody>
              {clinics.map(clinic => (
                <tr key={clinic.name} style={{ borderBottom: '0.5pt solid #ccc' }}>
                  <td style={{ padding: '5px 10px', border: '0.5pt solid #ddd', fontWeight: 'bold' }}>{clinic.name}</td>
                  {clinic.months.map((v, i) => (
                    <td key={i} style={{
                      padding: '3px 4px', border: '0.5pt solid #ddd', textAlign: 'right',
                      background: i < MANUAL_MONTHS ? '#f0f4ff' : (v > 0 ? 'transparent' : '#fafafa'),
                    }}>
                      {i < MANUAL_MONTHS ? (
                        <>
                          <input
                            type="number"
                            min="0"
                            value={(manual[clinic.name] || [])[i] || ''}
                            onChange={e => handleManualChange(clinic.name, i, e.target.value)}
                            placeholder="0"
                            style={{
                              width: '100%', border: '1px solid #90caf9', borderRadius: 3,
                              padding: '2px 4px', fontSize: 12, textAlign: 'right',
                              background: 'transparent', boxSizing: 'border-box',
                            }}
                          />
                          <span className="manual-val" style={{ display: 'none' }}>
                            {v > 0 ? v.toLocaleString() : '—'}
                          </span>
                        </>
                      ) : (
                        <span style={{ color: v === 0 ? '#ccc' : '#222' }}>
                          {v > 0 ? v.toLocaleString() : '—'}
                        </span>
                      )}
                    </td>
                  ))}
                  <td style={{ padding: '5px 8px', border: '0.5pt solid #ddd', textAlign: 'right', fontWeight: 'bold', color: GREEN }}>
                    {clinic.total > 0 ? clinic.total.toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
              <tr style={{ background: '#e8f5e9', borderTop: '2pt solid #2e7d32' }}>
                <td style={{ padding: '6px 10px', border: '0.5pt solid #aaa', fontWeight: 'bold' }}>月　合　計</td>
                {monthlyTotals.map((v, i) => (
                  <td key={i} style={{
                    padding: '6px 8px', border: '0.5pt solid #aaa', textAlign: 'right',
                    fontWeight: 'bold', color: v === 0 ? '#ccc' : '#222',
                    background: i < MANUAL_MONTHS ? '#e3f2fd' : 'transparent',
                  }}>
                    {v > 0 ? v.toLocaleString() : '—'}
                  </td>
                ))}
                <td style={{ padding: '6px 8px', border: '0.5pt solid #aaa', textAlign: 'right', fontWeight: 'bold', fontSize: 13, background: '#1b5e20', color: '#fff' }}>
                  {grandTotal.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ background: '#f0f9f0', border: '1px solid #a5d6a7', borderRadius: 8, padding: '0.75rem 1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#555' }}>{year}年 年間総売上</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: GREEN }}>¥{grandTotal.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
