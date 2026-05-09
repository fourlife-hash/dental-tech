import { useState, useEffect, useCallback } from 'react';
import Calendar from './components/Calendar.jsx';
import JobList from './components/JobList.jsx';
import AddJobForm from './components/AddJobForm.jsx';
import TodayPanel from './components/TodayPanel.jsx';
import EditModal from './components/EditModal.jsx';
import DeliveryNote from './components/DeliveryNote.jsx';
import MetalStock from './components/MetalStock.jsx';
import Invoice from './components/Invoice.jsx';
import Settings from './components/Settings.jsx';
import { fetchJobs, createJob, patchDone, removeJob, updateJob } from './api.js';

function localStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function jobDateKey(job, mode) {
  if (mode === 'set') return job.setDate;
  const d = new Date(job.setDate + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return localStr(d);
}

export default function App() {
  const [jobs, setJobs]                 = useState([]);
  const [mode, setMode]                 = useState('set');
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingJob, setEditingJob]     = useState(null);
  const [activeTab, setActiveTab]       = useState('jobs'); // 'jobs' | 'delivery' | 'metal' | 'invoice' | 'settings'
  const [restoreMsg, setRestoreMsg]     = useState('');

  const loadJobs = useCallback(async () => {
    try {
      setJobs(await fetchJobs());
    } catch (e) {
      console.error('fetch error', e);
    }
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  async function handleAdd(jobData) {
    try {
      await createJob(jobData);
      await loadJobs();
      return { success: true };
    } catch (err) {
      if (err.status === 409) return { success: false, isDuplicate: true };
      return { success: false };
    }
  }

  async function handleToggleDone(id, done) {
    await patchDone(id, done);
    await loadJobs();
  }

  async function handleDelete(id) {
    await removeJob(id);
    await loadJobs();
  }

  async function handleFieldUpdate(id, fields) {
    await updateJob(id, fields);
    await loadJobs();
  }

  async function handleUpdate(id, fields) {
    await updateJob(id, fields);
    await loadJobs();
    setEditingJob(null);
  }

  const selectedJobs = selectedDate
    ? jobs.filter(j => jobDateKey(j, mode) === selectedDate)
    : [];

  return (
    <>
      <header className="app-header">
        <h1>歯科技工所管理</h1>
        <nav className="main-nav">
          <button
            className={`main-nav-btn${activeTab === 'jobs' ? ' active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >指示書</button>
          <button
            className={`main-nav-btn${activeTab === 'delivery' ? ' active' : ''}`}
            onClick={() => setActiveTab('delivery')}
          >納品書</button>
          <button
            className={`main-nav-btn${activeTab === 'metal' ? ' active' : ''}`}
            onClick={() => setActiveTab('metal')}
          >預かり金属</button>
          <button
            className={`main-nav-btn${activeTab === 'invoice' ? ' active' : ''}`}
            onClick={() => setActiveTab('invoice')}
          >請求書</button>
          <button
            className={`main-nav-btn${activeTab === 'settings' ? ' active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >設定</button>
        </nav>
        <span className="header-sub">全{jobs.length}件 / 済{jobs.filter(j=>j.done).length}件</span>
        <a
          href="/api/backup"
          download
          style={{ marginLeft: '1rem', padding: '4px 12px', background: '#4a6a8c', color: '#fff', borderRadius: 6, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}
        >バックアップ</a>
        <label style={{ marginLeft: '0.5rem', padding: '4px 12px', background: '#6a5acd', color: '#fff', borderRadius: 6, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          データ復元
          <input type="file" accept=".json" style={{ display: 'none' }} onChange={async e => {
            const file = e.target.files?.[0];
            if (!file) return;
            e.target.value = '';
            try {
              const text = await file.text();
              const data = JSON.parse(text);
              const res = await fetch('/api/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              });
              const result = await res.json();
              if (!res.ok) throw new Error(result.error || '復元失敗');
              const r = result.restored;
              setRestoreMsg(`復元完了 — jobs:${r.jobs} / 納品書:${r.deliveryNotes} / 金属:${r.metalStocks} / 医院:${r.clinics}`);
              await loadJobs();
              setTimeout(() => setRestoreMsg(''), 6000);
            } catch (err) {
              setRestoreMsg('エラー: ' + err.message);
              setTimeout(() => setRestoreMsg(''), 6000);
            }
          }} />
        </label>
        {restoreMsg && (
          <span style={{ marginLeft: '0.75rem', fontSize: 12, color: restoreMsg.startsWith('エラー') ? '#e74c3c' : '#27ae60', whiteSpace: 'nowrap' }}>
            {restoreMsg}
          </span>
        )}
      </header>

      {activeTab === 'jobs' ? (
        <div className="app-body">
          <div className="col-left">
            <Calendar
              jobs={jobs}
              mode={mode}
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onChangeMonth={setCurrentMonth}
              onToggleMode={() => setMode(m => m === 'set' ? 'make' : 'set')}
            />

            {selectedDate && (
              <JobList
                date={selectedDate}
                jobs={selectedJobs}
                mode={mode}
                onToggleDone={handleToggleDone}
                onDelete={handleDelete}
                onEdit={setEditingJob}
                onUpdate={handleFieldUpdate}
                onClose={() => setSelectedDate(null)}
              />
            )}
          </div>

          <div className="col-right">
            <AddJobForm onAdd={handleAdd} />
          </div>

          <TodayPanel jobs={jobs} onToggleDone={handleToggleDone} onEdit={setEditingJob} onUpdate={handleFieldUpdate} />
        </div>
      ) : activeTab === 'delivery' ? (
        <div className="dn-page">
          <DeliveryNote />
        </div>
      ) : activeTab === 'metal' ? (
        <div className="dn-page">
          <MetalStock />
        </div>
      ) : activeTab === 'invoice' ? (
        <div className="dn-page">
          <Invoice />
        </div>
      ) : (
        <div className="dn-page">
          <Settings />
        </div>
      )}

      {editingJob && (
        <EditModal
          job={editingJob}
          onSave={handleUpdate}
          onClose={() => setEditingJob(null)}
        />
      )}
    </>
  );
}
