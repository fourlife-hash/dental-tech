import { useState } from 'react';

const DENTAL_RE = /\[DENTAL:([^|\]]+)\|([^|\]]+)\|(\d{4}-\d{2}-\d{2})\|(\d{2}:\d{2})(?:\|([^|\]]*))?\]/g;

function parseDental(text) {
  const results = [];
  DENTAL_RE.lastIndex = 0;
  let m;
  while ((m = DENTAL_RE.exec(text)) !== null) {
    results.push({ clinic: m[1].trim(), patient: m[2].trim(), setDate: m[3], setTime: m[4], gikobutsu: (m[5] || '').trim() });
  }
  return results;
}

export default function AddJobForm({ onAdd }) {
  const [tab, setTab]           = useState('paste');
  const [pasteText, setPaste]   = useState('');
  const [manual, setManual]     = useState({ clinic: '', patient: '', setDate: '', setTime: '' });
  const [msgText, setMsgText]   = useState('');
  const [msgType, setMsgType]   = useState('ok');

  function msg(text, type = 'ok') { setMsgText(text); setMsgType(type); }

  async function handleClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setPaste(text);
      msg('クリップボードから読み込みました');
    } catch {
      msg('クリップボードの読み取りに失敗しました（HTTPSまたはlocalhost必須）', 'err');
    }
  }

  async function handlePasteSubmit() {
    const parsed = parseDental(pasteText);
    if (parsed.length === 0) {
      msg('[DENTAL:...] 形式が見つかりませんでした', 'err');
      return;
    }
    let added = 0, dup = 0, err = 0;
    for (const job of parsed) {
      const r = await onAdd(job);
      if (r.success) added++;
      else if (r.isDuplicate) dup++;
      else err++;
    }
    const parts = [];
    if (added) parts.push(`${added}件 追加`);
    if (dup)   parts.push(`${dup}件 重複スキップ`);
    if (err)   parts.push(`${err}件 エラー`);
    msg(parts.join(' / '), added > 0 ? 'ok' : 'err');
    if (added > 0) setPaste('');
  }

  async function handleManualSubmit(e) {
    e.preventDefault();
    const { clinic, patient, setDate, setTime } = manual;
    if (!clinic || !patient || !setDate || !setTime) {
      msg('全項目を入力してください', 'err');
      return;
    }
    const r = await onAdd({ clinic, patient, setDate, setTime });
    if (r.success) {
      msg('追加しました');
      setManual({ clinic: '', patient: '', setDate: '', setTime: '' });
    } else {
      msg(r.isDuplicate ? '同じ内容が既に登録されています' : 'エラーが発生しました', 'err');
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>指示書登録</h3>
      </div>

      <div className="tab-row">
        <button className={`tab-btn ${tab==='paste'?'active':''}`} onClick={() => setTab('paste')}>
          テキスト貼り付け
        </button>
        <button className={`tab-btn ${tab==='manual'?'active':''}`} onClick={() => setTab('manual')}>
          手動入力
        </button>
      </div>

      {tab === 'paste' && (
        <div className="paste-area">
          <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
            形式: <code>[DENTAL:医院名|患者名|YYYY-MM-DD|HH:MM|技工物]</code>（技工物は省略可・複数可）
          </p>
          <textarea
            className="paste-textarea"
            value={pasteText}
            onChange={e => setPaste(e.target.value)}
            placeholder={'例: [DENTAL:中央歯科|山田太郎|2024-05-10|14:00|CAD]'}
          />
          <div className="btn-row">
            <button className="clipboard-btn" onClick={handleClipboard}>
              📋 クリップボードから貼り付け
            </button>
            <button
              className="submit-btn"
              onClick={handlePasteSubmit}
              disabled={!pasteText.trim()}
            >
              登録
            </button>
          </div>
        </div>
      )}

      {tab === 'manual' && (
        <form className="manual-form" onSubmit={handleManualSubmit}>
          <div className="form-row">
            <label>医院名</label>
            <input
              type="text"
              value={manual.clinic}
              onChange={e => setManual({ ...manual, clinic: e.target.value })}
              placeholder="○○歯科"
            />
          </div>
          <div className="form-row">
            <label>患者名</label>
            <input
              type="text"
              value={manual.patient}
              onChange={e => setManual({ ...manual, patient: e.target.value })}
              placeholder="山田 太郎"
            />
          </div>
          <div className="form-row">
            <label>セット日</label>
            <input
              type="date"
              value={manual.setDate}
              onChange={e => setManual({ ...manual, setDate: e.target.value })}
            />
          </div>
          <div className="form-row">
            <label>時間</label>
            <input
              type="time"
              value={manual.setTime}
              onChange={e => setManual({ ...manual, setTime: e.target.value })}
            />
          </div>
          <button type="submit" className="submit-btn">追加</button>
        </form>
      )}

      {msgText && (
        <p className={`form-msg ${msgType}`}>{msgText}</p>
      )}
    </div>
  );
}
