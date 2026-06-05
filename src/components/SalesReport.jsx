import { useState, useEffect, useRef } from 'react';

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

function fmt(n) { return n > 0 ? n.toLocaleString() : '—'; }

export default function SalesReport() {
  const currentYear = new Date().getFullYear();
  const [year, setYear]   = useState(currentYear);
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/sales/annual?year=${year}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [year]);

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
      </style>
    </head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  }

  const years = [currentYear - 1, currentYear, currentYear + 1];
  const GREEN = '#2e7d32';

  return (
    <div style={{ padding: '1rem', maxWidth: 1100, margin: '0 auto' }}>
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

      {data && (
        <div ref={printRef}>
          <h2 style={{ color: GREEN, fontSize: 16, marginBottom: 8 }}>{data.year}年　医院別月別売上（納品書より集計）</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ background: GREEN, color: '#fff', padding: '6px 10px', textAlign: 'left', border: '0.5pt solid #666', minWidth: 140 }}>医院名</th>
                  {MONTHS.map(m => (
                    <th key={m} style={{ background: GREEN, color: '#fff', padding: '6px 8px', textAlign: 'right', border: '0.5pt solid #666', minWidth: 70 }}>{m}</th>
                  ))}
                  <th style={{ background: '#1b5e20', color: '#fff', padding: '6px 8px', textAlign: 'right', border: '0.5pt solid #666', minWidth: 85 }}>合計</th>
                </tr>
              </thead>
              <tbody>
                {data.clinics.map(clinic => (
                  <tr key={clinic.name} style={{ borderBottom: '0.5pt solid #ccc' }}>
                    <td style={{ padding: '5px 10px', border: '0.5pt solid #ddd', fontWeight: 'bold' }}>{clinic.name}</td>
                    {clinic.months.map((v, i) => (
                      <td key={i} style={{
                        padding: '5px 8px', border: '0.5pt solid #ddd', textAlign: 'right',
                        color: v === 0 ? '#ccc' : '#222',
                        background: v > 0 ? 'transparent' : '#fafafa'
                      }}>
                        {v > 0 ? v.toLocaleString() : '—'}
                      </td>
                    ))}
                    <td style={{ padding: '5px 8px', border: '0.5pt solid #ddd', textAlign: 'right', fontWeight: 'bold', color: GREEN }}>
                      {clinic.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {/* 月合計行 */}
                <tr style={{ background: '#e8f5e9', borderTop: '2pt solid #2e7d32' }}>
                  <td style={{ padding: '6px 10px', border: '0.5pt solid #aaa', fontWeight: 'bold' }}>月　合　計</td>
                  {data.monthlyTotals.map((v, i) => (
                    <td key={i} style={{ padding: '6px 8px', border: '0.5pt solid #aaa', textAlign: 'right', fontWeight: 'bold', color: v === 0 ? '#ccc' : '#222' }}>
                      {v > 0 ? v.toLocaleString() : '—'}
                    </td>
                  ))}
                  <td style={{ padding: '6px 8px', border: '0.5pt solid #aaa', textAlign: 'right', fontWeight: 'bold', fontSize: 13, background: '#1b5e20', color: '#fff' }}>
                    {data.grandTotal.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 総計サマリー */}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ background: '#f0f9f0', border: '1px solid #a5d6a7', borderRadius: 8, padding: '0.75rem 1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#555' }}>{data.year}年 年間総売上</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: GREEN }}>¥{data.grandTotal.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
