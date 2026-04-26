import { useMemo } from 'react';

function localStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function makeDate(setDate) {
  const d = new Date(setDate + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return localStr(d);
}

function JobRow({ job, onToggleDone, onEdit }) {
  return (
    <li className={`job-item ${job.done ? 'done' : ''}`} style={{ padding: '0.4rem 0.6rem' }}>
      <input
        type="checkbox"
        checked={job.done}
        onChange={e => onToggleDone(job.id, e.target.checked)}
      />
      <div className="job-info">
        <span className="job-clinic">{job.clinic}</span>
        <span className="job-patient">{job.patient}</span>
        <span className="job-time">{job.setTime}</span>
      </div>
      <button className="edit-btn" onClick={() => onEdit(job)} title="編集">編集</button>
    </li>
  );
}

export default function TodayPanel({ jobs, onToggleDone, onEdit }) {
  const today   = localStr(new Date());
  const display = today.replace(/-/g, '/');

  const setJobs = useMemo(
    () => jobs.filter(j => j.setDate === today).sort((a, b) => a.setTime.localeCompare(b.setTime)),
    [jobs, today]
  );

  const makeJobs = useMemo(
    () => jobs.filter(j => makeDate(j.setDate) === today).sort((a, b) => a.setTime.localeCompare(b.setTime)),
    [jobs, today]
  );

  return (
    <div className="card row-full">
      <div className="card-header">
        <h3>本日 {display} の状況</h3>
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          セット {setJobs.length}件 / 製作 {makeJobs.length}件
        </span>
      </div>
      <div className="card-body">
        <div className="today-cols">
          <div>
            <div className="today-col-title set-title">
              セット日 ({setJobs.length}件)
            </div>
            {setJobs.length === 0 ? (
              <p className="empty-msg">なし</p>
            ) : (
              <ul className="job-ul">
                {setJobs.map(j => (
                  <JobRow key={j.id} job={j} onToggleDone={onToggleDone} onEdit={onEdit} />
                ))}
              </ul>
            )}
          </div>
          <div>
            <div className="today-col-title make-title">
              製作日 ({makeJobs.length}件) — 明日セット
            </div>
            {makeJobs.length === 0 ? (
              <p className="empty-msg">なし</p>
            ) : (
              <ul className="job-ul">
                {makeJobs.map(j => (
                  <JobRow key={j.id} job={j} onToggleDone={onToggleDone} onEdit={onEdit} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
