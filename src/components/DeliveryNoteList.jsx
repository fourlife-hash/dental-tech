import { useState } from 'react';
import DeliveryNotePrint from './DeliveryNotePrint.jsx';
import { deleteDeliveryNote } from '../api.js';

function fmt(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${y}/${m}/${d}`;
}

export default function DeliveryNoteList({ notes, onReload, onEdit }) {
  const [printNotes, setPrintNotes] = useState(null);

  // 再印刷：該当1件のみ
  function handleReprint(n) {
    setPrintNotes([n]);
  }

  async function handleDelete(n) {
    if (!window.confirm(`この納品書を削除しますか？\nNo.${n.deliveryNo}　${n.clinicName}　${n.patientName || ''}`)) return;
    try {
      await deleteDeliveryNote(n.id);
      onReload?.();
    } catch {
      alert('削除に失敗しました');
    }
  }

  return (
    <div className="card-body">
      {notes.length === 0 ? (
        <p className="empty-msg">発行済みの納品書はありません</p>
      ) : (
        <table className="dn-list-table">
          <thead>
            <tr>
              <th>納品No</th>
              <th>納品日</th>
              <th>医院名</th>
              <th>患者名</th>
              <th>技工合計</th>
              <th>材料合計</th>
              <th>消費税</th>
              <th>合計金額</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {notes.map(n => (
              <tr key={n.id}>
                <td className="dn-list-no">{n.deliveryNo}</td>
                <td>{fmt(n.deliveryDate)}</td>
                <td>{n.clinicName}</td>
                <td>{n.patientName || '—'}</td>
                <td className="dn-list-num">¥{n.subtotalGiko.toLocaleString()}</td>
                <td className="dn-list-num">¥{n.subtotalMaterial.toLocaleString()}</td>
                <td className="dn-list-num">¥{n.tax.toLocaleString()}</td>
                <td className="dn-list-num dn-list-total">¥{n.total.toLocaleString()}</td>
                <td className="dn-list-actions">
                  <button className="edit-btn" onClick={() => handleReprint(n)}>再印刷</button>
                  <button className="edit-btn" onClick={() => onEdit(n)}>修正</button>
                  <button className="del-btn"  onClick={() => handleDelete(n)}>削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {printNotes && (
        <DeliveryNotePrint notes={printNotes} onClose={() => setPrintNotes(null)} />
      )}
    </div>
  );
}
