import { useState, useEffect } from 'react';

export default function Settings() {
  const [bankInfo, setBankInfo] = useState('');
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');

  useEffect(() => {
    fetch('/api/company-info')
      .then(r => r.json())
      .then(d => setBankInfo(d.bank_info || ''));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/company-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankInfo }),
      });
      if (!res.ok) throw new Error('保存失敗');
      setMsg('保存しました');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('エラー: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ color: '#1a3a5c', marginBottom: '1.5rem', fontSize: 20 }}>設定</h2>

      <form onSubmit={handleSave}>
        <div style={{ background: '#fafafa', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: 14, marginBottom: 4, color: '#333' }}>
            弊社銀行口座
            <span style={{ fontWeight: 'normal', fontSize: 12, color: '#888', marginLeft: 8 }}>（請求書フッターに改行を保持して表示されます。複数口座も入力可）</span>
          </label>
          <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px' }}>
            例：みずほ銀行 京都支店 普通 1234567 デンタル テック アライズ<br />
            　　京都銀行 〇〇支店 普通 7654321 デンタル テック アライズ
          </p>
          <textarea
            value={bankInfo}
            onChange={e => setBankInfo(e.target.value)}
            rows={6}
            placeholder={`みずほ銀行 京都支店 普通 1234567 デンタル テック アライズ\n京都銀行 〇〇支店 普通 7654321 デンタル テック アライズ`}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 6,
              border: '1px solid #ccc', fontSize: 13, lineHeight: 1.8,
              resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button type="submit" disabled={saving}
            style={{ padding: '8px 28px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
            {saving ? '保存中...' : '保存'}
          </button>
          {msg && (
            <span style={{ fontSize: 13, color: msg.startsWith('エラー') ? '#e74c3c' : '#27ae60' }}>
              {msg}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
