import { useRef } from 'react';

const GREEN    = '#4CAF50';
const GREEN_BG = '#4CAF50';
const BORDER   = '1px solid #a8d5b5';

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

// テーブルヘッダー: 緑背景・白文字
const TH = (extra = {}) => ({
  padding: '5px 4px', textAlign: 'center', fontSize: 11, lineHeight: 1.6,
  background: GREEN_BG, color: '#fff', border: BORDER, fontWeight: 'bold',
  ...extra,
});
// テーブルデータ
const TD = (extra = {}) => ({
  padding: '4px 6px', border: BORDER, fontSize: 11, lineHeight: 1.6,
  ...extra,
});

export default function InvoicePrint({ invoiceData, prevCharge, prevPayment, adjustment, carryOver, bankInfo }) {
  const printRef = useRef();

  function handlePrint() {
    const el = printRef.current;
    if (!el) return;
    const win = window.open('', '_blank', 'width=900,height=1200');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: 'Hiragino Kaku Gothic ProN','Meiryo',sans-serif; font-size: 11px; color: #222; }
        table { border-collapse: collapse; width: 100%; }
        th { background: #4CAF50; color: #fff; font-weight: bold; border: 1px solid #a8d5b5; padding: 5px 4px; font-size: 11px; line-height: 1.6; }
        td { border: 1px solid #a8d5b5; padding: 4px 6px; font-size: 11px; line-height: 1.6; }
        @media print { @page { size: A4 portrait; margin: 15mm; } }
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

  const printContent = (
    <div style={{ fontFamily: "'Hiragino Kaku Gothic ProN','Meiryo',sans-serif", fontSize: 11, color: '#222' }}>

      {/* ─── ヘッダー ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div style={{
          fontSize: 28, fontWeight: 'bold', color: GREEN,
          borderBottom: `3px solid ${GREEN}`, paddingBottom: 6, letterSpacing: '0.3em',
        }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
        <div style={{
          fontSize: 18, fontWeight: 'bold', borderBottom: '1.5px solid #333',
          paddingBottom: 4, minWidth: 240,
        }}>
          {clinic.name}　様
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, lineHeight: 1.8, color: '#444' }}>
          {clinic.postalCode && <div>〒{clinic.postalCode}</div>}
          {clinic.address    && <div>{clinic.address}</div>}
        </div>
      </div>

      {/* ─── 今回御請求額 ─── */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 14, color: '#444', marginBottom: 2 }}>今回御請求額</div>
        <div style={{
          fontSize: 28, fontWeight: 'bold', color: GREEN,
          borderBottom: `2px solid ${GREEN}`, paddingBottom: 4,
          display: 'inline-block', minWidth: 200,
        }}>
          ¥{fmt(grandTotal)}
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#555', marginBottom: 16 }}>
        {year}年{month}月分技工代金を御請求申し上げます。
      </div>

      {/* ─── 集計サマリーテーブル ─── */}
      <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 16 }}>
        <thead>
          <tr>
            {['前回御請求額','前回御入金額','調整額','繰越額','（技工）','（材料）','消費税','今回納品額'].map(h => (
              <th key={h} style={TH()}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={TD({ textAlign: 'right' })}>¥{fmt(prevCharge)}</td>
            <td style={TD({ textAlign: 'right' })}>¥{fmt(prevPayment)}</td>
            <td style={TD({ textAlign: 'right' })}>¥{fmt(adjustment)}</td>
            <td style={TD({ textAlign: 'right', fontWeight: 'bold' })}>¥{fmt(carryOver)}</td>
            <td style={TD({ textAlign: 'right' })}>¥{fmt(totalGiko)}</td>
            <td style={TD({ textAlign: 'right' })}>¥{fmt(totalMaterial)}</td>
            <td style={TD({ textAlign: 'right' })}>¥{fmt(totalTax)}</td>
            <td style={TD({ textAlign: 'right', fontWeight: 'bold' })}>¥{fmt(totalAmount)}</td>
          </tr>
        </tbody>
      </table>

      {/* 技工内訳 */}
      <div style={{ fontSize: 11, color: '#555', marginBottom: 12 }}>
        技工内訳：（保険）{fmt(invoiceData.totalGikoHoken ?? 0)}　（自費）{fmt(invoiceData.totalGikoJihi ?? 0)}
      </div>

      {/* ─── 明細テーブル ─── */}
      <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 20, tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '8%' }} />   {/* 納品No */}
          <col style={{ width: '8%' }} />   {/* 指示書No */}
          <col style={{ width: '10%' }} />  {/* 納品日 */}
          <col style={{ width: '22%' }} />  {/* 患者名 */}
          <col style={{ width: '12%' }} />  {/* 技工 */}
          <col style={{ width: '10%' }} />  {/* 材料 */}
          <col style={{ width: '10%' }} />  {/* 消費税 */}
          <col style={{ width: '12%' }} />  {/* 納品額 */}
          <col style={{ width: '8%' }} />   {/* 余白 */}
        </colgroup>
        <thead>
          <tr>
            {['納品No','指示書No','納品日','患者名','（技工）','（材料）','消費税','納品額',''].map(h => (
              <th key={h} style={TH()}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {notes.length === 0 && (
            <tr><td colSpan={9} style={TD({ textAlign: 'center', color: '#888' })}>対象期間の納品書がありません</td></tr>
          )}
          {notes.map((n, i) => (
            <tr key={n.id} style={{ background: i % 2 === 1 ? '#f0f7f0' : 'transparent' }}>
              <td style={TD({ textAlign: 'center' })}>{n.deliveryNo}</td>
              <td style={TD({ textAlign: 'center' })}>{n.shiki || ''}</td>
              <td style={TD({ textAlign: 'center', whiteSpace: 'nowrap' })}>{fmtDate(n.deliveryDate)}</td>
              <td style={TD()}>{n.patientName}</td>
              <td style={TD({ textAlign: 'right' })}>¥{fmt(n.subtotalGiko)}</td>
              <td style={TD({ textAlign: 'right' })}>¥{fmt(n.subtotalMaterial)}</td>
              <td style={TD({ textAlign: 'right' })}>¥{fmt(n.tax)}</td>
              <td style={TD({ textAlign: 'right', fontWeight: 'bold' })}>¥{fmt(n.total)}</td>
              <td style={TD()} />
            </tr>
          ))}
          {/* 合計行 */}
          <tr style={{ background: '#e8f5e9' }}>
            <td colSpan={4} style={TD({ textAlign: 'right', fontWeight: 'bold' })}>合　計</td>
            <td style={TD({ textAlign: 'right', fontWeight: 'bold' })}>¥{fmt(totalGiko)}</td>
            <td style={TD({ textAlign: 'right', fontWeight: 'bold' })}>¥{fmt(totalMaterial)}</td>
            <td style={TD({ textAlign: 'right', fontWeight: 'bold' })}>¥{fmt(totalTax)}</td>
            <td style={TD({ textAlign: 'right', fontWeight: 'bold' })}>¥{fmt(totalAmount)}</td>
            <td style={TD()} />
          </tr>
        </tbody>
      </table>

      {/* ─── フッター（振込口座） ─── */}
      {bankInfo && (
        <div style={{ border: `1px solid ${GREEN}`, borderRadius: 6, padding: '8px 14px', fontSize: 12, color: '#333' }}>
          <div style={{ fontWeight: 'bold', color: GREEN, marginBottom: 4 }}>【お振込み口座】</div>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{bankInfo}</div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ marginTop: '1rem' }}>
      <button onClick={handlePrint}
        style={{ padding: '8px 28px', background: GREEN, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14, marginBottom: 16 }}>
        印刷プレビュー
      </button>
      <div ref={printRef} style={{
        border: '1px solid #ccc', borderRadius: 8, padding: '15mm',
        background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}>
        {printContent}
      </div>
    </div>
  );
}
