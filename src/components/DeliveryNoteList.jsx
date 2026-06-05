import { useState, useEffect, useCallback } from 'react';
import DeliveryNotePrint from './DeliveryNotePrint.jsx';
import { deleteDeliveryNote } from '../api.js';

function fmt(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${y}/${m}/${d}`;
}

export default function DeliveryNoteList({ notes, onReload, onEdit }) {
  const [printNotes, setPrintNotes] = useState(null);
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState(null); // null = 未検索（全件表示）
  const [searching, setSearching]   = useState(false);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults(null); return; }
    setSearching(true);
    try {
      const data = await fetch(`/api/delivery-notes/search?q=${encodeURIComponent(q)}`).then(r => r.json());
      setResults(data);
    } catch { setResults([]); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const displayNotes = results !== null ? results : notes;

  async function handleDelete(n) {
    if (!window.confirm(`この納品書を削除しますか？\nNo.${n.deliveryNo}　${n.clinicName}　${n.patientName || ''}`)) return;
    try {
      await deleteDeliveryNote(n.id);
      onReload?.();
      if (query) doSearch(query);
    } catch { alert('削除に失敗しました'); }
  }

  function itemNames(n) {
    const names = (n.rows || []).map(r => r.gikobutsuName).filter(Boolean);
    return names.join('、') || '—';
  }

  return (
    <div className="card-body">
      {/* 検索ボックス */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '0.75rem' }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="患者名・医院名で検索..."
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: 13, flex: 1, maxWidth: 320 }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults(null); }}
            style={{ padding: '5px 10px', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            クリア
          </button>
        )}
        {searching && <span style={{ fontSize: 12, color: '#888' }}>検索中...</span>}
        {results !== null && <span style={{ fontSize: 12, color: '#555' }}>{results.length}件</span>}
      </div>

      {displayNotes.length === 0 ? (
        <p className="empty-msg">{query ? '該当する納品書が見つかりません' : '発行済みの納品書はありません'}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="dn-list-table">
            <thead>
              <tr>
                <th>納品No</th>
                <th>納品日</th>
                <th>医院名</th>
                <th>患者名</th>
                <th>製作物</th>
                <th>技工合計</th>
                <th>材料合計</th>
                <th>消費税</th>
                <th>合計金額</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayNotes.map(n => (
                <tr key={n.id}>
                  <td className="dn-list-no">{n.deliveryNo}</td>
                  <td>{fmt(n.deliveryDate)}</td>
                  <td>{n.clinicName}</td>
                  <td>{n.patientName || '—'}</td>
                  <td style={{ fontSize: 12, color: '#555', maxWidth: 200 }}>{itemNames(n)}</td>
                  <td className="dn-list-num">¥{n.subtotalGiko.toLocaleString()}</td>
                  <td className="dn-list-num">¥{n.subtotalMaterial.toLocaleString()}</td>
                  <td className="dn-list-num">¥{n.tax.toLocaleString()}</td>
                  <td className="dn-list-num dn-list-total">¥{n.total.toLocaleString()}</td>
                  <td className="dn-list-actions">
                    <button className="edit-btn" onClick={() => setPrintNotes([n])}>再印刷</button>
                    <button className="edit-btn" onClick={() => onEdit(n)}>修正</button>
                    <button className="del-btn"  onClick={() => handleDelete(n)}>削除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {printNotes && (
        <DeliveryNotePrint notes={printNotes} onClose={() => setPrintNotes(null)} />
      )}
    </div>
  );
}
