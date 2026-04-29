import { useState } from 'react';
import DeliveryNotePrint from './DeliveryNotePrint.jsx';

function fmt(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${y}/${m}/${d}`;
}

export default function DeliveryNoteList({ notes, onEdit }) {
  const [printNote, setPrintNote] = useState(null);

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
                <td className="dn-list-num">¥{n.subtotalGiko.toLocaleString()}</td>
                <td className="dn-list-num">¥{n.subtotalMaterial.toLocaleString()}</td>
                <td className="dn-list-num">¥{n.tax.toLocaleString()}</td>
                <td className="dn-list-num dn-list-total">¥{n.total.toLocaleString()}</td>
                <td className="dn-list-actions">
                  <button className="edit-btn" onClick={() => setPrintNote(n)}>再印刷</button>
                  <button className="edit-btn" onClick={() => onEdit(n)}>修正</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {printNote && (
        <DeliveryNotePrint note={printNote} onClose={() => setPrintNote(null)} />
      )}
    </div>
  );
}
