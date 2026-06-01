import { useRef } from 'react';
import { CrossDiagram, parseCross } from './ToothSelector.jsx';

const COMPANY = {
  name:    'デンタル　テック　アライズ',
  zip:     '〒601-8472',
  address: '京都市南区八条坊門町7-6',
  invoice: 'インボイス登録番号　T3-8103-2874-8548',
};

const BLUE = '#4A90D9';
const MIN_ROWS = 13; // ページを埋めるのに必要な空白行数

function fmtDate(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}
function fmtYen(n) { return `¥${(n || 0).toLocaleString()}`; }

// 印刷用CSS（A5横・グレースケール・フッター底固定）
const PRINT_CSS = `
  @page { size: A5 landscape; margin: 8mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Hiragino Kaku Gothic ProN','Meiryo',sans-serif;
    font-size: 9pt; color: #222; margin: 0; padding: 0;
  }
  .dp-page { width: 100%; }
  .dp-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 1.5mm;
  }
  .dp-title {
    font-size: 20pt; font-weight: 700; letter-spacing: 0.3em;
    color: #222; border-bottom: 2pt solid #222;
    padding-bottom: 1mm; line-height: 1.2;
  }
  .dp-company-right { text-align: right; font-size: 8pt; line-height: 1.8; }
  .dp-company-name  { font-weight: 700; font-size: 10pt; }
  .dp-clinic-line {
    font-size: 12pt; font-weight: 700;
    border-bottom: 1pt solid #333;
    padding-bottom: 1mm; margin-bottom: 2mm;
    display: inline-block; min-width: 50mm;
  }
  /* テーブルは自然な高さ・空白行を固定高さで埋める */
  .dp-table-wrap { }
  table { border-collapse: collapse; width: 100%; }
  .dp-table { }
  .dp-empty-row td { height: 5.5mm; }
  .dp-table th {
    background: #333; color: #fff; padding: 3px 4px;
    font-size: 8.5pt; border: 0.5pt solid #555; text-align: center;
  }
  .dp-table td {
    padding: 3.5px 4px; font-size: 9pt;
    border: 0.5pt solid #bbb; vertical-align: middle; line-height: 1.4;
  }
  .dp-empty-row td { border-color: #ddd; }
  .dp-center { text-align: center; }
  .dp-right  { text-align: right; }
  .dp-no     { font-size: 7pt; color: #555; }
  .dp-empty-row td { border-color: #ddd; }
  .dp-col-no-patient { width: 20%; }
  .dp-col-shiki      { width: 10%; }
  .dp-col-giko       { width: 32%; }
  .dp-col-cat        { width: 7%;  }
  .dp-col-price      { width: 12%; }
  .dp-col-qty        { width: 7%;  }
  .dp-col-amount     { width: 12%; }
  /* フッターバー */
  .dp-total-bar { width: 100%; border-collapse: collapse; margin-top: 0; }
  .dp-bar-label {
    background: #333; color: #fff; padding: 3px 5px;
    font-size: 8.5pt; font-weight: 700; border: 0.5pt solid #555;
    text-align: center; white-space: nowrap;
  }
  .dp-bar-value {
    text-align: right; padding: 3px 6px;
    border: 0.5pt solid #bbb; font-size: 9pt; min-width: 16mm;
  }
  .dp-bar-total { font-weight: 700; font-size: 10pt; }
  .dp-metal-text { font-size: 8pt; margin-top: 2mm; }
`;

export default function DeliveryNotePrint({ note, notes, metalBalance, onClose }) {
  const printRef = useRef();

  const noteList = notes ?? (note ? [note] : []);
  if (noteList.length === 0) return null;

  const clinicName   = noteList[0].clinicName;
  const deliveryDate = noteList[0].deliveryDate;

  const totals = noteList.reduce(
    (acc, n) => ({
      subtotalGiko:  acc.subtotalGiko  + (n.subtotalGiko  || 0),
      subtotalMaterial: acc.subtotalMaterial + (n.subtotalMaterial || 0),
      tax:           acc.tax           + (n.tax           || 0),
      total:         acc.total         + (n.total         || 0),
      baseUpSupport: acc.baseUpSupport + (n.baseUpSupport || 0),
    }),
    { subtotalGiko: 0, subtotalMaterial: 0, tax: 0, total: 0, baseUpSupport: 0 }
  );

  const totalDataRows = noteList.reduce((s, n) => s + (n.rows?.length || 0), 0);
  const emptyCount    = Math.max(0, MIN_ROWS - totalDataRows);

  function handlePrint() {
    const el = printRef.current;
    if (!el) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>${PRINT_CSS}</style>
    </head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  }

  // 部位セルの描画（十字図 or プレーンテキスト）
  function renderShiki(shiki) {
    if (!shiki) return '';
    if (parseCross(shiki)) return <CrossDiagram shiki={shiki} cellSize={13} fontSize="8pt" borderColor="#666" />;
    return shiki;
  }

  const content = (
    <div ref={printRef} className="dp-page">
      {/* ヘッダー */}
      <div className="dp-header">
        <div className="dp-title-left">
          <div className="dp-title">納　品　書</div>
        </div>
        <div className="dp-company-right">
          <div>納品日　{fmtDate(deliveryDate)}</div>
          <div className="dp-company-name">{COMPANY.name}</div>
          <div>{COMPANY.zip}</div>
          <div>{COMPANY.address}</div>
          <div>{COMPANY.invoice}</div>
        </div>
      </div>

      {/* 医院名 */}
      <div className="dp-clinic-line">{clinicName}&emsp;様</div>

      {/* 明細テーブル（flex:1 で残り高さを全て使う） */}
      <div className="dp-table-wrap">
      <table className="dp-table">
        <colgroup>
          <col className="dp-col-no-patient" />
          <col className="dp-col-shiki" />
          <col className="dp-col-giko" />
          <col className="dp-col-cat" />
          <col className="dp-col-price" />
          <col className="dp-col-qty" />
          <col className="dp-col-amount" />
        </colgroup>
        <thead>
          <tr>
            <th>納品No・患者名</th><th>部位</th><th>納品技工製品名</th>
            <th>区分</th><th>単価</th><th>数量</th><th>金額</th>
          </tr>
        </thead>

        {noteList.map((n) => {
          const isNew = Boolean(n.patientName);
          return (
            <tbody key={n.id}>
              {isNew ? (n.rows || []).map((row, i) => (
                <tr key={i}>
                  <td>
                    {i === 0 && <><div className="dp-no">No.{n.deliveryNo}</div><div>{n.patientName}</div></>}
                  </td>
                  <td style={{ textAlign:'center', verticalAlign:'middle' }}>
                    {i === 0 ? renderShiki(n.shiki) : ''}
                  </td>
                  <td>{row.gikobutsuName}</td>
                  <td className="dp-center">{row.category}</td>
                  <td className="dp-right">{row.unitPrice ? fmtYen(row.unitPrice) : ''}</td>
                  <td className="dp-center">{row.quantity}</td>
                  <td className="dp-right">{row.amount ? fmtYen(row.amount) : ''}</td>
                </tr>
              )) : (n.rows || []).map((row, i) => (
                <tr key={i}>
                  <td>{i === 0 && <div className="dp-no">No.{n.deliveryNo}</div>}{row.patientName}</td>
                  <td style={{ textAlign:'center', verticalAlign:'middle' }}>{renderShiki(row.shiki)}</td>
                  <td>{row.gikobutsuName}</td>
                  <td className="dp-center">{row.category}</td>
                  <td className="dp-right">{row.unitPrice ? fmtYen(row.unitPrice) : ''}</td>
                  <td className="dp-center">{row.quantity}</td>
                  <td className="dp-right">{row.amount ? fmtYen(row.amount) : ''}</td>
                </tr>
              ))}
            </tbody>
          );
        })}

        {emptyCount > 0 && (
          <tbody>
            {Array.from({ length: emptyCount }).map((_, i) => (
              <tr key={`e-${i}`} className="dp-empty-row">
                <td colSpan={7}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        )}
      </table>

      </div>{/* end dp-table-wrap */}

      {/* 横フッターバー */}
      <table className="dp-total-bar">
        <tbody>
          <tr>
            <td className="dp-bar-label">技工</td>
            <td className="dp-bar-value">{(totals.subtotalGiko || 0).toLocaleString()}</td>
            <td className="dp-bar-label">材料</td>
            <td className="dp-bar-value">{(totals.subtotalMaterial || 0).toLocaleString()}</td>
            <td className="dp-bar-label">消費税</td>
            <td className="dp-bar-value">{(totals.tax || 0).toLocaleString()}</td>
            {totals.baseUpSupport > 0 && <>
              <td className="dp-bar-label">ﾍﾞｰｽｱｯﾌﾟ</td>
              <td className="dp-bar-value">{totals.baseUpSupport.toLocaleString()}</td>
            </>}
            <td className="dp-bar-label">合計納品額</td>
            <td className="dp-bar-value dp-bar-total">{fmtYen(totals.total)}</td>
          </tr>
        </tbody>
      </table>

      {/* 金属残量 */}
      {metalBalance && (() => {
        const now = new Date();
        const parts = [];
        if (metalBalance.para > 0) parts.push(`パラ 残${metalBalance.para.toFixed(1)}g`);
        if (metalBalance.miro > 0) parts.push(`ミロ 残${metalBalance.miro.toFixed(1)}g`);
        if (!parts.length) return null;
        return <div className="dp-metal-text">{parts.join('　')}　{now.getMonth()+1}月{now.getDate()}日現在</div>;
      })()}
    </div>
  );

  return (
    <div className="print-overlay">
      <div className="print-controls no-print">
        <button className="submit-btn" onClick={handlePrint}>印刷実行</button>
        <button className="cancel-btn" onClick={onClose}>閉じる</button>
      </div>
      <div className="print-page" style={{ padding: '8mm' }}>
        {content}
      </div>
    </div>
  );
}
