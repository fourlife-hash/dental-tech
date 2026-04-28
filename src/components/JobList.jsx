import { useState, useEffect } from 'react';

const GIKO_OPTIONS = ['CAD', 'CADインレー', 'FMC', 'インレー', 'BR', 'HR'];

function JobItem({ job, onToggleDone, onDelete, onEdit, onUpdate }) {
  const [shiki,      setShiki]      = useState(job.shiki      || '');
  const [gikobutsu,  setGikobutsu]  = useState(job.gikobutsu  || '');

  useEffect(() => {
    setShiki(job.shiki      || '');
    setGikobutsu(job.gikobutsu  || '');
  }, [job.shiki, job.gikobutsu]);

  function handleShikiBlur() {
    if (shiki !== (job.shiki || '')) onUpdate(job.id, { shiki });
  }

  function handleGikobutsBlur() {
    if (gikobutsu !== (job.gikobutsu || '')) onUpdate(job.id, { gikobutsu });
  }

  function handleGikoBtn(val) {
    setGikobutsu(val);
    onUpdate(job.id, { gikobutsu: val });
  }

  return (
    <li className={`job-item ${job.done ? 'done' : ''}`}>
      <input
        type="checkbox"
        checked={job.done}
        onChange={e => onToggleDone(job.id, e.target.checked)}
      />
      <div className="job-info">
        <span className="job-clinic">{job.clinic}</span>
        <div className="patient-row">
          <span className="job-patient">{job.patient}</span>
          <input
            className="shiki-input"
            value={shiki}
            onChange={e => setShiki(e.target.value)}
            onBlur={handleShikiBlur}
            placeholder="歯式"
            title="歯式"
          />
          <input
            className="gikobutsu-input"
            value={gikobutsu}
            onChange={e => setGikobutsu(e.target.value)}
            onBlur={handleGikobutsBlur}
            placeholder="技工物"
            title="技工物"
          />
          <div className="giko-btns">
            {GIKO_OPTIONS.map(opt => (
              <button key={opt} className="giko-btn" onClick={() => handleGikoBtn(opt)}>{opt}</button>
            ))}
          </div>
        </div>
        <span className="job-time">セット: {job.setDate} {job.setTime}</span>
      </div>
      <button className="edit-btn" onClick={() => onEdit(job)}>編集</button>
      <button
        className="del-btn"
        onClick={() => {
          if (window.confirm(`「${job.clinic} / ${job.patient}」を削除しますか？`)) {
            onDelete(job.id);
          }
        }}
      >
        削除
      </button>
    </li>
  );
}

export default function JobList({ date, jobs, mode, onToggleDone, onDelete, onEdit, onUpdate, onClose }) {
  const sorted = [...jobs].sort((a, b) => a.setTime.localeCompare(b.setTime));
  const modeLabel = mode === 'set' ? 'セット日' : '製作日';

  return (
    <div className="card">
      <div className="card-header">
        <h3>
          <span className="job-list-date">{date}</span>
          {' '}の{modeLabel}一覧
          <span style={{ fontWeight: 400, color: '#64748b', fontSize: '0.82rem', marginLeft: '0.4rem' }}>
            ({sorted.length}件)
          </span>
        </h3>
        <button className="close-btn" onClick={onClose} title="閉じる">×</button>
      </div>
      <div className="card-body">
        {sorted.length === 0 ? (
          <p className="empty-msg">この日の案件はありません</p>
        ) : (
          <ul className="job-ul">
            {sorted.map(job => (
              <JobItem
                key={job.id}
                job={job}
                onToggleDone={onToggleDone}
                onDelete={onDelete}
                onEdit={onEdit}
                onUpdate={onUpdate}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
