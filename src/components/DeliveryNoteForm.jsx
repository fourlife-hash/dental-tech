import { useState, useEffect } from 'react';
import { createDeliveryNote, updateDeliveryNote } from '../api.js';

const CAT_MAP = { '保険技工': '保', '自費技工': '自', '材料': '材', '預かり': '預' };
const CAT_OPTIONS = ['保', '自', '材', '預'];

function calcTotals(items) {
  const subtotalGiko = items.reduce((s, item) => {
    return (item.category === '保' || item.category === '自') ? s + item.unitPrice * item.quantity : s;
  }, 0);
  const subtotalMaterial = items.reduce((s, item) => {
    return item.category === '材' ? s + item.unitPrice * item.quantity : s;
  }, 0);
  const tax   = Math.round((subtotalGiko + subtotalMaterial) * 0.1);
  const total = subtotalGiko + subtotalMaterial + tax;
  return { subtotalGiko, subtotalMaterial, tax, total };
}

function makeItem(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    gikobutsuName: '',
    category: '',
    unitPrice: 0,
    quantity: 1,
    ...overrides,
  };
}

// Props:
//   job          = ジョブ（患者一覧から選択）
//   clinicId     = 医院ID
//   deliveryDate = 納品日
//   initialNote  = 既存納品書（発行済み一覧からの修正）
//   existingNote = 保存済み納品書（患者一覧から再選択した場合に渡される）
//   onBack       = 保存せず戻るコールバック
//   onSaved      = 保存完了コールバック（親が一覧更新＋画面遷移を行う）
export default function DeliveryNoteForm({
  job, clinicId, deliveryDate: deliveryDateProp,
  initialNote, existingNote,
  onBack, onSaved,
}) {
  const isEditing = Boolean(initialNote);

  // sourceNote: 初期値の取得源（編集モードの既存ノート or 患者一覧から戻った保存済みノート）
  const sourceNote = initialNote || existingNote;

  const patientName = sourceNote?.patientName || job?.patient || '';
  const clinicName  = sourceNote?.clinicName  || job?.clinic  || '';

  const [products, setProducts]         = useState([]);
  const [prices, setPrices]             = useState([]);
  const [shiki, setShiki]               = useState(sourceNote?.shiki || job?.shiki || '');
  const [date, setDate] = useState('');
  const [items, setItems]   = useState(
    sourceNote?.rows?.length > 0
      ? sourceNote.rows.map(r => makeItem(r))
      : []
  );
  const [paraGram, setParaGram] = useState(
    sourceNote?.paraGram > 0 ? String(sourceNote.paraGram) : ''
  );
  const [miroGram, setMiroGram] = useState(
    sourceNote?.miroGram > 0 ? String(sourceNote.miroGram) : ''
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts);
    if (clinicId) {
      fetch(`/api/prices/${clinicId}`).then(r => r.json()).then(setPrices);
    }
  }, []);

  // 料金表クリック → この患者の技工物リストに追加（患者行は追加しない）
  function addItemFromProduct(product) {
    const priceEntry = prices.find(pr => pr.productId === product.id);
    setItems(prev => [...prev, makeItem({
      gikobutsuName: product.name,
      category:      CAT_MAP[product.category] || '',
      unitPrice:     priceEntry?.price || 0,
    })]);
  }

  function addEmptyItem() { setItems(prev => [...prev, makeItem()]); }
  function removeItem(id)  { setItems(prev => prev.filter(item => item.id !== id)); }

  function updateItem(id, field, rawValue) {
    const value = (field === 'unitPrice' || field === 'quantity')
      ? (parseInt(rawValue) || 0)
      : rawValue;
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  }

  const totals = calcTotals(items);

  async function handleSave() {
    if (!clinicName) { alert('医院名が不明です'); return; }
    setSaving(true);
    try {
      const payload = {
        clinicId:    clinicId || null,
        clinicName,
        deliveryDate: date,
        patientName,
        shiki,
        rows: items.map(item => ({
          gikobutsuName: item.gikobutsuName,
          category:      item.category,
          unitPrice:     item.unitPrice,
          quantity:      item.quantity,
          amount:        item.unitPrice * item.quantity,
        })),
        paraGram:         parseFloat(paraGram) || 0,
        miroGram:         parseFloat(miroGram) || 0,
        ...totals,
      };

      if (isEditing) {
        // 発行済み一覧からの修正 → 指定IDを更新
        await updateDeliveryNote(initialNote.id, payload);
      } else {
        // 患者一覧から → サーバー側で同一clinic+date+patientをupsert
        await createDeliveryNote(payload);
      }

      onSaved?.(); // 親が保存済み一覧を更新して患者一覧に戻る
    } catch {
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  const priceMap          = Object.fromEntries(prices.map(p => [p.productId, p.price]));
  const productsWithPrice = products.map(p => ({ ...p, price: priceMap[p.id] ?? null }));

  return (
    <div className="dn-form-layout">
      {/* ── 左：入力エリア ── */}
      <div className="dn-left">
        {/* 患者ヘッダー */}
        <div className="dn-patient-header">
          <div className="dn-patient-title">
            <span className="dn-clinic-label">{clinicName}</span>
            <span className="dn-patient-label">{patientName}</span>
          </div>
          <div className="dn-patient-fields">
            <div className="dn-field-row">
              <label>歯式</label>
              <input
                type="text"
                value={shiki}
                onChange={e => setShiki(e.target.value)}
                placeholder="例: |7"
                className="dn-shiki-input"
              />
            </div>
            <div className="dn-field-row">
              <label>納品日</label>
              <input
                type="date"
                value={date}
                onChange={e => { setDate(e.target.value); }}
              />
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="dn-edit-banner">
            納品書 No.{initialNote.deliveryNo} を修正中
          </div>
        )}

        {/* 技工物テーブル */}
        <div className="dn-table-wrap">
          <table className="dn-table">
            <thead>
              <tr>
                <th>技工物名</th>
                <th>区分</th>
                <th>単価</th>
                <th>数量</th>
                <th>金額</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>
                    <input
                      value={item.gikobutsuName}
                      onChange={e => updateItem(item.id, 'gikobutsuName', e.target.value)}
                      placeholder="技工物名"
                    />
                  </td>
                  <td>
                    <select
                      value={item.category}
                      onChange={e => updateItem(item.id, 'category', e.target.value)}
                    >
                      <option value="">-</option>
                      {CAT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={e => updateItem(item.id, 'unitPrice', e.target.value)}
                      className="dn-num"
                      min="0"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => updateItem(item.id, 'quantity', e.target.value)}
                      className="dn-qty"
                      min="1"
                    />
                  </td>
                  <td className="dn-amount">
                    {(item.unitPrice * item.quantity).toLocaleString()}
                  </td>
                  <td>
                    <button className="del-btn" onClick={() => removeItem(item.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="dn-add-row-btn" onClick={addEmptyItem}>＋ 行を追加</button>
        </div>

        {/* 金属使用量 */}
        <div className="dn-section dn-metal">
          <span className="dn-metal-label">金属使用量：</span>
          <label>
            パラ&nbsp;
            <input type="number" step="0.1" min="0" value={paraGram}
              onChange={e => setParaGram(e.target.value)} className="dn-gram" />
            g
          </label>
          <label>
            ミロ&nbsp;
            <input type="number" step="0.1" min="0" value={miroGram}
              onChange={e => setMiroGram(e.target.value)} className="dn-gram" />
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

        {/* ボタン */}
        <div className="dn-actions">
          <button className="cancel-btn" onClick={onBack}>← 戻る</button>
          <button
            className="submit-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '保存中...' : isEditing ? '更新' : '保存'}
          </button>
        </div>
      </div>

      {/* ── 右：料金表（クリックで技工物追加） ── */}
      <div className="dn-right">
        <div className="card-header">
          <h3>{clinicName ? `${clinicName} 料金表` : '料金表'}</h3>
        </div>
        {!clinicId && (
          <p className="dn-price-hint" style={{ padding: '0.75rem' }}>
            医院が未登録のため料金表を表示できません
          </p>
        )}
        <div className="dn-price-list">
          {productsWithPrice.map(p => (
            <div
              key={p.id}
              className="dn-price-item"
              onClick={() => addItemFromProduct(p)}
              title="クリックで技工物リストに追加"
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
          <p className="dn-price-hint">クリックで技工物リストに追加</p>
        )}
      </div>
    </div>
  );
}
