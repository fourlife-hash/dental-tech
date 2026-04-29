import { useState, useEffect, useRef } from 'react';
import DeliveryNotePrint from './DeliveryNotePrint.jsx';
import { createDeliveryNote, updateDeliveryNote, fetchDeliveryNotes } from '../api.js';

const CAT_MAP = { '保険技工': '保', '自費技工': '自', '材料': '材', '預かり': '預' };
const CAT_OPTIONS = ['保', '自', '材', '預'];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

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
//   job         = { id, clinic, patient, shiki, gikobutsu, ... }  新規時
//   clinicId    = 医院ID（料金表取得用）
//   deliveryDate = 納品日文字列
//   initialNote  = 既存納品書（修正時）
//   onBack      = 戻るコールバック
//   onSaved     = 保存完了コールバック
export default function DeliveryNoteForm({ job, clinicId, deliveryDate: deliveryDateProp, initialNote, onBack, onSaved }) {
  const isEditing = Boolean(initialNote);

  // 患者・医院は固定（変更不可）
  const patientName = initialNote?.patientName || job?.patient || '';
  const clinicName  = initialNote?.clinicName  || job?.clinic  || '';

  const [products, setProducts]       = useState([]);
  const [prices, setPrices]           = useState([]);
  const [shiki, setShiki]             = useState(initialNote?.shiki || job?.shiki || '');
  const [deliveryDate, setDeliveryDate] = useState(
    initialNote?.deliveryDate || deliveryDateProp || todayStr()
  );
  const [items, setItems]             = useState(
    initialNote?.rows?.length > 0
      ? initialNote.rows.map(r => makeItem(r))
      : []
  );
  const [paraGram, setParaGram]       = useState(
    initialNote?.paraGram > 0 ? String(initialNote.paraGram) : ''
  );
  const [miroGram, setMiroGram]       = useState(
    initialNote?.miroGram > 0 ? String(initialNote.miroGram) : ''
  );
  const [saving, setSaving]           = useState(false);
  const [printNotes, setPrintNotes]   = useState(null); // 配列（同医院同日の全件）
  const [savedBatch, setSavedBatch]   = useState(null); // 保存済みバッチ（再印刷用）
  const [savedMsg, setSavedMsg]       = useState('');

  // 初回のみジョブのgikobutsuをアイテムとして追加するフラグ
  const didInitItems = useRef(false);

  // 製品・料金マスタ取得
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts);
    if (clinicId) {
      fetch(`/api/prices/${clinicId}`).then(r => r.json()).then(setPrices);
    }
  }, []);

  // 新規モード：製品ロード後、ジョブの技工物を初期アイテムとして設定（1回のみ）
  useEffect(() => {
    if (isEditing || didInitItems.current || products.length === 0) return;
    didInitItems.current = true;
    if (!job?.gikobutsu) return;
    const prod = products.find(p => p.name === job.gikobutsu);
    const priceEntry = prod ? prices.find(pr => pr.productId === prod.id) : null;
    setItems([makeItem({
      gikobutsuName: job.gikobutsu,
      category:      prod ? (CAT_MAP[prod.category] || '') : '',
      unitPrice:     priceEntry?.price || 0,
    })]);
  }, [products, prices]);

  // 【バグ修正】料金表クリック → その患者のアイテムリストに追加（新しい患者行は追加しない）
  function addItemFromProduct(product) {
    const priceEntry = prices.find(pr => pr.productId === product.id);
    setItems(prev => [...prev, makeItem({
      gikobutsuName: product.name,
      category:      CAT_MAP[product.category] || '',
      unitPrice:     priceEntry?.price || 0,
    })]);
  }

  function addEmptyItem() {
    setItems(prev => [...prev, makeItem()]);
  }

  function removeItem(id) {
    setItems(prev => prev.filter(item => item.id !== id));
  }

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
        clinicId:         clinicId || null,
        clinicName,
        deliveryDate,
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
      const note = isEditing
        ? await updateDeliveryNote(initialNote.id, payload)
        : await createDeliveryNote(payload);

      // 同医院・同日の全納品書を取得してまとめて印刷
      let batchNotes = [note];
      try {
        const all = await fetchDeliveryNotes();
        const filtered = all
          .filter(n => n.clinicName === clinicName && n.deliveryDate === deliveryDate)
          .sort((a, b) => a.deliveryNo.localeCompare(b.deliveryNo));
        if (filtered.length > 0) batchNotes = filtered;
      } catch { /* 取得失敗時は単件で印刷 */ }

      onSaved?.();
      setSavedBatch(batchNotes);  // 再印刷用に保持
      setPrintNotes(batchNotes);
      setSavedMsg(`No.${note.deliveryNo} を${isEditing ? '更新' : '発行'}しました`);
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
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {isEditing && !savedMsg && (
          <div className="dn-edit-banner">
            納品書 No.{initialNote.deliveryNo} を修正中
          </div>
        )}
        {savedMsg && (
          <div className="dn-saved-banner">
            <span>{savedMsg}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {savedBatch && (
                <button className="edit-btn" onClick={() => setPrintNotes(savedBatch)}>
                  印刷プレビュー
                </button>
              )}
              <button className="dn-new-btn" onClick={onBack}>一覧に戻る</button>
            </div>
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

        {/* ボタン */}
        <div className="dn-actions">
          <button className="cancel-btn" onClick={onBack}>← 戻る</button>
          <button
            className="submit-btn"
            onClick={handleSave}
            disabled={saving || (!isEditing && !!savedMsg)}
          >
            {saving ? '保存中...'
              : isEditing ? '更新して再印刷'
              : savedMsg  ? '発行済み'
              : '保存して印刷'}
          </button>
        </div>
      </div>

      {/* ── 右：料金表（クリックでアイテム追加） ── */}
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

      {/* 印刷オーバーレイ（同医院同日の全患者を一括印刷） */}
      {printNotes && (
        <DeliveryNotePrint
          notes={printNotes}
          onClose={() => setPrintNotes(null)}
        />
      )}
    </div>
  );
}
