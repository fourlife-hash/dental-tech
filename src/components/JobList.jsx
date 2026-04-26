export default function JobList({ date, jobs, mode, onToggleDone, onDelete, onEdit, onClose }) {
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
              <li key={job.id} className={`job-item ${job.done ? 'done' : ''}`}>
                <input
                  type="checkbox"
                  checked={job.done}
                  onChange={e => onToggleDone(job.id, e.target.checked)}
                />
                <div className="job-info">
                  <span className="job-clinic">{job.clinic}</span>
                  <span className="job-patient">{job.patient}</span>
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
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
