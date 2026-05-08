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

  const BLUE     = '#1a3a5c';
  const BLUE_BG  = '#d6e8f7';
  const BORDER   = '1px solid #b0c8e0';

  const thStyle = {
    padding: '5px 10px',
    textAlign: 'center',
    background: BLUE_BG,
    color: BLUE,
    border: BORDER,
    fontWeight: 'bold',
    fontSize: 12,
  };
  const tdStyle = (extra = {}) => ({
    padding: '6px 10px',
    border: BORDER,
    fontSize: 12,
    ...extra,
  });

  return (
    <>
      <style>{`
        @media print {
          @page { size: A5 landscape; margin: 10mm; }
          body.printing-receipt > *:not(.receipt-root) { display: none !important; }
          body.printing-receipt .receipt-root {
            position: fixed !important;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: white !important;
            z-index: 99999;
          }
          body.printing-receipt .no-print { display: none !important; }
          body.printing-receipt .receipt-modal {
            position: static !important;
            box-shadow: none !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* オーバーレイ背景 */}
      <div className="receipt-root" style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
      }}>
        {/* A5横サイズ相当のカード */}
        <div className="receipt-modal" style={{
          background: 'white',
          width: '210mm',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '10mm 12mm',
          boxSizing: 'border-box',
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
        }}>

          {/* 操作ボタン（印刷非表示） */}
          <div className="no-print" style={{ display: 'flex', gap: 8, marginBottom: 14, justifyContent: 'flex-end' }}>
            <button onClick={() => window.print()} style={{
              padding: '6px 20px', background: BLUE, color: '#fff',
              border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold',
            }}>印刷</button>
            <button onClick={onClose} style={{
              padding: '6px 16px', background: '#f0f0f0',
              border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer',
            }}>閉じる</button>
          </div>

          {/* ─── ヘッダー（2カラム） ─── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            {/* 左：タイトル */}
            <div style={{
              fontSize: 22, fontWeight: 'bold', color: BLUE,
              borderBottom: `2.5px solid ${BLUE}`,
              paddingBottom: 5, letterSpacing: '0.3em',
              alignSelf: 'flex-end',
            }}>
              材 料 預 り 票
            </div>

            {/* 右：発行者情報 */}
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

          {/* ─── 医院名 ─── */}
          <div style={{
            fontSize: 15, fontWeight: 'bold',
            borderBottom: `1.5px solid #333`,
            paddingBottom: 4, marginBottom: 18,
            display: 'inline-block', minWidth: 220,
          }}>
            {clinicName || '（医院名未入力）'}　様
          </div>

          {/* ─── 2カラムレイアウト（上部テーブル ／ 下部テーブル） ─── */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

            {/* 左：上部テーブル（預かり内容） */}
            <div style={{ flex: '1 1 55%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['預り材名', 'お預り日', '受入前残', 'お預り量', '計'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={tdStyle({ textAlign: 'center' })}>{metalType}</td>
                    <td style={tdStyle({ textAlign: 'center' })}>{fmtSlash(receiptDate)}</td>
                    <td style={tdStyle({ textAlign: 'right' })}>{balanceBefore.toFixed(2)} g</td>
                    <td style={tdStyle({ textAlign: 'right' })}>{depositWeight.toFixed(2)} g</td>
                    <td style={tdStyle({ textAlign: 'right', fontWeight: 'bold' })}>{balanceAfter.toFixed(2)} g</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 右：下部テーブル（残量サマリー） */}
            <div style={{ flex: '0 0 auto', minWidth: 180 }}>
              <div style={{
                color: BLUE, fontWeight: 'bold', fontSize: 11, marginBottom: 5,
                background: BLUE_BG, padding: '4px 8px', borderRadius: 4,
              }}>
                預かり金属残量(g)　{fmtSlash(todayStr)}現在
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['金属名', '残量'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map((row, i) => (
                    <tr key={i}>
                      <td style={tdStyle({ textAlign: 'center' })}>{row ? row.metalType : ' '}</td>
                      <td style={tdStyle({ textAlign: 'right' })}>{row ? `${row.balance.toFixed(2)} g` : ' '}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>{/* end 2カラム */}

        </div>{/* end receipt-modal */}
      </div>{/* end receipt-root */}
    </>
  );
}
