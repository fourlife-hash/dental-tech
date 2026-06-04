import { useState, useEffect } from 'react';

const CAT_OPTIONS = ['保', '自', '材', '預'];
const CAT_LABELS  = { '保':'保険', '自':'自費', '材':'材料', '預':'預かり' };
const BLUE = '#1a3a5c';

export default function Settings() {
  const [bankInfo, setBankInfo]       = useState('');
  const [baseUpPrice, setBaseUpPrice] = useState(150);
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState('');

  // 料金表管理
  const [clinics, setClinics]         = useState([]);
  const [products, setProducts]       = useState([]);
  const [clinicId, setClinicId]       = useState('');
  const [priceMap, setPriceMap]       = useState({}); // productId -> price
  const [priceSaving, setPriceSaving] = useState(false);
  const [priceMsg, setPriceMsg]       = useState('');
  const [newProduct, setNewProduct]   = useState({ name: '', category: '保' });
  const [addingProduct, setAddingProduct] = useState(false);

  useEffect(() => {
    fetch('/api/company-info').then(r => r.json()).then(d => {
      setBankInfo(d.bank_info || '');
      setBaseUpPrice(d.baseUpPrice ?? 150);
    });
    fetch('/api/clinics').then(r => r.json()).then(data => {
      setClinics(data);
      if (data.length > 0) setClinicId(data[0].id);
    });
    fetch('/api/products').then(r => r.json()).then(setProducts);
  }, []);

  useEffect(() => {
    if (!clinicId) return;
    fetch(`/api/prices/${clinicId}`).then(r => r.json()).then(prices => {
      const map = {};
      prices.forEach(p => { map[p.productId] = p.price; });
      setPriceMap(map);
    });
  }, [clinicId]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/company-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankInfo, baseUpPrice: parseInt(baseUpPrice) || 150 }),
      });
      if (!res.ok) throw new Error('保存失敗');
      setMsg('保存しました');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg('エラー: ' + err.message); }
    finally { setSaving(false); }
  }

  async function handlePriceSave() {
    setPriceSaving(true); setPriceMsg('');
    try {
      for (const [productId, price] of Object.entries(priceMap)) {
        await fetch('/api/prices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clinicId, productId, price: parseInt(price) || 0 }),
        });
      }
      setPriceMsg('料金表を保存しました');
      setTimeout(() => setPriceMsg(''), 3000);
    } catch (err) { setPriceMsg('エラー: ' + err.message); }
    finally { setPriceSaving(false); }
  }

  async function handleAddProduct(e) {
    e.preventDefault();
    if (!newProduct.name) return;
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
      const data = await res.json();
      if (!res.ok) { alert('エラー: ' + (data.error || res.status)); return; }
      setProducts(prev => [...prev, data]);
      setNewProduct({ name: '', category: '保' });
      setAddingProduct(false);
    } catch (err) {
      alert('エラー: ' + err.message);
    }
  }

  async function handleDeleteProduct(id, name) {
    if (!confirm(`「${name}」を削除しますか？（全医院の料金設定も削除されます）`)) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    setProducts(prev => prev.filter(p => p.id !== id));
    setPriceMap(prev => { const m = { ...prev }; delete m[id]; return m; });
  }

  const inp = { padding: '5px 8px', borderRadius: 6, border: '1px solid #ccc', fontSize: 13 };

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ color: BLUE, marginBottom: '1.5rem', fontSize: 20 }}>設定</h2>

      {/* ─── 弊社情報 ─── */}
      <form onSubmit={handleSave}>
        <div style={{ background: '#fafafa', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: 14, marginBottom: 8, color: '#333' }}>
            ベースアップ支援料（1件あたり・税込）
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>¥</span>
            <input type="number" min="0" value={baseUpPrice}
              onChange={e => setBaseUpPrice(e.target.value)}
              style={{ ...inp, width: 100, fontSize: 14 }} />
          </div>
        </div>

        <div style={{ background: '#fafafa', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: 14, marginBottom: 4, color: '#333' }}>
            弊社銀行口座
          </label>
          <textarea value={bankInfo} onChange={e => setBankInfo(e.target.value)} rows={4}
            placeholder="みずほ銀行 京都支店 普通 1234567 デンタル テック アライズ"
            style={{ width: '100%', ...inp, lineHeight: 1.8, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button type="submit" disabled={saving}
            style={{ padding: '8px 28px', background: BLUE, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
            {saving ? '保存中...' : '保存'}
          </button>
          {msg && <span style={{ fontSize: 13, color: msg.startsWith('エラー') ? '#e74c3c' : '#27ae60' }}>{msg}</span>}
        </div>
      </form>

      {/* ─── 料金表管理 ─── */}
      <div style={{ borderTop: '2px solid #e0e4f0', paddingTop: '1.5rem' }}>
        <h3 style={{ color: BLUE, fontSize: 17, marginBottom: '1rem' }}>料金表管理</h3>

        {/* 医院選択 */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            医院名
            <select value={clinicId} onChange={e => setClinicId(e.target.value)}
              style={{ ...inp, minWidth: 160 }}>
              {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <button onClick={handlePriceSave} disabled={priceSaving}
            style={{ padding: '6px 20px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
            {priceSaving ? '保存中...' : '料金表を保存'}
          </button>
          {priceMsg && <span style={{ fontSize: 13, color: priceMsg.startsWith('エラー') ? '#e74c3c' : '#27ae60' }}>{priceMsg}</span>}
        </div>

        {/* 料金表テーブル */}
        <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#e8eaf6' }}>
                <th style={{ padding: '7px 10px', textAlign: 'left', borderBottom: '2px solid #c5cae9' }}>製品名</th>
                <th style={{ padding: '7px 10px', textAlign: 'center', borderBottom: '2px solid #c5cae9', width: 60 }}>区分</th>
                <th style={{ padding: '7px 10px', textAlign: 'right', borderBottom: '2px solid #c5cae9', width: 120 }}>価格（円）</th>
                <th style={{ padding: '7px 10px', width: 60, borderBottom: '2px solid #c5cae9' }}></th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '6px 10px' }}>{p.name}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                    <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 12,
                      background: p.category === '保' ? '#e3f2fd' : p.category === '自' ? '#f3e5f5' : p.category === '材' ? '#e8f5e9' : '#fff8e1',
                      color: p.category === '保' ? '#1565c0' : p.category === '自' ? '#6a1b9a' : p.category === '材' ? '#2e7d32' : '#f57f17'
                    }}>{p.category}</span>
                  </td>
                  <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                    <input type="number" min="0" step="10"
                      value={priceMap[p.id] ?? ''}
                      onChange={e => setPriceMap(m => ({ ...m, [p.id]: e.target.value }))}
                      placeholder="未設定"
                      style={{ ...inp, width: 100, textAlign: 'right' }} />
                  </td>
                  <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                    <button onClick={() => handleDeleteProduct(p.id, p.name)}
                      style={{ background: 'none', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', color: '#999', fontSize: 12, padding: '2px 6px' }}>
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 製品追加 */}
        {!addingProduct ? (
          <button onClick={() => setAddingProduct(true)}
            style={{ padding: '6px 16px', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
            ＋ 製品を追加
          </button>
        ) : (
          <form onSubmit={handleAddProduct} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', background: '#f9f9f9', padding: '0.75rem', borderRadius: 8 }}>
            <input type="text" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
              placeholder="製品名" style={{ ...inp, width: 200 }} required />
            <select value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}
              style={inp}>
              {CAT_OPTIONS.map(c => <option key={c} value={c}>{c}（{CAT_LABELS[c]}）</option>)}
            </select>
            <button type="submit" style={{ padding: '5px 14px', background: BLUE, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>追加</button>
            <button type="button" onClick={() => setAddingProduct(false)}
              style={{ padding: '5px 10px', background: '#eee', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer' }}>取消</button>
          </form>
        )}
      </div>
    </div>
  );
}
