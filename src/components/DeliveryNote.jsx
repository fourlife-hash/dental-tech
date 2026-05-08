import { useState, useEffect } from 'react';
import DeliveryNoteForm from './DeliveryNoteForm.jsx';
import DeliveryNoteList from './DeliveryNoteList.jsx';
import DeliveryNotePrint from './DeliveryNotePrint.jsx';
import { fetchDeliveryNotes } from '../api.js';

function fmtDate(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function CalendarPicker({ selectedDate, onSelect }) {
  const today = new Date();
  const [calYear, setCalYear]   = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-indexed

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  }

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function toISO(d) {
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${calYear}-${mm}-${dd}`;
  }

  const styles = {
    wrapper: { maxWidth: 320, margin: '0 auto', userSelect: 'none' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    navBtn: { background: 'none', border: '1px solid #ccc', borderRadius: 4, padding: '4px 12px', fontSize: 18, cursor: 'pointer' },
    title: { fontWeight: 'bold', fontSize: 16 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 },
    weekday: { textAlign: 'center', fontSize: 12, fontWeight: 'bold', padding: '4px 0', color: '#555' },
    day: (d) => ({
      textAlign: 'center', padding: '8px 0', borderRadius: 4, cursor: 'pointer', fontSize: 15,
      background: selectedDate === toISO(d) ? '#4a90e2' : 'transparent',
      color: selectedDate === toISO(d) ? '#fff' : '#000',
      fontWeight: selectedDate === toISO(d) ? 'bold' : 'normal',
    }),
    empty: { padding: '8px 0' },
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <button style={styles.navBtn} onClick={prevMonth}>‹</button>
        <span style={styles.title}>{calYear}年 {calMonth + 1}月</span>
        <button style={styles.navBtn} onClick={nextMonth}>›</button>
      </div>
      <div style={styles.grid}>
        {WEEKDAYS.map(w => <div key={w} style={styles.weekday}>{w}</div>)}
        {cells.map((d, i) =>
          d === null
            ? <div key={`e-${i}`} style={styles.empty} />
            : <div key={d} style={styles.day(d)} onClick={() => onSelect(toISO(d))}>{d}</div>
        )}
      </div>
    </div>
  );
}

export default function DeliveryNote() {
  const [subTab, setSubTab]           = useState('new');
  const [screen, setScreen]           = useState('date');
  const [selectedDate, setSelectedDate] = useState('');
  const [groupedJobs, setGroupedJobs] = useState({});
  const [savedNotes, setSavedNotes]   = useState([]);
  const [clinics, setClinics]         = useState([]);
  const [formData, setFormData]       = useState(null);
  const [notes, setNotes]             = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [printNotes, setPrintNotes]   = useState(null);

  useEffect(() => {
    fetch('/api/clinics').then(r => r.json()).then(setClinics);
    loadNotes();
  }, []);

  async function loadNotes() {
    try { setNotes(await fetchDeliveryNotes()); }
    catch (e) { console.error(e); }
  }

  async function loadSavedNotesForDate(date) {
    try {
      const all = await fetchDeliveryNotes();
      setSavedNotes(all.filter(n => n.deliveryDate === date));
    } catch (e) { console.error(e); }
  }

  async function handleDateChange(date) {
    setSelectedDate(date);
    if (!date) return;
    setLoadingJobs(true);
    try {
      const [jobs, allNotes] = await Promise.all([
        fetch(`/api/jobs?${new URLSearchParams({ date, done: 'true' })}`).then(r => r.json()),
        fetchDeliveryNotes(),
      ]);
      setSavedNotes(allNotes.filter(n => n.deliveryDate === date));

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
    const existingNote = savedNotes.find(
      n => n.patientName === job.patient && n.clinicName === job.clinic
    );
    setFormData({
      job,
      clinicId:     clinic?.id || '',
      deliveryDate: selectedDate,
      existingNote: existingNote || null,
    });
    setScreen('form');
  }

  function handleClinicPrint(clinicName) {
    const clinicNotes = savedNotes
      .filter(n => n.clinicName === clinicName)
      .sort((a, b) => a.deliveryNo.localeCompare(b.deliveryNo));
    if (clinicNotes.length === 0) {
      alert('この医院の保存済みデータがありません');
      return;
    }
    setPrintNotes(clinicNotes);
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

  async function handleFormSaved() {
    if (formData?.fromList) {
      loadNotes();
      setSubTab('list');
      setScreen('date');
      setFormData(null);
    } else {
      await loadSavedNotesForDate(selectedDate);
      loadNotes();
      setScreen('patients');
      setFormData(null);
    }
  }

  function switchToNew() {
    setSubTab('new');
    setScreen('date');
    setSelectedDate('');
    setGroupedJobs({});
    setSavedNotes([]);
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

      {subTab === 'new' && (
        <>
          {/* STEP 1: 日付選択 */}
          {screen === 'date' && !formData && (
            <div className="dn-date-screen">
              <p className="dn-date-prompt">納品日を選択してください</p>
              <CalendarPicker selectedDate={selectedDate} onSelect={handleDateChange} />
              {loadingJobs && <p className="dn-loading">読み込み中...</p>}
            </div>
          )}

          {/* STEP 2: 患者一覧（医院別） */}
          {screen === 'patients' && selectedDate && !formData && (
            <div className="dn-patients-screen">
              <div className="dn-patients-header">
                <button
                  className="dn-back-btn"
                  onClick={() => { setScreen('date'); setSelectedDate(''); setGroupedJobs({}); setSavedNotes([]); }}
                >
                  ← 日付選択に戻る
                </button>
                <span className="dn-patients-date">{fmtDate(selectedDate)} の患者一覧</span>
              </div>

              {Object.keys(groupedJobs).length === 0 ? (
                <p className="empty-msg" style={{ padding: '1.5rem' }}>
                  この日のジョブが見つかりません
                </p>
              ) : (
                Object.entries(groupedJobs).map(([clinicName, jobs]) => {
                  const clinicNotes = savedNotes.filter(n => n.clinicName === clinicName);
                  return (
                    <div key={clinicName} className="dn-clinic-group">
                      <div className="dn-clinic-header">
                        <span>■ {clinicName}</span>
                        <button
                          className="dn-clinic-print-btn"
                          onClick={() => handleClinicPrint(clinicName)}
                          disabled={clinicNotes.length === 0}
                          title={clinicNotes.length > 0 ? `${clinicNotes.length}件まとめて印刷` : '保存済みデータなし'}
                        >
                          印刷{clinicNotes.length > 0 ? `（${clinicNotes.length}件）` : ''}
                        </button>
                      </div>
                      {jobs.map(job => {
                        const savedNote = savedNotes.find(
                          n => n.patientName === job.patient && n.clinicName === job.clinic
                        );
                        return (
                          <div
                            key={job.id}
                            className={`dn-patient-item${savedNote ? ' dn-patient-saved-item' : ''}`}
                            onClick={() => handleSelectPatient(job)}
                          >
                            <span className="dn-patient-name">{job.patient}</span>
                            {savedNote ? (
                              <span className="dn-patient-saved-badge">保存済</span>
                            ) : job.gikobutsu ? (
                              <span className="dn-patient-giko">（{job.gikobutsu}）</span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* STEP 3: 技工物入力フォーム（1患者） */}
          {formData && (
            <DeliveryNoteForm
              key={formData.initialNote?.id || formData.existingNote?.id || formData.job?.id || 'form'}
              job={formData.job || null}
              clinicId={formData.clinicId}
              deliveryDate={formData.deliveryDate || ''}
              initialNote={formData.initialNote || null}
              existingNote={formData.existingNote || null}
              onBack={handleBack}
              onSaved={handleFormSaved}
            />
          )}
        </>
      )}

      {/* 発行済み一覧タブ */}
      {subTab === 'list' && (
        <DeliveryNoteList notes={notes} onReload={loadNotes} onEdit={handleEdit} />
      )}

      {/* 医院別まとめ印刷オーバーレイ */}
      {printNotes && (
        <DeliveryNotePrint
          notes={printNotes}
          onClose={() => setPrintNotes(null)}
        />
      )}
    </div>
  );
}
