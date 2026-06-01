import { useRef } from 'react';

const GREEN  = '#4CAF50';
const BORDER = '1px solid #b8dba0';

function fmt(n)   { return (n ?? 0).toLocaleString(); }
function fmt0(n)  { return n ? (n).toLocaleString() : ''; }  // 0は空白
function fmtDate(str) {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00');
  return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
}
function fmtJP(str) {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00');
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
}

const TH = (extra = {}) => ({
  padding: '5px 7px', textAlign: 'center', fontSize: 11,
  background: GREEN, color: '#fff', border: BORDER, fontWeight: 'bold',
  ...extra,
});
const TD = (extra = {}) => ({
  padding: '7px 8px', border: BORDER, fontSize: 11, lineHeight: 1.6,
  wordBreak: 'break-all', overflowWrap: 'anywhere',
  ...extra,
});

export default function InvoicePrint({ invoiceData, prevCharge, prevPayment, adjustment, carryOver, bankInfo, totalBaseUp }) {
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
        th { background: #4CAF50; color: #fff; font-weight: bold; border: 1px solid #b8dba0; padding: 5px 7px; font-size: 11px; }
        td { border: 1px solid #b8dba0; padding: 7px 8px; font-size: 11px; line-height: 1.6; word-break: break-all; overflow-wrap: anywhere; }
        @media print { @page { size: A4 portrait; margin: 15mm; } }
      </style></head><body>` + el.innerHTML + `</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  }

  if (!invoiceData) return null;
  const { clinic, year, month, notes, totalGiko, totalMaterial, totalTax, totalAmount } = invoiceData;
  const baseUp    = totalBaseUp ?? invoiceData.totalBaseUp ?? 0;
  const showBaseUp = baseUp > 0;
  const grandTotal = totalAmount + carryOver;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  // 保険・自費内訳
  const totalGikoHoken = notes.reduce((s, n) => {
    return s + (n.rows || []).filter(r => r.category === '保').reduce((a, r) => a + (r.amount || 0), 0);
  }, 0);
  const totalGikoJihi = totalGiko - totalGikoHoken;

  // 明細テーブルの列定義（ベースアップ支援料は金額があるときのみ）
  const detailCols  = showBaseUp
    ? ['納品No','指示書No','患者名','納品日','（技工）','（材料）','ﾍﾞｰｽｱｯﾌﾟ支援料','消費税','納品額']
    : ['納品No','指示書No','患者名','納品日','（技工）','（材料）','消費税','納品額'];
  const colWidths = showBaseUp
    ? ['9%','9%','19%','11%','11%','9%','10%','9%','13%']
    : ['10%','10%','22%','12%','13%','12%','11%','10%'];

  const printContent = (
    <div style={{ fontFamily: "'Hiragino Kaku Gothic ProN','Meiryo',sans-serif", fontSize: 11, color: '#222' }}>

      {/* ─── ヘッダー行：タイトル（左）+ 請求日（右） ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
        <div style={{
          fontSize: 30, fontWeight: 'bold', color: GREEN,
          borderTop: `1.5px solid ${GREEN}`,
          borderBottom: `2.5px solid ${GREEN}`,
          padding: '5px 6px',
          letterSpacing: '0.45em',
        }}>
          請　求　書
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, paddingBottom: 4 }}>
          請求日　{fmtJP(todayStr)}
        </div>
      </div>

      {/* ─── 医院名（左）+ 弊社情報（右） ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          fontSize: 16, fontWeight: 'bold',
          borderBottom: '1.5px solid #333',
          paddingBottom: 5, minWidth: 260,
        }}>
          {clinic.name}　様
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, lineHeight: 2 }}>
          <div style={{ fontWeight: 'bold', color: GREEN, fontSize: 12 }}>デンタル　テック　アライズ</div>
          <div>〒601-8472</div>
          <div>京都市南区八条坊門町7-6</div>
          <div>インボイス登録番号　T3-8103-2874-8548</div>
        </div>
      </div>

      {/* ─── 今回御請求額（ラベル + 金額 横並び） ─── */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: '#333' }}>今回御請求額</span>
        <span style={{
          fontSize: 36, fontWeight: 'bold', color: GREEN,
          borderBottom: `2px solid ${GREEN}`,
          paddingBottom: 2,
        }}>
          ¥{fmt(grandTotal)}
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#333', marginBottom: 14 }}>
        {year}年{month}月分技工代金を御請求申し上げます。
      </div>

      {/* ─── 集計サマリーテーブル（¥なし・PDF準拠） ─── */}
      <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 6 }}>
        <thead>
          <tr>
            {['前回御請求額','前回御入金額','調整額','繰越額','（技工）','（材料）','消費税','今回納品額'].map(h => (
              <th key={h} style={TH()}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={TD({ textAlign: 'right' })}>{fmt(prevCharge)}</td>
            <td style={TD({ textAlign: 'right' })}>{fmt(prevPayment)}</td>
            <td style={TD({ textAlign: 'right' })}>{fmt0(adjustment)}</td>
            <td style={TD({ textAlign: 'right', fontWeight: 'bold' })}>{fmt(carryOver)}</td>
            <td style={TD({ textAlign: 'right' })}>{fmt(totalGiko)}</td>
            <td style={TD({ textAlign: 'right' })}>{fmt(totalMaterial)}</td>
            <td style={TD({ textAlign: 'right' })}>{fmt(totalTax)}</td>
            <td style={TD({ textAlign: 'right', fontWeight: 'bold' })}>{fmt(totalAmount)}</td>
          </tr>
        </tbody>
      </table>

      {/* ─── 技工内訳 ─── */}
      <div style={{ fontSize: 11, color: '#333', marginBottom: showBaseUp ? 4 : 14 }}>
        技工内訳　（保険）　{fmt(totalGikoHoken)}　　（自費）　{fmt(totalGikoJihi)}
      </div>
      {showBaseUp && (
        <div style={{ fontSize: 11, color: '#333', marginBottom: 14 }}>
          ベースアップ支援料合計　¥{fmt(baseUp)}
        </div>
      )}

      {/* ─── 明細テーブル（患者名→納品日 順、¥なし） ─── */}
      <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 18, tableLayout: 'fixed' }}>
        <colgroup>
          {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
        </colgroup>
        <thead>
          <tr>
            {detailCols.map(h => <th key={h} style={TH()}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {notes.length === 0 && (
            <tr><td colSpan={detailCols.length} style={TD({ textAlign: 'center', color: '#888' })}>対象期間の納品書がありません</td></tr>
          )}
          {notes.map(n => (
            <tr key={n.id}>
              <td style={TD({ textAlign: 'center' })}>{n.deliveryNo}</td>
              <td style={TD({ textAlign: 'center' })}>{n.shiki || ''}</td>
              <td style={TD()}>{n.patientName}</td>
              <td style={TD({ textAlign: 'center' })}>{fmtDate(n.deliveryDate)}</td>
              <td style={TD({ textAlign: 'right' })}>{fmt0(n.subtotalGiko)}</td>
              <td style={TD({ textAlign: 'right' })}>{fmt0(n.subtotalMaterial)}</td>
              {showBaseUp && <td style={TD({ textAlign: 'right' })}>{n.baseUpSupport > 0 ? fmt(n.baseUpSupport) : ''}</td>}
              <td style={TD({ textAlign: 'right' })}>{fmt(n.tax)}</td>
              <td style={TD({ textAlign: 'right', fontWeight: 'bold' })}>{fmt(n.total)}</td>
            </tr>
          ))}
          {/* 合計行 */}
          <tr style={{ background: '#f0f9f4' }}>
            <td colSpan={4} style={TD({ textAlign: 'right', fontWeight: 'bold', background: '#f0f9f4' })}>合　計</td>
            <td style={TD({ textAlign: 'right', fontWeight: 'bold', background: '#f0f9f4' })}>{fmt(totalGiko)}</td>
            <td style={TD({ textAlign: 'right', fontWeight: 'bold', background: '#f0f9f4' })}>{fmt0(totalMaterial)}</td>
            {showBaseUp && <td style={TD({ textAlign: 'right', fontWeight: 'bold', background: '#f0f9f4' })}>{fmt(baseUp)}</td>}
            <td style={TD({ textAlign: 'right', fontWeight: 'bold', background: '#f0f9f4' })}>{fmt(totalTax)}</td>
            <td style={TD({ textAlign: 'right', fontWeight: 'bold', background: '#f0f9f4' })}>{fmt(totalAmount)}</td>
          </tr>
        </tbody>
      </table>

      {/* ─── フッター（振込口座） ─── */}
      {bankInfo && (
        <div style={{ border: `1px solid ${GREEN}`, borderRadius: 4, padding: '7px 12px', fontSize: 11, color: '#333' }}>
          <span style={{ fontWeight: 'bold', color: GREEN }}>【お振込み口座】</span>
          {'　'}
          <span style={{ whiteSpace: 'pre-wrap' }}>{bankInfo}</span>
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
      <div ref={printRef} style={{ border: '1px solid #ccc', borderRadius: 8, padding: '15mm', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        {printContent}
      </div>
    </div>
  );
}
