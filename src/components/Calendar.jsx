import { useMemo } from 'react';

function localStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function jobDateKey(job, mode) {
  if (mode === 'set') return job.setDate;
  const d = new Date(job.setDate + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return localStr(d);
}

export default function Calendar({ jobs, mode, currentMonth, selectedDate, onSelectDate, onChangeMonth, onToggleMode }) {
  const year  = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const jobsByDate = useMemo(() => {
    const map = {};
    jobs.forEach(job => {
      const key = jobDateKey(job, mode);
      if (!map[key]) map[key] = { total: 0, done: 0 };
      map[key].total++;
      if (job.done) map[key].done++;
    });
    return map;
  }, [jobs, mode]);

  const days = useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const pad = Array(firstDow).fill(null);
    const actual = Array.from({ length: lastDate }, (_, i) => {
      const d = i + 1;
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    });
    return [...pad, ...actual];
  }, [year, month]);

  const today   = localStr(new Date());
  const modeClr = mode === 'set' ? '#2563eb' : '#16a34a';

  return (
    <div className="card">
      <div className="card-header">
        <div className="calendar-nav">
          <button className="nav-btn" onClick={() => onChangeMonth(new Date(year, month - 1, 1))}>‹</button>
          <h2>{year}年 {month + 1}月</h2>
          <button className="nav-btn" onClick={() => onChangeMonth(new Date(year, month + 1, 1))}>›</button>
        </div>
        <button
          className={`mode-toggle ${mode === 'set' ? 'mode-set' : 'mode-make'}`}
          onClick={onToggleMode}
        >
          {mode === 'set' ? '▶ セット日' : '▶ 製作日'}
        </button>
      </div>

      <div className="calendar-grid">
        {['日','月','火','水','木','金','土'].map((d, i) => (
          <div key={d} className={`dow-header ${i===0?'sun':''} ${i===6?'sat':''}`}>{d}</div>
        ))}

        {days.map((date, i) => {
          if (!date) return <div key={`e${i}`} className="cal-day empty" />;

          const info    = jobsByDate[date];
          const dow     = new Date(date + 'T00:00:00').getDay();
          const isToday = date === today;
          const isSel   = date === selectedDate;

          const dayCls = [
            'cal-day',
            dow === 0 ? 'sun' : dow === 6 ? 'sat' : '',
            isToday ? 'is-today' : '',
            isSel   ? 'is-selected' : '',
          ].filter(Boolean).join(' ');

          return (
            <div
              key={date}
              className={dayCls}
              style={info ? { borderTop: `3px solid ${modeClr}` } : undefined}
              onClick={() => onSelectDate(isSel ? null : date)}
            >
              <span className="day-num">{parseInt(date.slice(8), 10)}</span>
              {info && (
                <div className="day-badges">
                  <span className="day-badge" style={{ background: modeClr }}>
                    {info.total}件
                    {info.done > 0 && ` (済${info.done})`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
