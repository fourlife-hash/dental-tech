import { useState, useEffect } from 'react';
import InvoicePrint from './InvoicePrint.jsx';

export default function Invoice() {
  const [subTab, setSubTab]           = useState('new'); // 'new' | 'list'
  const [clinics, setClinics]         = useState([]);
  const [clinicId, setClinicId]       = useState('');
  const [year, setYear]               = useState(new Date().getFullYear());
  const [month, setMonth]             = useState(new Date().getMonth() + 1);
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  // 前月履歴・自動計算
  const [isFirstTime, setIsFirstTime]       = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [prevCharge,  setPrevCharge]        = useState('');
  const [prevPayment, setPrevPayment]       = useState('');
  const [adjustment,  setAdjustment]        = useState('');

  // 弊社口座
  const [companyBankInfo, setCompanyBankInfo] = useState('');

  // 医院情報編集
  const [editClinic, setEditClinic] = useState(null);
  const [saving, setSaving]         = useState(false);

  // 発行済み一覧
  const [issuedList, setIssuedList]       = useState([]);
  const [listClinicId, setListClinicId]   = useState('');
  const [reprintData, setReprintData]     = useState(null); // 再印刷用データ

  // 初回ロード
  useEffect(() => {
    fetch('/api/clinics').then(r => r.json()).then(data => {
      setClinics(data);
      if (data.length > 0) { setClinicId(data[0].id); setListClinicId(data[0].id); }
    });
    fetch('/api/company-info').then(r => r.json()).then(d => setCompanyBankInfo(d.bank_info || ''));
  }, []);

  // 発行済みタブ：医院変更時に一覧取得
  useEffect(() => {
    if (subTab !== 'list' || !listClinicId) return;
    fetch(`/api/invoice-history/list?clinicId=${listClinicId}`)
      .then(r => r.json()).then(setIssuedList);
  }, [subTab, listClinicId]);

  // 医院・年月変更時：前月の請求履歴を取得して自動セット
  useEffect(() => {
    if (!clinicId) return;
    let prevYear = year, prevMonth = month - 1;
    if (prevMonth === 0) { prevYear--; prevMonth = 12; }

    setHistoryLoading(true);
    setInvoiceData(null);
    setReprintData(null);
    fetch(`/api/invoice-history?clinicId=${clinicId}&year=${prevYear}&month=${prevMonth}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.total_amount != null) {
          setIsFirstTime(false);
          setPrevCharge(String(data.total_amount));
        } else {
          setIsFirstTime(true);
          setPrevCharge('');
        }
        setPrevPayment('');
        setAdjustment('');
      })
      .finally(() => setHistoryLoading(false));
  }, [clinicId, year, month]);

  const prevChargeNum  = parseInt(prevCharge)  || 0;
  const prevPaymentNum = parseInt(prevPayment) || 0;
  const adjustmentNum  = parseInt(adjustment)  || 0;
  const carryOver      = prevChargeNum - prevPaymentNum + adjustmentNum;

  async function handleCreate() {
    if (!clinicId) return;
    setLoading(true);
    setError('');
    setReprintData(null);
    try {
      const res = await fetch(`/api/invoices?clinicId=${clinicId}&year=${year}&month=${month}`);
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setInvoiceData(data);

      const totalRequest = data.totalAmount + carryOver;
      const currentClinic = clinics.find(c => c.id === clinicId);
      const bk = currentClinic?.bankInfo || companyBankInfo;

      // 発行履歴に保存（スナップショット含む）
      await fetch('/api/invoice-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId, year, month,
          totalAmount:   totalRequest,
          prevAmount:    prevChargeNum,
          paidAmount:    prevPaymentNum,
          adjustAmount:  adjustmentNum,
          carryOver,
          notesSnapshot: data.notes,
          grandTotal:    totalRequest,
          bankInfo:      bk,
        }),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveClinicInfo() {
    if (!editClinic) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/clinics/${clinicId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editClinic),
      });
      const updated = await res.json();
      setClinics(cs => cs.map(c => c.id === updated.id ? updated : c));
      setEditClinic(null);
    } finally {
      setSaving(false);
    }
  }

  // 発行済み一覧：再印刷
  function handleReprint(row) {
    const notes = Array.isArray(row.notes_snapshot)
      ? row.notes_snapshot
      : JSON.parse(row.notes_snapshot || '[]');
    const clinic = clinics.find(c => c.id === row.clinic_id) || { name: '' };
    setReprintData({
      invoiceData: {
        clinic,
        year:         row.year,
        month:        row.month,
        dateFrom:     '',
        dateTo:       '',
        notes,
        totalGiko:     notes.reduce((s, n) => s + (n.subtotalGiko     || 0), 0),
        totalMaterial: notes.reduce((s, n) => s + (n.subtotalMaterial || 0), 0),
        totalTax:      notes.reduce((s, n) => s + (n.tax              || 0), 0),
        totalBaseUp:   notes.reduce((s, n) => s + (n.baseUpSupport    || 0), 0),
        totalAmount:   notes.reduce((s, n) => s + (n.total            || 0), 0),
      },
      prevCharge:  row.prev_amount   || 0,
      prevPayment: row.paid_amount   || 0,
      adjustment:  row.adjust_amount || 0,
      carryOver:   row.carry_over    || 0,
      bankInfo:    row.bank_info     || companyBankInfo,
    });
    setSubTab('new');  // 新規タブに切り替えてプレビュー表示
  }

  const currentClinic = clinics.find(c => c.id === clinicId);
  const years  = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const inputSt = { padding: '5px 8px', borderRadius: 6, border: '1px solid #ccc' };
  const GREEN = '#1a5c3a';

  return (
    <div style={{ padding: '1rem', maxWidth: 960, margin: '0 auto' }}>
      <h2 style={{ color: GREEN, marginBottom: '1rem', fontSize: 20 }}>請求書</h2>

      {/* ─── サブタブ ─── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1rem', borderBottom: '2px solid #d4edda' }}>
        {[['new','新規作成'],['list','発行済み一覧']].map(([key, label]) => (
          <button key={key} onClick={() => { setSubTab(key); setReprintData(null); }}
            style={{ padding: '6px 20px', border: 'none', background: subTab === key ? GREEN : 'transparent',
              color: subTab === key ? '#fff' : '#555', borderRadius: '6px 6px 0 0', cursor: 'pointer', fontWeight: subTab === key ? 'bold' : 'normal' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════════ 新規作成タブ ═══════════════ */}
      {subTab === 'new' && !reprintData && (
        <>
          {/* 選択フォーム */}
          <div style={{ background: '#f5faf7', borderRadius: 10, padding: '1rem', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, gap: 3 }}>
              医院名
              <select value={clinicId} onChange={e => setClinicId(e.target.value)} style={{ ...inputSt, minWidth: 160 }}>
                {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, gap: 3 }}>
              年
              <select value={year} onChange={e => setYear(parseInt(e.target.value))} style={inputSt}>
                {years.map(y => <option key={y} value={y}>{y}年</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, gap: 3 }}>
              月
              <select value={month} onChange={e => setMonth(parseInt(e.target.value))} style={inputSt}>
                {months.map(m => <option key={m} value={m}>{m}月</option>)}
              </select>
            </label>
          </div>

          {error && <p style={{ color: '#c0392b', marginBottom: '1rem' }}>{error}</p>}

          {/* 医院情報編集 */}
          {currentClinic && (
            <div style={{ background: '#f9f9f9', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 'bold', color: '#555' }}>医院情報（印刷に反映）</span>
                {!editClinic && (
                  <button onClick={() => setEditClinic({ postalCode: currentClinic.postalCode || '', address: currentClinic.address || '', bankInfo: currentClinic.bankInfo || '' })}
                    style={{ fontSize: 12, padding: '3px 10px', border: '1px solid #ccc', borderRadius: 5, cursor: 'pointer', background: '#fff' }}>編集</button>
                )}
              </div>
              {editClinic ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, gap: 2 }}>
                    郵便番号
                    <input value={editClinic.postalCode} onChange={e => setEditClinic(p => ({ ...p, postalCode: e.target.value }))} style={{ ...inputSt, width: 100 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, gap: 2 }}>
                    住所
                    <input value={editClinic.address} onChange={e => setEditClinic(p => ({ ...p, address: e.target.value }))} style={{ ...inputSt, width: 240 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, gap: 2 }}>
                    銀行口座
                    <input value={editClinic.bankInfo} onChange={e => setEditClinic(p => ({ ...p, bankInfo: e.target.value }))} style={{ ...inputSt, width: 280 }} />
                  </label>
                  <button onClick={handleSaveClinicInfo} disabled={saving} style={{ padding: '5px 14px', background: GREEN, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>保存</button>
                  <button onClick={() => setEditClinic(null)} style={{ padding: '5px 10px', background: '#eee', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer' }}>取消</button>
                </div>
              ) : (
                <div style={{ color: '#444', lineHeight: 1.8 }}>
                  <div>〒{currentClinic.postalCode || '未設定'}　{currentClinic.address || '住所未設定'}</div>
                  <div style={{ color: '#666' }}>振込口座：{currentClinic.bankInfo || '（設定ページで弊社口座を設定）'}</div>
                </div>
              )}
            </div>
          )}

          {/* 前回請求 / 繰越 入力 */}
          <div style={{ background: isFirstTime ? '#fffbe6' : '#f5faf7', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: 13 }}>
            {historyLoading ? (
              <p style={{ color: '#888', margin: 0 }}>前月データを読み込み中...</p>
            ) : (
              <>
                {isFirstTime && (
                  <p style={{ color: '#b8860b', fontWeight: 'bold', marginBottom: 8, fontSize: 12 }}>
                    ⚠ 前月の請求履歴がありません。初回入力として全項目を手入力してください。
                  </p>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    前回御請求額(円)
                    <input type="number" value={prevCharge} onChange={e => setPrevCharge(e.target.value)}
                      style={{ ...inputSt, width: 130, background: !isFirstTime ? '#e8f5e9' : '#fff' }}
                      readOnly={!isFirstTime} />
                    {!isFirstTime && <span style={{ fontSize: 10, color: '#27ae60' }}>前月履歴から自動入力</span>}
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    前回御入金額(円)
                    <input type="number" value={prevPayment} onChange={e => setPrevPayment(e.target.value)} style={{ ...inputSt, width: 130 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    調整額(円)
                    <input type="number" value={adjustment} onChange={e => setAdjustment(e.target.value)} style={{ ...inputSt, width: 110 }} />
                  </label>
                  <div style={{ alignSelf: 'flex-end', color: GREEN, fontWeight: 'bold', fontSize: 14 }}>
                    繰越額：¥{carryOver.toLocaleString()}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 作成ボタン */}
          <div style={{ marginBottom: '1rem' }}>
            <button onClick={handleCreate} disabled={loading || historyLoading}
              style={{ padding: '9px 28px', background: GREEN, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 15 }}>
              {loading ? '集計中...' : isFirstTime ? 'この内容で請求書を作成' : '請求書を作成'}
            </button>
          </div>

          {/* 集計プレビュー */}
          {invoiceData && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
                集計期間：{invoiceData.dateFrom} 〜 {invoiceData.dateTo}　対象納品書：{invoiceData.notes.length}件
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                {[
                  ['技工合計',        invoiceData.totalGiko],
                  ['材料合計',        invoiceData.totalMaterial],
                  ['ﾍﾞｰｽｱｯﾌﾟ支援料', invoiceData.totalBaseUp ?? 0],
                  ['消費税',          invoiceData.totalTax],
                  ['今回納品額',      invoiceData.totalAmount],
                  ['繰越額',          carryOver],
                  ['今回御請求額',    invoiceData.totalAmount + carryOver],
                ].map(([label, val]) => (
                  <div key={label} style={{ background: val < 0 ? '#fff0f0' : '#f0f9f4', borderRadius: 8, padding: '0.5rem 1rem', minWidth: 120, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#777' }}>{label}</div>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: val < 0 ? '#c0392b' : GREEN }}>¥{val.toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <InvoicePrint
                invoiceData={invoiceData}
                prevCharge={prevChargeNum}
                prevPayment={prevPaymentNum}
                adjustment={adjustmentNum}
                carryOver={carryOver}
                bankInfo={currentClinic?.bankInfo || companyBankInfo}
                totalBaseUp={invoiceData.totalBaseUp ?? 0}
              />
            </div>
          )}
        </>
      )}

      {/* 再印刷モード */}
      {subTab === 'new' && reprintData && (
        <div>
          <button onClick={() => setReprintData(null)}
            style={{ padding: '6px 16px', background: '#eee', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', marginBottom: '1rem' }}>
            ← 新規作成に戻る
          </button>
          <div style={{ fontSize: 13, color: '#1a5c3a', fontWeight: 'bold', marginBottom: 8 }}>
            {reprintData.invoiceData.year}年{reprintData.invoiceData.month}月分 再印刷
          </div>
          <InvoicePrint
            invoiceData={reprintData.invoiceData}
            prevCharge={reprintData.prevCharge}
            prevPayment={reprintData.prevPayment}
            adjustment={reprintData.adjustment}
            carryOver={reprintData.carryOver}
            bankInfo={reprintData.bankInfo}
            totalBaseUp={reprintData.invoiceData.totalBaseUp ?? 0}
          />
        </div>
      )}

      {/* ═══════════════ 発行済み一覧タブ ═══════════════ */}
      {subTab === 'list' && (
        <div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, gap: 3 }}>
              医院名
              <select value={listClinicId} onChange={e => setListClinicId(e.target.value)} style={{ ...inputSt, minWidth: 160 }}>
                {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#d4edda' }}>
                {['対象月','今回御請求額','繰越額','発行日',''].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: h === '今回御請求額' || h === '繰越額' ? 'right' : 'left', border: '1px solid #a8d5b5', color: GREEN }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {issuedList.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: '#888' }}>発行済み請求書がありません</td></tr>
              )}
              {issuedList.map(row => (
                <tr key={row.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px 12px' }}>{row.year}年{row.month}月</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 'bold' }}>
                    ¥{(row.grand_total || row.total_amount || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>¥{(row.carry_over || 0).toLocaleString()}</td>
                  <td style={{ padding: '8px 12px', color: '#666', fontSize: 12 }}>
                    {row.created_at ? new Date(row.created_at).toLocaleDateString('ja-JP') : ''}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <button onClick={() => handleReprint(row)}
                      style={{ padding: '4px 14px', background: GREEN, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                      再印刷
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
