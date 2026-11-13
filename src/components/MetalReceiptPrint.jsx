import { useRef } from 'react';

const BLUE     = '#1a3a5c';
const BLUE_BG  = '#d6e8f7';
const BORDER   = '1px solid #b0c8e0';

const PRINT_CSS = `
  @page { size: A5 landscape; margin: 10mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Hiragino Kaku Gothic ProN','Meiryo',sans-serif;
    font-size: 12px; color: #222; margin: 0; padding: 0;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  table { border-collapse: collapse; }
  th { padding: 5px 10px; text-align: center; background: ${BLUE_BG}; color: ${BLUE};
       border: ${BORDER}; font-weight: bold; font-size: 12px; }
  td { padding: 6px 10px; border: ${BORDER}; font-size: 12px; }
`;

export default function MetalReceiptPrint({
  clinicName, receiptDate, metalType, depositWeight,
  balanceBefore, clinicAllBalances, onClose,
}) {
  const printRef = useRef();

  function fmtJP(str) {
    if (!str) return '';
    const d = new Date(str + 'T00:00:00');
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }
  function fmtSlash(str) {
    if (!str) return '';
    const d = new Date(str + 'T00:00:00');
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const balanceAfter = balanceBefore + depositWeight;

  const MIN_ROWS = 5;
  const summaryRows = [...clinicAllBalances];
  while (summaryRows.length < MIN_ROWS) summaryRows.push(null);

  function handlePrint() {
    const el = printRef.current;
    if (!el) return;
    const win = window.open('', '_blank', 'width=800,height=600');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>預かり票</title>
      <style>${PRINT_CSS}</style>
    </head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        background: 'white',
        width: '210mm',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '10mm 12mm',
        boxSizing: 'border-box',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
      }}>
        {/* 操作ボタン */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, justifyContent: 'flex-end' }}>
          <button onClick={handlePrint} style={{
            padding: '6px 20px', background: BLUE, color: '#fff',
            border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold',
          }}>印刷</button>
          <button onClick={onClose} style={{
            padding: '6px 16px', background: '#f0f0f0',
            border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer',
          }}>閉じる</button>
        </div>

        {/* 印刷内容 */}
        <div ref={printRef}>
          {/* ヘッダー */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div style={{
              fontSize: 22, fontWeight: 'bold', color: BLUE,
              borderBottom: `2.5px solid ${BLUE}`,
              paddingBottom: 5, letterSpacing: '0.3em',
              alignSelf: 'flex-end',
            }}>
              材 料 預 り 票
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, lineHeight: 1.9, color: '#222' }}>
              <div>発行日　{fmtJP(todayStr)}</div>
              <div style={{ fontWeight: 'bold', fontSize: 12 }}>デンタル　テック　アライズ</div>
              <div>京都市南区八条坊門町７－６</div>
              <div>インボイス登録番号</div>
              <div>T3-8103-2874-8548</div>
              <div>TEL 075-682-8338</div>
              <div>FAX 075-682-8338</div>
            </div>
          </div>

          {/* 医院名 */}
          <div style={{
            fontSize: 15, fontWeight: 'bold',
            borderBottom: '1.5px solid #333',
            paddingBottom: 4, marginBottom: 18,
            display: 'inline-block', minWidth: 220,
          }}>
            {clinicName || '（医院名未入力）'}　様
          </div>

          {/* 2カラムレイアウト */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            {/* 左：預かり内容 */}
            <div style={{ flex: '1 1 55%' }}>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    {['預り材名', 'お預り日', '受入前残', 'お預り量', '計'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ textAlign: 'center' }}>{metalType}</td>
                    <td style={{ textAlign: 'center' }}>{fmtSlash(receiptDate)}</td>
                    <td style={{ textAlign: 'right' }}>{balanceBefore.toFixed(2)} g</td>
                    <td style={{ textAlign: 'right' }}>{depositWeight.toFixed(2)} g</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{balanceAfter.toFixed(2)} g</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 右：残量サマリー */}
            <div style={{ flex: '0 0 auto', minWidth: 180 }}>
              <div style={{
                color: BLUE, fontWeight: 'bold', fontSize: 11, marginBottom: 5,
                background: BLUE_BG, padding: '4px 8px', borderRadius: 4,
              }}>
                預かり金属残量(g)　{fmtSlash(todayStr)}現在
              </div>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    {['金属名', '残量'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map((row, i) => (
                    <tr key={i}>
                      <td style={{ textAlign: 'center' }}>{row ? row.metalType : ' '}</td>
                      <td style={{ textAlign: 'right' }}>{row ? `${row.balance.toFixed(2)} g` : ' '}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>{/* end printRef */}
      </div>
    </div>
  );
}
