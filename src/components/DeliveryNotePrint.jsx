const COMPANY = {
  name:    'デンタル テック アライズ',
  address: '〒601-8414 京都市南区八条坊門町7-6',
  invoice: 'T3-8103-2874-8548',
};

function fmtDate(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}

function fmtYen(n) {
  return `¥${(n || 0).toLocaleString()}`;
}

export default function DeliveryNotePrint({ note, onClose }) {
  function handlePrint() { window.print(); }

  // 新フォーマット：patientName がある（1患者・複数技工物）
  const isNewFormat = Boolean(note.patientName);
  const MIN_ROWS = 8;

  return (
    <div className="print-overlay">
      <div className="print-controls no-print">
        <button className="submit-btn" onClick={handlePrint}>印刷実行</button>
        <button className="cancel-btn" onClick={onClose}>閉じる</button>
      </div>

      <div className="print-page">
        {/* ヘッダー */}
        <div className="dp-header">
          <div className="dp-company">
            <div className="dp-company-name">{COMPANY.name}</div>
            <div className="dp-company-sub">{COMPANY.address}</div>
            <div className="dp-company-sub">登録番号 {COMPANY.invoice}</div>
          </div>
          <div className="dp-title-block">
            <div className="dp-title">納 品 書</div>
            <div className="dp-meta">No.{note.deliveryNo}</div>
            <div className="dp-meta">{fmtDate(note.deliveryDate)}</div>
          </div>
        </div>

        {/* 宛先 */}
        <div className="dp-clinic">{note.clinicName}&nbsp;御中</div>

        {/* 患者名（新フォーマットのみ） */}
        {isNewFormat && (
          <div className="dp-patient-info">
            <span className="dp-patient-label">患者名</span>
            <span className="dp-patient-name">{note.patientName}</span>
            {note.shiki && (
              <>
                <span className="dp-patient-label" style={{ marginLeft: '2rem' }}>歯式</span>
                <span className="dp-patient-name">{note.shiki}</span>
              </>
            )}
          </div>
        )}

        {/* 明細テーブル */}
        {isNewFormat ? (
          // 新フォーマット：技工物のみ（患者名列なし）
          <table className="dp-table">
            <colgroup>
              <col className="dp-col-giko" />
              <col className="dp-col-cat" />
              <col className="dp-col-price" />
              <col className="dp-col-qty" />
              <col className="dp-col-amount" />
            </colgroup>
            <thead>
              <tr>
                <th>技工物</th>
                <th>区分</th>
                <th>単価</th>
                <th>数量</th>
                <th>金額</th>
              </tr>
            </thead>
            <tbody>
              {note.rows.map((row, i) => (
                <tr key={i}>
                  <td>{row.gikobutsuName}</td>
                  <td className="dp-center">{row.category}</td>
                  <td className="dp-right">{row.unitPrice ? fmtYen(row.unitPrice) : ''}</td>
                  <td className="dp-center">{row.quantity}</td>
                  <td className="dp-right">{row.amount ? fmtYen(row.amount) : ''}</td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, MIN_ROWS - note.rows.length) }).map((_, i) => (
                <tr key={`empty-${i}`} className="dp-empty-row">
                  <td colSpan={5}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          // 旧フォーマット（後方互換）：患者名・歯式列あり
          <table className="dp-table">
            <colgroup>
              <col className="dp-col-patient" />
              <col className="dp-col-shiki" />
              <col className="dp-col-giko" />
              <col className="dp-col-cat" />
              <col className="dp-col-price" />
              <col className="dp-col-qty" />
              <col className="dp-col-amount" />
            </colgroup>
            <thead>
              <tr>
                <th>患者名</th>
                <th>部位</th>
                <th>技工物</th>
                <th>区分</th>
                <th>単価</th>
                <th>数量</th>
                <th>金額</th>
              </tr>
            </thead>
            <tbody>
              {note.rows.map((row, i) => (
                <tr key={i}>
                  <td>{row.patientName}</td>
                  <td>{row.shiki}</td>
                  <td>{row.gikobutsuName}</td>
                  <td className="dp-center">{row.category}</td>
                  <td className="dp-right">{row.unitPrice ? fmtYen(row.unitPrice) : ''}</td>
                  <td className="dp-center">{row.quantity}</td>
                  <td className="dp-right">{row.amount ? fmtYen(row.amount) : ''}</td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, MIN_ROWS - note.rows.length) }).map((_, i) => (
                <tr key={`empty-${i}`} className="dp-empty-row">
                  <td colSpan={7}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* フッター */}
        <div className="dp-footer">
          <div className="dp-metal">
            <span className="dp-metal-label">金属残量</span>
            <span>パラ {note.paraGram || 0}g</span>
            <span>ミロ {note.miroGram || 0}g</span>
          </div>
          <div className="dp-totals">
            <div className="dp-total-row">
              <span>技工合計</span><span>{fmtYen(note.subtotalGiko)}</span>
            </div>
            <div className="dp-total-row">
              <span>材料合計</span><span>{fmtYen(note.subtotalMaterial)}</span>
            </div>
            <div className="dp-total-row">
              <span>消費税10%</span><span>{fmtYen(note.tax)}</span>
            </div>
            <div className="dp-total-row dp-grand">
              <span>合計金額</span><span>{fmtYen(note.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
