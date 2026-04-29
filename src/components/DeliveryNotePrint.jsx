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

// note (単件後方互換) または notes (複数件) を受け取る
export default function DeliveryNotePrint({ note, notes, onClose }) {
  function handlePrint() { window.print(); }

  // 必ず配列に正規化
  const noteList = notes ?? (note ? [note] : []);
  if (noteList.length === 0) return null;

  const clinicName  = noteList[0].clinicName;
  const deliveryDate = noteList[0].deliveryDate;

  // 全件の合計を集計
  const totals = noteList.reduce(
    (acc, n) => ({
      subtotalGiko:     acc.subtotalGiko     + (n.subtotalGiko     || 0),
      subtotalMaterial: acc.subtotalMaterial + (n.subtotalMaterial || 0),
      tax:              acc.tax              + (n.tax              || 0),
      total:            acc.total            + (n.total            || 0),
      paraGram:         acc.paraGram         + (n.paraGram         || 0),
      miroGram:         acc.miroGram         + (n.miroGram         || 0),
    }),
    { subtotalGiko: 0, subtotalMaterial: 0, tax: 0, total: 0, paraGram: 0, miroGram: 0 }
  );

  // 空白行数（最低 MIN_ROWS 行確保）
  const totalDataRows = noteList.reduce((s, n) => s + (n.rows?.length || 0), 0);
  const emptyCount    = Math.max(0, MIN_ROWS - totalDataRows);

  return (
    <div className="print-overlay">
      <div className="print-controls no-print">
        <button className="submit-btn" onClick={handlePrint}>印刷実行</button>
        <button className="cancel-btn" onClick={onClose}>閉じる</button>
      </div>

      <div className="print-page">

        {/* ── ヘッダー ── */}
        <div className="dp-header">
          <div className="dp-title-left">
            <div className="dp-title">納　品　書</div>
          </div>
          <div className="dp-company-right">
            <div className="dp-delivery-date">納品日　{fmtDate(deliveryDate)}</div>
            <div className="dp-company-name">{COMPANY.name}</div>
            <div className="dp-company-sub">{COMPANY.zip}</div>
            <div className="dp-company-sub">{COMPANY.address}</div>
            <div className="dp-company-sub">{COMPANY.invoiceLabel}</div>
            <div className="dp-company-sub">{COMPANY.invoice}</div>
          </div>
        </div>

        {/* ── 医院名 ── */}
        <div className="dp-clinic-line">{clinicName}&emsp;様</div>

        {/* ── 明細テーブル ──
              tbody を患者ごとに分割し page-break-inside: avoid を適用。
              同じ患者のデータが改ページで分断されない。            */}
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

          {/* 患者ごとに tbody を分ける（page-break-inside: avoid） */}
          {noteList.map((n) => {
            const isNewFmt = Boolean(n.patientName);
            return (
              <tbody key={n.id} className="dp-patient-tbody">
                {isNewFmt ? (
                  // 新形式：患者名はノートレベル、先頭行のみ表示
                  (n.rows || []).map((row, i) => (
                    <tr key={i}>
                      <td>
                        {i === 0 && (
                          <>
                            <div className="dp-no">No.{n.deliveryNo}</div>
                            <div>{n.patientName}</div>
                          </>
                        )}
                      </td>
                      <td>{i === 0 ? (n.shiki || '') : ''}</td>
                      <td>{row.gikobutsuName}</td>
                      <td className="dp-center">{row.category}</td>
                      <td className="dp-right">{row.unitPrice ? fmtYen(row.unitPrice) : ''}</td>
                      <td className="dp-center">{row.quantity}</td>
                      <td className="dp-right">{row.amount ? fmtYen(row.amount) : ''}</td>
                    </tr>
                  ))
                ) : (
                  // 旧形式（後方互換）：行ごとに患者名・歯式
                  (n.rows || []).map((row, i) => (
                    <tr key={i}>
                      <td>
                        {i === 0 && <div className="dp-no">No.{n.deliveryNo}</div>}
                        {row.patientName}
                      </td>
                      <td>{row.shiki}</td>
                      <td>{row.gikobutsuName}</td>
                      <td className="dp-center">{row.category}</td>
                      <td className="dp-right">{row.unitPrice ? fmtYen(row.unitPrice) : ''}</td>
                      <td className="dp-center">{row.quantity}</td>
                      <td className="dp-right">{row.amount ? fmtYen(row.amount) : ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            );
          })}

          {/* 空白パディング行 */}
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

        {/* ── フッター（全患者合計） ── */}
        <div className="dp-footer">
          <div className="dp-metal">
            <span className="dp-metal-label">金属残量</span>
            <span>パラ {totals.paraGram}g</span>
            <span>ミロ {totals.miroGram}g</span>
          </div>
          <div className="dp-totals">
            <div className="dp-total-row">
              <span>技工合計</span><span>{fmtYen(totals.subtotalGiko)}</span>
            </div>
            <div className="dp-total-row">
              <span>材料合計</span><span>{fmtYen(totals.subtotalMaterial)}</span>
            </div>
            <div className="dp-total-row">
              <span>消費税10%</span><span>{fmtYen(totals.tax)}</span>
            </div>
            <div className="dp-total-row dp-grand">
              <span>合計金額</span><span>{fmtYen(totals.total)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
