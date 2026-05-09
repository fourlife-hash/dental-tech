import { useRef } from 'react';

const GREEN     = '#1a5c3a';
const GREEN_BG  = '#d4edda';
const BORDER    = '1px solid #a8d5b5';

function fmt(n) { return (n ?? 0).toLocaleString(); }
function fmtDate(str) {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00');
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}
function fmtJP(str) {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00');
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
}

export default function InvoicePrint({ invoiceData, prevCharge, prevPayment, adjustment, carryOver, bankInfo }) {
  const printRef = useRef();

  function handlePrint() {
    const el = printRef.current;
    if (!el) return;
    const win = window.open('', '_blank', 'width=900,height=1200');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif; font-size: 12px; color: #222; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #a8d5b5; padding: 5px 8px; }
        th { background: #d4edda; color: #1a5c3a; font-weight: bold; }
        @media print { @page { size: A4; margin: 15mm; } }
      </style></head><body>` + el.innerHTML + `</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  }

  if (!invoiceData) return null;
  const { clinic, year, month, dateFrom, dateTo, notes, totalGiko, totalMaterial, totalTax, totalAmount } = invoiceData;
  const grandTotal = totalAmount + carryOver;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  const th = (extra = {}) => ({ padding: '5px 8px', textAlign: 'center', background: GREEN_BG, color: GREEN, border: BORDER, fontWeight: 'bold', fontSize: 12, ...extra });
  const td = (extra = {}) => ({ padding: '5px 8px', border: BORDER, fontSize: 12, ...extra });

  const printContent = (
    <div style={{ fontFamily: "'Hiragino Kaku Gothic ProN','Meiryo',sans-serif", fontSize: 12, color: '#222' }}>

      {/* ─── ヘッダー ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ fontSize: 26, fontWeight: 'bold', color: GREEN, borderBottom: `3px solid ${GREEN}`, paddingBottom: 6, letterSpacing: '0.3em' }}>
          請　求　書
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, lineHeight: 2 }}>
          <div>請求日　{fmtJP(todayStr)}</div>
          <div>〒601-8472</div>
          <div>京都市南区八条坊門町7-6</div>
          <div>インボイス登録番号</div>
          <div>T3-8103-2874-8548</div>
        </div>
      </div>

      {/* ─── 医院名行 ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 'bold', borderBottom: `1.5px solid #333`, paddingBottom: 4, minWidth: 240 }}>
          {clinic.name}　様
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, lineHeight: 1.8, color: '#444' }}>
          {clinic.postalCode && <div>〒{clinic.postalCode}</div>}
          {clinic.address && <div>{clinic.address}</div>}
        </div>
      </div>

      {/* ─── 今回御請求額 ─── */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 13, color: '#444', marginBottom: 2 }}>今回御請求額</div>
        <div style={{ fontSize: 28, fontWeight: 'bold', color: GREEN, borderBottom: `2px solid ${GREEN}`, paddingBottom: 4, display: 'inline-block', minWidth: 200 }}>
          ¥{fmt(grandTotal)}
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#555', marginBottom: 18 }}>
        {year}年{month}月分技工代金を御請求申し上げます。
      </div>

      {/* ─── 集計サマリーテーブル ─── */}
      <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 20 }}>
        <thead>
          <tr>
            {['前回御請求額', '前回御入金額', '調整額', '繰越額', '（技工）', '（材料）', '消費税', '今回納品額'].map(h => (
              <th key={h} style={th()}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={td({ textAlign: 'right' })}>¥{fmt(prevCharge)}</td>
            <td style={td({ textAlign: 'right' })}>¥{fmt(prevPayment)}</td>
            <td style={td({ textAlign: 'right' })}>¥{fmt(adjustment)}</td>
            <td style={td({ textAlign: 'right', fontWeight: 'bold' })}>¥{fmt(carryOver)}</td>
            <td style={td({ textAlign: 'right' })}>¥{fmt(totalGiko)}</td>
            <td style={td({ textAlign: 'right' })}>¥{fmt(totalMaterial)}</td>
            <td style={td({ textAlign: 'right' })}>¥{fmt(totalTax)}</td>
            <td style={td({ textAlign: 'right', fontWeight: 'bold' })}>¥{fmt(totalAmount)}</td>
          </tr>
        </tbody>
      </table>

      {/* ─── 明細テーブル ─── */}
      <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 24 }}>
        <thead>
          <tr>
            {['納品No', '納品日', '患者名', '（技工）', '（材料）', '消費税', '納品額'].map(h => (
              <th key={h} style={th()}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {notes.length === 0 && (
            <tr><td colSpan={7} style={td({ textAlign: 'center', color: '#888' })}>対象期間の納品書がありません</td></tr>
          )}
          {notes.map(n => (
            <tr key={n.id}>
              <td style={td({ textAlign: 'center' })}>{n.deliveryNo}</td>
              <td style={td({ textAlign: 'center', whiteSpace: 'nowrap' })}>{fmtDate(n.deliveryDate)}</td>
              <td style={td()}>{n.patientName}</td>
              <td style={td({ textAlign: 'right' })}>¥{fmt(n.subtotalGiko)}</td>
              <td style={td({ textAlign: 'right' })}>¥{fmt(n.subtotalMaterial)}</td>
              <td style={td({ textAlign: 'right' })}>¥{fmt(n.tax)}</td>
              <td style={td({ textAlign: 'right', fontWeight: 'bold' })}>¥{fmt(n.total)}</td>
            </tr>
          ))}
          {/* 合計行 */}
          <tr style={{ background: '#f0f9f4' }}>
            <td colSpan={3} style={td({ textAlign: 'right', fontWeight: 'bold' })}>合　計</td>
            <td style={td({ textAlign: 'right', fontWeight: 'bold' })}>¥{fmt(totalGiko)}</td>
            <td style={td({ textAlign: 'right', fontWeight: 'bold' })}>¥{fmt(totalMaterial)}</td>
            <td style={td({ textAlign: 'right', fontWeight: 'bold' })}>¥{fmt(totalTax)}</td>
            <td style={td({ textAlign: 'right', fontWeight: 'bold' })}>¥{fmt(totalAmount)}</td>
          </tr>
        </tbody>
      </table>

      {/* ─── フッター（振込口座） ─── */}
      {bankInfo && (
        <div style={{ border: `1px solid ${GREEN}`, borderRadius: 6, padding: '8px 14px', fontSize: 12, color: '#333' }}>
          <div style={{ fontWeight: 'bold', color: GREEN, marginBottom: 4 }}>【お振込み口座】</div>
          <div style={{ whiteSpace: 'pre-line' }}>{bankInfo}</div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* 印刷ボタン */}
      <button onClick={handlePrint}
        style={{ padding: '8px 28px', background: GREEN, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14, marginBottom: 16 }}>
        印刷プレビュー
      </button>

      {/* プレビュー */}
      <div ref={printRef} style={{
        border: '1px solid #ccc', borderRadius: 8, padding: '15mm',
        background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}>
        {printContent}
      </div>
    </div>
  );
}
