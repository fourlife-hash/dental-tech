import { useState } from 'react';
import DeliveryNotePrint from './DeliveryNotePrint.jsx';

function fmt(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${y}/${m}/${d}`;
}

export default function DeliveryNoteList({ notes, onEdit }) {
  const [printNotes, setPrintNotes] = useState(null);

  function handleReprint(n) {
    // 同医院・同日の全納品書をまとめて印刷
    const batch = notes
      .filter(x => x.clinicName === n.clinicName && x.deliveryDate === n.deliveryDate)
      .sort((a, b) => a.deliveryNo.localeCompare(b.deliveryNo));
    setPrintNotes(batch.length > 0 ? batch : [n]);
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
