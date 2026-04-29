const COMPANY = {
  name:         'デンタル　テック　アライズ',
  zip:          '〒601-8414',
  address:      '京都市南区八条坊門町7-6',
  invoiceLabel: 'インボイス登録番号',
  invoice:      'T3-8103-2874-8548',
};

const MIN_ROWS = 10;

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

  return (
    <div className="print-overlay">
      <div className="print-controls no-print">
        <button className="submit-btn" onClick={handlePrint}>印刷実行</button>
        <button className="cancel-btn" onClick={onClose}>閉じる</button>
      </div>

      <div className="print-page">

        {/* ── ヘッダー ── */}
        <div className="dp-header">

          {/* 左：タイトル */}
          <div className="dp-title-left">
            <div className="dp-title">納　品　書</div>
          </div>

          {/* 右：納品日 + 会社情報 */}
          <div className="dp-company-right">
            <div className="dp-delivery-date">納品日　{fmtDate(note.deliveryDate)}</div>
            <div className="dp-company-name">{COMPANY.name}</div>
            <div className="dp-company-sub">{COMPANY.zip}</div>
            <div className="dp-company-sub">{COMPANY.address}</div>
            <div className="dp-company-sub">{COMPANY.invoiceLabel}</div>
            <div className="dp-company-sub">{COMPANY.invoice}</div>
          </div>

        </div>

        {/* ── 医院名 ── */}
        <div className="dp-clinic-line">
          {note.clinicName}&emsp;様
        </div>

        {/* ── 明細テーブル ── */}
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
              <th>納品No・患者名</th>
              <th>部位</th>
              <th>納品技工製品名</th>
              <th>区分</th>
              <th>単価</th>
              <th>数量</th>
              <th>金額</th>
            </tr>
          </thead>
          <tbody>
            {isNewFormat ? (
              // 新フォーマット：1患者・複数技工物
              // 先頭行のみ No. と患者名を表示、部位（歯式）も先頭行のみ
              <>
                {note.rows.map((row, i) => (
                  <tr key={i}>
                    <td>
                      {i === 0 && (
                        <>
                          <div className="dp-no">No.{note.deliveryNo}</div>
                          <div>{note.patientName}</div>
                        </>
                      )}
                    </td>
                    <td>{i === 0 ? (note.shiki || '') : ''}</td>
                    <td>{row.gikobutsuName}</td>
                    <td className="dp-center">{row.category}</td>
                    <td className="dp-right">{row.unitPrice ? fmtYen(row.unitPrice) : ''}</td>
                    <td className="dp-center">{row.quantity}</td>
                    <td className="dp-right">{row.amount ? fmtYen(row.amount) : ''}</td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, MIN_ROWS - note.rows.length) }).map((_, i) => (
                  <tr key={`e-${i}`} className="dp-empty-row">
                    <td colSpan={7}>&nbsp;</td>
                  </tr>
                ))}
              </>
            ) : (
              // 旧フォーマット（後方互換）：行ごとに患者名・歯式
              <>
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
                  <tr key={`e-${i}`} className="dp-empty-row">
                    <td colSpan={7}>&nbsp;</td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>

        {/* ── フッター ── */}
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
