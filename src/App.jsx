import { useState, useEffect, useCallback } from 'react';
import Calendar from './components/Calendar.jsx';
import JobList from './components/JobList.jsx';
import AddJobForm from './components/AddJobForm.jsx';
import TodayPanel from './components/TodayPanel.jsx';
import EditModal from './components/EditModal.jsx';
import DeliveryNote from './components/DeliveryNote.jsx';
import MetalStock from './components/MetalStock.jsx';
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
  const [activeTab, setActiveTab]       = useState('jobs'); // 'jobs' | 'delivery' | 'metal'

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
        </nav>
        <span className="header-sub">全{jobs.length}件 / 済{jobs.filter(j=>j.done).length}件</span>
        <a
          href="/api/backup"
          download
          style={{ marginLeft: '1rem', padding: '4px 12px', background: '#4a6a8c', color: '#fff', borderRadius: 6, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}
        >バックアップ</a>
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
      ) : (
        <div className="dn-page">
          <MetalStock />
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
