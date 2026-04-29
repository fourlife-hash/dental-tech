import { useState, useEffect } from 'react';
import DeliveryNoteForm from './DeliveryNoteForm.jsx';
import DeliveryNoteList from './DeliveryNoteList.jsx';
import { fetchDeliveryNotes } from '../api.js';

export default function DeliveryNote() {
  const [subTab, setSubTab]         = useState('new');
  const [notes, setNotes]           = useState([]);
  const [editingNote, setEditingNote] = useState(null);

  useEffect(() => { loadNotes(); }, []);

  async function loadNotes() {
    try { setNotes(await fetchDeliveryNotes()); }
    catch (e) { console.error(e); }
  }

  function handleEdit(note) {
    setEditingNote(note);
    setSubTab('new');
  }

  function handleSaved() {
    setEditingNote(null);
    loadNotes();
  }

  return (
    <div className="dn-container">
      <div className="tab-row">
        <button
          className={`tab-btn${subTab === 'new' ? ' active' : ''}`}
          onClick={() => { setSubTab('new'); setEditingNote(null); }}
        >新規作成</button>
        <button
          className={`tab-btn${subTab === 'list' ? ' active' : ''}`}
          onClick={() => { setSubTab('list'); loadNotes(); }}
        >発行済み一覧</button>
      </div>

      {subTab === 'new' ? (
        <DeliveryNoteForm
          key={editingNote?.id || 'new'}
          initialNote={editingNote}
          onSaved={handleSaved}
        />
      ) : (
        <DeliveryNoteList notes={notes} onReload={loadNotes} onEdit={handleEdit} />
      )}
    </div>
  );
}
