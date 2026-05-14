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

function CalendarPicker({ onSelect, selectedDate }) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const [cur, setCur] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const DAYS = ['日','月','火','水','木','金','土'];

  function pad(n){ return String(n).padStart(2,'0'); }
  function fmt(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
  function fmtJP(str){ if(!str) return ''; const [y,m,d]=str.split('-'); return `${y}年${parseInt(m)}月${parseInt(d)}日`; }

  const first = new Date(cur.getFullYear(), cur.getMonth(), 1);
  const last  = new Date(cur.getFullYear(), cur.getMonth()+1, 0);
  const blanks = Array.from({length: first.getDay()});
  const daysArr = Array.from({length: last.getDate()}, (_,i)=>i+1);

  return (
    <div style={{maxWidth:'320px',margin:'0 auto',padding:'1rem 0'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
        <button onClick={()=>setCur(new Date(cur.getFullYear(),cur.getMonth()-1,1))}
          style={{background:'none',border:'0.5px solid #ccc',borderRadius:'8px',width:'36px',height:'36px',fontSize:'20px',cursor:'pointer'}}>‹</button>
        <span style={{fontWeight:'500',fontSize:'16px'}}>{cur.getFullYear()}年{cur.getMonth()+1}月</span>
        <button onClick={()=>setCur(new Date(cur.getFullYear(),cur.getMonth()+1,1))}
          style={{background:'none',border:'0.5px solid #ccc',borderRadius:'8px',width:'36px',height:'36px',fontSize:'20px',cursor:'pointer'}}>›</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px'}}>
        {DAYS.map((d,i)=>(
          <div key={d} style={{textAlign:'center',fontSize:'12px',padding:'4px 0',fontWeight:'500',
            color: i===0?'#E24B4A': i===6?'#378ADD':'#888'}}>{d}</div>
        ))}
        {blanks.map((_,i)=><div key={'b'+i}/>)}
        {daysArr.map(d=>{
          const dt = new Date(cur.getFullYear(), cur.getMonth(), d);
          const dateStr = fmt(dt);
          const dow = dt.getDay();
          const isToday = dt.getTime()===today.getTime();
          const isSel = selectedDate===dateStr;
          return (
            <button key={d} onClick={()=>onSelect(dateStr)}
              style={{
                textAlign:'center',padding:'8px 0',fontSize:'15px',border:'none',
                borderRadius:'8px',cursor:'pointer',fontWeight: isSel||isToday?'500':'400',
                background: isSel?'#1D9E75':'transparent',
                color: isSel?'#fff': isToday?'#1D9E75': dow===0?'#E24B4A': dow===6?'#378ADD':'inherit',
                outline: isToday&&!isSel?'1.5px solid #1D9E75':'none',
              }}>{d}</button>
          );
        })}
      </div>
      {selectedDate && (
        <p style={{textAlign:'center',marginTop:'12px',fontSize:'14px',color:'#888'}}>
          選択中：{fmtJP(selectedDate)}
        </p>
      )}
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
  const [printNotes, setPrintNotes]         = useState(null);
  const [printMetalBalance, setPrintMetalBalance] = useState(null);

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
        fetch(`/api/jobs?${new URLSearchParams({ date })}`).then(r => r.json()),
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

  async function handleClinicPrint(clinicName) {
    const clinicNotes = savedNotes
      .filter(n => n.clinicName === clinicName)
      .sort((a, b) => a.deliveryNo.localeCompare(b.deliveryNo));
    if (clinicNotes.length === 0) {
      alert('この医院の保存済みデータがありません');
      return;
    }
    // 医院の金属残量を取得
    const summary = await fetch('/api/metal-stocks/summary').then(r => r.json());
    const cs = summary.filter(s => s.clinicName === clinicName);
    const metalBalance = {
      para: cs.find(s => s.metalType === 'パラジウム')?.balance ?? 0,
      miro: cs.find(s => s.metalType === 'ミロ')?.balance ?? 0,
    };
    setPrintMetalBalance(metalBalance);
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
              <CalendarPicker
                selectedDate={selectedDate}
                onSelect={(date) => handleDateChange(date)}
              />
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
          metalBalance={printMetalBalance}
          onClose={() => { setPrintNotes(null); setPrintMetalBalance(null); }}
        />
      )}
    </div>
  );
}
