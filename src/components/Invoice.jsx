import { useState, useEffect } from 'react';
import InvoicePrint from './InvoicePrint.jsx';

export default function Invoice() {
  const [clinics, setClinics]       = useState([]);
  const [clinicId, setClinicId]     = useState('');
  const [year, setYear]             = useState(new Date().getFullYear());
  const [month, setMonth]           = useState(new Date().getMonth() + 1);
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  // 手入力フィールド
  const [prevCharge,   setPrevCharge]   = useState('');
  const [prevPayment,  setPrevPayment]  = useState('');
  const [adjustment,   setAdjustment]  = useState('');
  const [bankInfo,     setBankInfo]     = useState('');

  // 医院情報編集
  const [editClinic, setEditClinic] = useState(null); // {postalCode, address, bankInfo}
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    fetch('/api/clinics').then(r => r.json()).then(data => {
      setClinics(data);
      if (data.length > 0) setClinicId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!clinicId) return;
    const clinic = clinics.find(c => c.id === clinicId);
    if (clinic) setBankInfo(clinic.bankInfo || '');
  }, [clinicId, clinics]);

  async function handleCreate() {
    if (!clinicId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/invoices?clinicId=${clinicId}&year=${year}&month=${month}`);
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setInvoiceData(data);
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
      setBankInfo(updated.bankInfo || '');
      setEditClinic(null);
    } finally {
      setSaving(false);
    }
  }

  const currentClinic = clinics.find(c => c.id === clinicId);

  const prevChargeNum  = parseInt(prevCharge)  || 0;
  const prevPaymentNum = parseInt(prevPayment) || 0;
  const adjustmentNum  = parseInt(adjustment)  || 0;
  const carryOver      = prevChargeNum - prevPaymentNum + adjustmentNum;

  const years  = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div style={{ padding: '1rem', maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ color: '#1a5c3a', marginBottom: '1rem', fontSize: 20 }}>請求書作成</h2>

      {/* ─── 選択フォーム ─── */}
      <div style={{ background: '#f5faf7', borderRadius: 10, padding: '1rem', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, gap: 3 }}>
          医院名
          <select value={clinicId} onChange={e => setClinicId(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc', minWidth: 160 }}>
            {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, gap: 3 }}>
          年
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc' }}>
            {years.map(y => <option key={y} value={y}>{y}年</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, gap: 3 }}>
          月
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc' }}>
            {months.map(m => <option key={m} value={m}>{m}月</option>)}
          </select>
        </label>
        <button onClick={handleCreate} disabled={loading}
          style={{ padding: '7px 22px', background: '#1a5c3a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>
          {loading ? '集計中...' : '請求書を作成'}
        </button>
      </div>

      {error && <p style={{ color: '#c0392b', marginBottom: '1rem' }}>{error}</p>}

      {/* ─── 医院情報編集 ─── */}
      {currentClinic && (
        <div style={{ background: '#f9f9f9', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontWeight: 'bold', color: '#555' }}>医院情報（印刷に反映）</span>
            {!editClinic && (
              <button onClick={() => setEditClinic({ postalCode: currentClinic.postalCode, address: currentClinic.address, bankInfo: currentClinic.bankInfo })}
                style={{ fontSize: 12, padding: '3px 10px', border: '1px solid #ccc', borderRadius: 5, cursor: 'pointer', background: '#fff' }}>
                編集
              </button>
            )}
          </div>
          {editClinic ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, gap: 2 }}>
                郵便番号
                <input value={editClinic.postalCode} onChange={e => setEditClinic(p => ({ ...p, postalCode: e.target.value }))}
                  style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid #ccc', width: 100 }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, gap: 2 }}>
                住所
                <input value={editClinic.address} onChange={e => setEditClinic(p => ({ ...p, address: e.target.value }))}
                  style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid #ccc', width: 250 }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, gap: 2 }}>
                振込口座
                <input value={editClinic.bankInfo} onChange={e => setEditClinic(p => ({ ...p, bankInfo: e.target.value }))}
                  style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid #ccc', width: 280 }} />
              </label>
              <button onClick={handleSaveClinicInfo} disabled={saving}
                style={{ padding: '5px 14px', background: '#1a5c3a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>保存</button>
              <button onClick={() => setEditClinic(null)}
                style={{ padding: '5px 10px', background: '#eee', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer' }}>取消</button>
            </div>
          ) : (
            <div style={{ color: '#444', lineHeight: 1.8 }}>
              <span>〒{currentClinic.postalCode || '未設定'}　{currentClinic.address || '住所未設定'}</span>
              <br />
              <span>振込口座：{currentClinic.bankInfo || '未設定'}</span>
            </div>
          )}
        </div>
      )}

      {/* ─── 手入力フィールド ─── */}
      <div style={{ background: '#f5faf7', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end', fontSize: 13 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          前回御請求額(円)
          <input type="number" value={prevCharge} onChange={e => setPrevCharge(e.target.value)}
            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #ccc', width: 120 }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          前回御入金額(円)
          <input type="number" value={prevPayment} onChange={e => setPrevPayment(e.target.value)}
            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #ccc', width: 120 }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          調整額(円)
          <input type="number" value={adjustment} onChange={e => setAdjustment(e.target.value)}
            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #ccc', width: 100 }} />
        </label>
        <div style={{ alignSelf: 'flex-end', color: '#1a5c3a', fontWeight: 'bold' }}>
          繰越額：¥{carryOver.toLocaleString()}
        </div>
      </div>

      {/* ─── 集計プレビュー ─── */}
      {invoiceData && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
            集計期間：{invoiceData.dateFrom} 〜 {invoiceData.dateTo}
            対象納品書：{invoiceData.notes.length}件
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {[
              ['技工合計', invoiceData.totalGiko],
              ['材料合計', invoiceData.totalMaterial],
              ['消費税',   invoiceData.totalTax],
              ['今回納品額', invoiceData.totalAmount],
              ['繰越額',   carryOver],
              ['今回御請求額', invoiceData.totalAmount + carryOver],
            ].map(([label, val]) => (
              <div key={label} style={{ background: val < 0 ? '#fff0f0' : '#f0f9f4', borderRadius: 8, padding: '0.5rem 1rem', minWidth: 120, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#777' }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1a5c3a' }}>¥{val.toLocaleString()}</div>
              </div>
            ))}
          </div>
          <button onClick={() => {/* InvoicePrint は invoiceData 存在時に下に表示 */}}
            style={{ display: 'none' }} />
          <InvoicePrint
            invoiceData={invoiceData}
            prevCharge={prevChargeNum}
            prevPayment={prevPaymentNum}
            adjustment={adjustmentNum}
            carryOver={carryOver}
            bankInfo={bankInfo || currentClinic?.bankInfo || ''}
          />
        </div>
      )}
    </div>
  );
}
