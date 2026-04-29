import { useState, useEffect } from 'react';
import DeliveryNoteForm from './DeliveryNoteForm.jsx';
import DeliveryNoteList from './DeliveryNoteList.jsx';
import { fetchDeliveryNotes } from '../api.js';

function fmtDate(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}

export default function DeliveryNote() {
  const [subTab, setSubTab]           = useState('new');
  const [screen, setScreen]           = useState('date'); // 'date'|'patients'|'form'
  const [selectedDate, setSelectedDate] = useState('');
  const [groupedJobs, setGroupedJobs] = useState({});     // { clinicName: job[] }
  const [clinics, setClinics]         = useState([]);
  const [formData, setFormData]       = useState(null);
  // formData = { job, clinicId, deliveryDate } | { initialNote, clinicId, fromList:true }
  const [notes, setNotes]             = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    fetch('/api/clinics').then(r => r.json()).then(setClinics);
    loadNotes();
  }, []);

  async function loadNotes() {
    try { setNotes(await fetchDeliveryNotes()); }
    catch (e) { console.error(e); }
  }

  async function handleDateChange(date) {
    setSelectedDate(date);
    if (!date) return;
    setLoadingJobs(true);
    try {
      const qs = new URLSearchParams({ date });
      const jobs = await fetch(`/api/jobs?${qs}`).then(r => r.json());
      const grouped = {};
      for (const job of jobs) {
        if (!grouped[job.clinic]) grouped[job.clinic] = [];
        grouped[job.clinic].push(job);
      }
      setGroupedJobs(grouped);
      setScreen('patients');
    } finally {
      setLoadingJobs(false);
    }
  }

  function handleSelectPatient(job) {
    const clinic = clinics.find(c => c.name === job.clinic);
    setFormData({ job, clinicId: clinic?.id || '', deliveryDate: selectedDate });
    setScreen('form');
  }

  function handleEdit(note) {
    const clinic = clinics.find(c => c.name === note.clinicName);
    setFormData({ initialNote: note, clinicId: clinic?.id || '', fromList: true });
    setSubTab('new');
    setScreen('form');
  }

  function handleBack() {
    if (formData?.fromList) {
      setSubTab('list');
      setScreen('date');
      setFormData(null);
    } else {
      setScreen('patients');
      setFormData(null);
    }
  }

  function handleSaved() {
    loadNotes();
  }

  function switchToNew() {
    setSubTab('new');
    setScreen('date');
    setSelectedDate('');
    setGroupedJobs({});
    setFormData(null);
  }

  return (
    <div className="dn-container">
      <div className="tab-row">
        <button
          className={`tab-btn${subTab === 'new' ? ' active' : ''}`}
          onClick={switchToNew}
        >新規作成</button>
        <button
          className={`tab-btn${subTab === 'list' ? ' active' : ''}`}
          onClick={() => { setSubTab('list'); loadNotes(); }}
        >発行済み一覧</button>
      </div>

      {/* ── 新規作成フロー ── */}
      {subTab === 'new' && (
        <>
          {/* STEP 1: 日付選択 */}
          {screen === 'date' && (
            <div className="dn-date-screen">
              <p className="dn-date-prompt">納品日を選択してください</p>
              <input
                type="date"
                value={selectedDate}
                onChange={e => handleDateChange(e.target.value)}
                className="dn-date-input"
              />
              {loadingJobs && <p className="dn-loading">読み込み中...</p>}
            </div>
          )}

          {/* STEP 2: 患者一覧（医院別） */}
          {screen === 'patients' && (
            <div className="dn-patients-screen">
              <div className="dn-patients-header">
                <button className="dn-back-btn" onClick={() => setScreen('date')}>
                  ← 日付選択に戻る
                </button>
                <span className="dn-patients-date">{fmtDate(selectedDate)} の患者一覧</span>
              </div>

              {Object.keys(groupedJobs).length === 0 ? (
                <p className="empty-msg" style={{ padding: '1.5rem' }}>
                  この日のジョブが見つかりません
                </p>
              ) : (
                Object.entries(groupedJobs).map(([clinicName, jobs]) => (
                  <div key={clinicName} className="dn-clinic-group">
                    <div className="dn-clinic-header">■ {clinicName}</div>
                    {jobs.map(job => (
                      <div
                        key={job.id}
                        className="dn-patient-item"
                        onClick={() => handleSelectPatient(job)}
                      >
                        <span className="dn-patient-name">{job.patient}</span>
                        {job.gikobutsu && (
                          <span className="dn-patient-giko">（{job.gikobutsu}）</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}

          {/* STEP 3: 納品書フォーム（1患者） */}
          {screen === 'form' && formData && (
            <DeliveryNoteForm
              key={formData.initialNote?.id || formData.job?.id || 'form'}
              job={formData.job || null}
              clinicId={formData.clinicId}
              deliveryDate={formData.deliveryDate || ''}
              initialNote={formData.initialNote || null}
              onBack={handleBack}
              onSaved={handleSaved}
            />
          )}
        </>
      )}

      {/* ── 発行済み一覧 ── */}
      {subTab === 'list' && (
        <DeliveryNoteList notes={notes} onReload={loadNotes} onEdit={handleEdit} />
      )}
    </div>
  );
}
