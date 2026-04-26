import { useState, useEffect } from 'react';

export default function EditModal({ job, onSave, onClose }) {
  const [form, setForm] = useState({
    clinic:  job.clinic,
    patient: job.patient,
    setDate: job.setDate,
    setTime: job.setTime,
  });

  useEffect(() => {
    setForm({ clinic: job.clinic, patient: job.patient, setDate: job.setDate, setTime: job.setTime });
  }, [job.id]);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.clinic || !form.patient || !form.setDate || !form.setTime) return;
    onSave(job.id, form);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>案件を編集</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form className="manual-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>医院名</label>
            <input type="text" value={form.clinic}  onChange={e => set('clinic',  e.target.value)} />
          </div>
          <div className="form-row">
            <label>患者名</label>
            <input type="text" value={form.patient} onChange={e => set('patient', e.target.value)} />
          </div>
          <div className="form-row">
            <label>セット日</label>
            <input type="date" value={form.setDate} onChange={e => set('setDate', e.target.value)} />
          </div>
          <div className="form-row">
            <label>時間</label>
            <input type="time" value={form.setTime} onChange={e => set('setTime', e.target.value)} />
          </div>
          <div className="btn-row" style={{ marginTop: '0.25rem' }}>
            <button type="button" className="cancel-btn" onClick={onClose}>キャンセル</button>
            <button type="submit" className="submit-btn">保存</button>
          </div>
        </form>
      </div>
    </div>
  );
}
