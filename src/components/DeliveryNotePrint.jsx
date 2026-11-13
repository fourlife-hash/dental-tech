import { useRef } from 'react';
import { CrossDiagram, parseCross } from './ToothSelector.jsx';

const COMPANY = {
  name:    'デンタル テック アライズ',
  zip:     '〒601-8472',
  address: '京都市南区八条坊門町7-6',
  invoice: 'インボイス登録番号 T3-8103-2874-8548',
};

function fmtDate(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}
function fmtYen(n) { return `¥${(n || 0).toLocaleString()}`; }

// 印刷用CSS（A5横・行重なり防止・改ページ最適化）
const PRINT_CSS = `
  @page { size: A5 landscape; margin: 6mm 8mm 6mm 15mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Hiragino Kaku Gothic ProN','Meiryo',sans-serif;
    font-size: 8.5pt; color: #222; margin: 0; padding: 0;
  }
  .dp-page {
    width: 100%;
    min-height: 100%;
  }
  .dp-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 2mm;
  }
  .dp-header-left {
    display: flex; flex-direction: column;
  }
  .dp-title {
    font-size: 18pt; font-weight: 700; letter-spacing: 0.3em;
    color: #4A90D9; border-bottom: none;
    padding-bottom: 1mm; line-height: 1.2;
    margin-bottom: 2mm;
  }
  .dp-clinic-line {
    font-size: 11pt; font-weight: 700;
    border-bottom: 1pt solid #333;
    padding-bottom: 1mm;
    display: inline-block; min-width: 50mm;
  }
  .dp-company-right { text-align: right; font-size: 8pt; line-height: 1.6; }
  .dp-company-name  { font-weight: 700; font-size: 9.5pt; }
  
  table { border-collapse: collapse; width: 100%; page-break-inside: auto; }
  tr    { page-break-inside: avoid; page-break-after: auto; }
  
  .dp-table th {
    background: #2c5282; color: #fff; padding: 3px 4px;
    font-size: 8.5pt; border: 0.5pt solid #3a6aaa; text-align: center;
  }
  .dp-table td {
    padding: 2.5px 4px; font-size: 8.5pt;
    border-right: 0.5pt solid #bbb;
    border-bottom: none; border-top: none; border-left: none;
    vertical-align: middle; line-height: 1.3;
  }
  .dp-empty-row td { border-bottom: 0.5pt solid #ddd; }
  .dp-center { text-align: center; }
  .dp-right  { text-align: right; }
  .dp-no     { font-size: 7pt; color: #555; }
  
  /* フッターを絶対配置から通常のブロック配置に変更し、上部マージンで重なりを防止 */
  .dp-bottom { 
    margin-top: 3mm; 
    page-break-inside: avoid; 
  }
  .dp-total-bar { width: 100%; border-collapse: collapse; }
  .dp-bar-label {
    background: #333; color: #fff; padding: 2px 4px;
    font-size: 8pt; font-weight: 700; border: 0.5pt solid #555;
    text-align: center; white-space: nowrap;
  }
  .dp-bar-value {
    text-align: right; padding: 2px 5px;
    border: 0.5pt solid #bbb; font-size: 8.5pt; min-width: 14mm;
  }
  .dp-bar-total { font-weight: 700; font-size: 9.5pt; }
  .dp-metal-text { font-size: 7.5pt; margin-top: 1.5mm; }
`;

export default function DeliveryNotePrint({ note, notes, metalBalance, onClose }) {
  const printRef = useRef();

  const noteList = notes ?? (note ? [note] : []);
  if (noteList.length === 0) return null;

  const clinicName   = noteList[0].clinicName;
  const deliveryDate = noteList[0].deliveryDate;

  const totals = noteList.reduce(
    (acc, n) => ({
      subtotalGiko:    acc.subtotalGiko    + (n.subtotalGiko    || 0),
      subtotalMaterial: acc.subtotalMaterial + (n.subtotalMaterial || 0),
      tax:             acc.tax             + (n.tax             || 0),
      total:           acc.total           + (n.total           || 0),
      baseUpSupport: acc.baseUpSupport + (n.baseUpSupport || 0),
    }),
    { subtotalGiko: 0, subtotalMaterial: 0, tax: 0, total: 0, baseUpSupport: 0 }
  );

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
    if (parseCross(shiki)) return <CrossDiagram shiki={shiki} cellSize={28} fontSize="8.5pt" borderColor="#333" fillParent={true} />;
    return shiki;
  }

  const content = (
    <div ref={printRef} className="dp-page">
      {/* ヘッダー：左にタイトル+医院名、右に会社情報 */}
      <div className="dp-header">
        <div className="dp-header-left">
          <div className="dp-title">納 品 書</div>
          <div className="dp-clinic-line">{clinicName}&emsp;様</div>
        </div>
        <div className="dp-company-right">
          <div>納品日 {fmtDate(deliveryDate)}</div>
          <div className="dp-company-name">{COMPANY.name}</div>
          <div>{COMPANY.zip}</div>
          <div>{COMPANY.address}</div>
          <div>{COMPANY.invoice}</div>
        </div>
      </div>

      {/* 明細テーブル */}
      <div className="dp-table-wrap">
      <table className="dp-table">
        <colgroup>
          <col style={{ width: '14%' }} />
          <col style={{ width: '24%' }} />
          <col style={{ width: '28%' }} />
          <col style={{ width: '5%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '5%' }} />
          <col style={{ width: '13%' }} />
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
              {(() => {
                const rows = n.rows || [];
                const B = '0.5pt solid #bbb';
                const hasMetal = n.paraGram > 0 || n.miroGram > 0;
                const metalText = [
                  n.paraGram > 0 ? `パラ ${n.paraGram}g` : '',
                  n.miroGram > 0 ? `ミロ ${n.miroGram}g` : '',
                ].filter(Boolean).join(' ');

                const displayRows = rows.length > 0 ? rows : [{ gikobutsuName: '再製', category: '', unitPrice: 0, quantity: '', amount: 0 }];
                const emptyNote = rows.length === 0;

                return (
                  <>
                    {displayRows.map((row, i) => {
                      const last = !hasMetal && i === displayRows.length - 1;
                      const bB = last ? B : 'none';
                      return (
                        <tr key={i}>
                          {i === 0 && (
                            <td rowSpan={Math.max(displayRows.length, 1) + (hasMetal ? 1 : 0)}
                                style={{ verticalAlign:'middle', borderLeft:B, borderRight:B, borderBottom:B, padding:'3px' }}>
                              <div className="dp-no">{n.deliveryNo}</div>
                              {isNew ? n.patientName : row.patientName}
                            </td>
                          )}
                          {i === 0 && (
                            <td rowSpan={Math.max(displayRows.length, 1) + (hasMetal ? 1 : 0)}
                                style={{ textAlign:'center', verticalAlign:'middle', borderRight:B, borderBottom:B }}>
                              {renderShiki(isNew ? n.shiki : row.shiki)}
                            </td>
                          )}
                          <td style={{ borderBottom:bB, borderRight:B, color: emptyNote ? '#888' : undefined }}>{row.gikobutsuName}</td>
                          <td style={{ borderBottom:bB, borderRight:B, textAlign:'center' }}>{row.category}</td>
                          <td style={{ borderBottom:bB, borderRight:B, textAlign:'right' }}>{row.unitPrice ? fmtYen(row.unitPrice) : ''}</td>
                          <td style={{ borderBottom:bB, borderRight:B, textAlign:'center' }}>{row.quantity}</td>
                          <td style={{ borderBottom:bB, textAlign:'right' }}>{emptyNote ? '¥0' : row.amount ? fmtYen(row.amount) : ''}</td>
                        </tr>
                      );
                    })}
                    {hasMetal && (
                      <tr>
                        <td style={{ borderBottom:B, borderRight:B, textAlign:'right', fontSize:'7.5pt', color:'#444', padding:'1px 6px', fontStyle:'italic' }}>
                          {metalText}
                        </td>
                        <td style={{ borderBottom:B, borderRight:B }}></td>
                        <td style={{ borderBottom:B, borderRight:B }}></td>
                        <td style={{ borderBottom:B, borderRight:B }}></td>
                        <td style={{ borderBottom:B }}></td>
                      </tr>
                    )}
                  </>
                );
              })()}
            </tbody>
          );
        })}

      </table>

      </div>

      {/* フッター領域（重なりを防止して直下に配置） */}
      <div className="dp-bottom">
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

        {metalBalance && (() => {
          const now = new Date();
          const parts = [];
          if (metalBalance.para !== 0) parts.push(`パラ 残${metalBalance.para.toFixed(1)}g`);
          if (metalBalance.miro !== 0) parts.push(`ミロ 残${metalBalance.miro.toFixed(1)}g`);
          return <div className="dp-metal-text">{parts.join(' ')} {now.getMonth()+1}月{now.getDate()}日現在</div>;
        })()}
      </div>
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