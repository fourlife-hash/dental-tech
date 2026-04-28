import { useState, useEffect } from 'react';
import DeliveryNotePrint from './DeliveryNotePrint.jsx';
import { createDeliveryNote } from '../api.js';

const CAT_MAP = { '保険技工': '保', '自費技工': '自', '材料': '材', '預かり': '預' };
const CAT_OPTIONS = ['保', '自', '材', '預'];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function calcTotals(rows) {
  const subtotalGiko = rows.reduce((s, r) => {
    return (r.category === '保' || r.category === '自') ? s + r.unitPrice * r.quantity : s;
  }, 0);
  const subtotalMaterial = rows.reduce((s, r) => {
    return r.category === '材' ? s + r.unitPrice * r.quantity : s;
  }, 0);
  const tax   = Math.round((subtotalGiko + subtotalMaterial) * 0.1);
  const total = subtotalGiko + subtotalMaterial + tax;
  return { subtotalGiko, subtotalMaterial, tax, total };
}

function makeRow(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    patientName: '',
    shiki: '',
    gikobutsuName: '',
    category: '',
    unitPrice: 0,
    quantity: 1,
    ...overrides,
  };
}

export default function DeliveryNoteForm({ jobs, onSaved }) {
  const [clinics, setClinics]         = useState([]);
  const [products, setProducts]       = useState([]);
  const [prices, setPrices]           = useState([]);
  const [clinicId, setClinicId]       = useState('');
  const [clinicName, setClinicName]   = useState('');
  const [deliveryDate, setDeliveryDate] = useState(todayStr());
  const [rows, setRows]               = useState([makeRow()]);
  const [paraGram, setParaGram]       = useState('');
  const [miroGram, setMiroGram]       = useState('');
  const [saving, setSaving]           = useState(false);
  const [printNote, setPrintNote]     = useState(null);
  const [savedMsg, setSavedMsg]       = useState('');

  useEffect(() => {
    fetch('/api/clinics').then(r => r.json()).then(setClinics);
    fetch('/api/products').then(r => r.json()).then(setProducts);
  }, []);

  async function handleClinicChange(newId) {
    setClinicId(newId);
    const clinic = clinics.find(c => c.id === newId);
    const name   = clinic?.name || '';
    setClinicName(name);

    let newPrices = [];
    if (newId) {
      newPrices = await fetch(`/api/prices/${newId}`).then(r => r.json());
      setPrices(newPrices);
    } else {
      setPrices([]);
    }
    if (name && deliveryDate) populateFromJobs(name, deliveryDate, newPrices);
  }

  function handleDateChange(newDate) {
    setDeliveryDate(newDate);
    if (clinicName && newDate) populateFromJobs(clinicName, newDate, prices);
  }

  function populateFromJobs(cName, date, priceList) {
    const matched = jobs.filter(j => j.clinic === cName && j.setDate === date && j.done);
    if (matched.length > 0) {
      setRows(matched.map(j => {
        const prod       = products.find(p => p.name === j.gikobutsu);
        const priceEntry = prod ? priceList.find(pr => pr.productId === prod.id) : null;
        return makeRow({
          patientName:  j.patient,
          shiki:        j.shiki || '',
          gikobutsuName: j.gikobutsu || '',
          category:     prod ? (CAT_MAP[prod.category] || '') : '',
          unitPrice:    priceEntry?.price || 0,
        });
      }));
    } else {
      setRows([makeRow()]);
    }
  }

  function updateRow(id, field, rawValue) {
    const value = (field === 'unitPrice' || field === 'quantity')
      ? (parseInt(rawValue) || 0)
      : rawValue;
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }

  function addRow() { setRows(prev => [...prev, makeRow()]); }

  function removeRow(id) { setRows(prev => prev.filter(r => r.id !== id)); }

  function addProductRow(product) {
    const priceEntry = prices.find(pr => pr.productId === product.id);
    setRows(prev => [...prev, makeRow({
      gikobutsuName: product.name,
      category:      CAT_MAP[product.category] || '',
      unitPrice:     priceEntry?.price || 0,
    })]);
  }

  const totals = calcTotals(rows);

  async function handleSave() {
    if (!clinicName) { alert('医院名を選択してください'); return; }
    setSaving(true);
    try {
      const note = await createDeliveryNote({
        clinicId:         clinicId || null,
        clinicName,
        deliveryDate,
        rows: rows.map(r => ({
          patientName:   r.patientName,
          shiki:         r.shiki,
          gikobutsuName: r.gikobutsuName,
          category:      r.category,
          unitPrice:     r.unitPrice,
          quantity:      r.quantity,
          amount:        r.unitPrice * r.quantity,
        })),
        paraGram:         parseFloat(paraGram) || 0,
        miroGram:         parseFloat(miroGram) || 0,
        ...totals,
      });
      onSaved?.();
      setPrintNote(note);
      setSavedMsg(`納品書 No.${note.deliveryNo} を発行しました`);
    } catch {
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  function handleNewNote() {
    setClinicId('');
    setClinicName('');
    setDeliveryDate(todayStr());
    setRows([makeRow()]);
    setParaGram('');
    setMiroGram('');
    setSavedMsg('');
  }

  const priceMap         = Object.fromEntries(prices.map(p => [p.productId, p.price]));
  const productsWithPrice = products.map(p => ({ ...p, price: priceMap[p.id] ?? null }));

  return (
    <div className="dn-form-layout">
      {/* ── 左：入力エリア ── */}
      <div className="dn-left">
        {savedMsg && (
          <div className="dn-saved-banner">
            <span>{savedMsg}</span>
            <button className="dn-new-btn" onClick={handleNewNote}>新規作成</button>
          </div>
        )}

        <div className="dn-section">
          <div className="dn-field-row">
            <label>医院名</label>
            <select value={clinicId} onChange={e => handleClinicChange(e.target.value)}>
              <option value="">選択してください</option>
              {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="dn-field-row">
            <label>納品日</label>
            <input type="date" value={deliveryDate} onChange={e => handleDateChange(e.target.value)} />
          </div>
        </div>

        {/* 患者行テーブル */}
        <div className="dn-table-wrap">
          <table className="dn-table">
            <thead>
              <tr>
                <th>患者名</th>
                <th>歯式</th>
                <th>技工物名</th>
                <th>区分</th>
                <th>単価</th>
                <th>数量</th>
                <th>金額</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <td>
                    <input
                      value={row.patientName}
                      onChange={e => updateRow(row.id, 'patientName', e.target.value)}
                      placeholder="患者名"
                    />
                  </td>
                  <td>
                    <input
                      value={row.shiki}
                      onChange={e => updateRow(row.id, 'shiki', e.target.value)}
                      placeholder="歯式"
                      className="dn-shiki"
                    />
                  </td>
                  <td>
                    <input
                      value={row.gikobutsuName}
                      onChange={e => updateRow(row.id, 'gikobutsuName', e.target.value)}
                      placeholder="技工物名"
                    />
                  </td>
                  <td>
                    <select value={row.category} onChange={e => updateRow(row.id, 'category', e.target.value)}>
                      <option value="">-</option>
                      {CAT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.unitPrice}
                      onChange={e => updateRow(row.id, 'unitPrice', e.target.value)}
                      className="dn-num"
                      min="0"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.quantity}
                      onChange={e => updateRow(row.id, 'quantity', e.target.value)}
                      className="dn-qty"
                      min="1"
                    />
                  </td>
                  <td className="dn-amount">
                    {(row.unitPrice * row.quantity).toLocaleString()}
                  </td>
                  <td>
                    <button className="del-btn" onClick={() => removeRow(row.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="dn-add-row-btn" onClick={addRow}>＋ 行を追加</button>
        </div>

        {/* 金属使用量 */}
        <div className="dn-section dn-metal">
          <span className="dn-metal-label">金属使用量：</span>
          <label>
            パラ&nbsp;
            <input
              type="number" step="0.1" min="0"
              value={paraGram}
              onChange={e => setParaGram(e.target.value)}
              className="dn-gram"
            />
            g
          </label>
          <label>
            ミロ&nbsp;
            <input
              type="number" step="0.1" min="0"
              value={miroGram}
              onChange={e => setMiroGram(e.target.value)}
              className="dn-gram"
            />
            g
          </label>
        </div>

        {/* 合計 */}
        <div className="dn-totals">
          <div className="dn-total-row">
            <span>技工合計</span><span>¥{totals.subtotalGiko.toLocaleString()}</span>
          </div>
          <div className="dn-total-row">
            <span>材料合計</span><span>¥{totals.subtotalMaterial.toLocaleString()}</span>
          </div>
          <div className="dn-total-row">
            <span>消費税10%</span><span>¥{totals.tax.toLocaleString()}</span>
          </div>
          <div className="dn-total-row dn-grand-total">
            <span>合計金額</span><span>¥{totals.total.toLocaleString()}</span>
          </div>
        </div>

        <div className="dn-actions">
          <button
            className="submit-btn"
            onClick={handleSave}
            disabled={saving || !clinicName}
          >
            {saving ? '保存中...' : '保存して発行'}
          </button>
        </div>
      </div>

      {/* ── 右：料金表 ── */}
      <div className="dn-right">
        <div className="card-header">
          <h3>{clinicName ? `${clinicName} 料金表` : '料金表'}</h3>
        </div>
        {!clinicId && (
          <p className="dn-price-hint" style={{ padding: '0.75rem' }}>
            医院を選択すると料金表が表示されます
          </p>
        )}
        <div className="dn-price-list">
          {productsWithPrice.map(p => (
            <div
              key={p.id}
              className="dn-price-item"
              onDoubleClick={() => addProductRow(p)}
              title="ダブルクリックで患者行に追加"
            >
              <span className="dn-price-name">{p.name}</span>
              <span className="dn-price-cat">{CAT_MAP[p.category] || '-'}</span>
              <span className="dn-price-val">
                {p.price != null ? `¥${p.price.toLocaleString()}` : '－'}
              </span>
            </div>
          ))}
        </div>
        {clinicId && (
          <p className="dn-price-hint">ダブルクリックで患者行に追加</p>
        )}
      </div>

      {/* 印刷オーバーレイ */}
      {printNote && (
        <DeliveryNotePrint
          note={printNote}
          onClose={() => setPrintNote(null)}
        />
      )}
    </div>
  );
}
