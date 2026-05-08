import { useEffect } from 'react';

export default function MetalReceiptPrint({
  clinicName, receiptDate, metalType, depositWeight,
  balanceBefore, clinicAllBalances, onClose,
}) {
  useEffect(() => {
    document.body.classList.add('printing-receipt');
    const t = setTimeout(() => window.print(), 350);
    return () => {
      clearTimeout(t);
      document.body.classList.remove('printing-receipt');
    };
  }, []);

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

  const th = { padding: '7px 12px', textAlign: 'center', border: '1px solid #aaa', background: '#1a3a5c', color: '#fff' };
  const td = (extra = {}) => ({ padding: '8px 12px', border: '1px solid #ccc', ...extra });

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body.printing-receipt > *:not(.receipt-root) { display: none !important; }
          body.printing-receipt .receipt-root {
            position: fixed !important; top: 0; left: 0;
            width: 100%; height: 100%; background: white !important;
            overflow: visible !important; z-index: 99999;
          }
          body.printing-receipt .no-print { display: none !important; }
          body.printing-receipt .receipt-modal {
            position: static !important; box-shadow: none !important;
            max-height: none !important; overflow: visible !important;
          }
        }
      `}</style>

      <div className="receipt-root" style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      }}>
        <div className="receipt-modal" style={{
          background: 'white', padding: '20mm 20mm 16mm', width: '210mm',
          maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box',
        }}>

          {/* 操作ボタン */}
          <div className="no-print" style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'flex-end' }}>
            <button onClick={() => window.print()}
              style={{ padding: '6px 20px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
              印刷
            </button>
            <button onClick={onClose}
              style={{ padding: '6px 16px', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer' }}>
              閉じる
            </button>
          </div>

          {/* ヘッダー */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
            <div style={{
              fontSize: 24, fontWeight: 'bold', color: '#1a3a5c',
              borderBottom: '2.5px solid #1a3a5c', paddingBottom: 6, letterSpacing: '0.25em',
            }}>
              材 料 預 り 票
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, lineHeight: 2 }}>
              <div>発行日　{fmtJP(todayStr)}</div>
              <div style={{ fontWeight: 'bold', fontSize: 13 }}>デンタル　テック　アライズ</div>
              <div>京都市南区八条坊門町7-6</div>
              <div>インボイス登録番号</div>
              <div>T3-8103-2874-8548</div>
              <div>TEL 075-682-8338</div>
              <div>FAX 075-682-8338</div>
            </div>
          </div>

          {/* 医院名 */}
          <div style={{
            fontSize: 16, borderBottom: '1.5px solid #333',
            paddingBottom: 5, marginBottom: 28, display: 'inline-block', minWidth: 260,
          }}>
            {clinicName || '（医院名未入力）'}　様
          </div>

          {/* 上部テーブル：預かり内容 */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 36, fontSize: 13 }}>
            <thead>
              <tr>
                {['預り材名', 'お預り日', '受入前残', 'お預り量', '計'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={td({ textAlign: 'center' })}>{metalType}</td>
                <td style={td({ textAlign: 'center' })}>{fmtJP(receiptDate)}</td>
                <td style={td({ textAlign: 'right' })}>{balanceBefore.toFixed(2)} g</td>
                <td style={td({ textAlign: 'right' })}>{depositWeight.toFixed(2)} g</td>
                <td style={td({ textAlign: 'right', fontWeight: 'bold' })}>{balanceAfter.toFixed(2)} g</td>
              </tr>
            </tbody>
          </table>

          {/* 下部テーブル：残量サマリー */}
          <div style={{ color: '#1a3a5c', fontWeight: 'bold', marginBottom: 8, fontSize: 13 }}>
            預かり金属残量(g)　{fmtSlash(todayStr)}現在
          </div>
          <table style={{ width: '55%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['金属名', '残量'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((row, i) => (
                <tr key={i}>
                  <td style={td({ textAlign: 'center' })}>{row ? row.metalType : ' '}</td>
                  <td style={td({ textAlign: 'right' })}>{row ? `${row.balance.toFixed(2)} g` : ' '}</td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>
    </>
  );
}
