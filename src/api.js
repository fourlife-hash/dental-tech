const BASE = '/api';

export async function fetchJobs() {
  const res = await fetch(`${BASE}/jobs`);
  if (!res.ok) throw new Error('fetch failed');
  return res.json();
}

export async function createJob(job) {
  const res = await fetch(`${BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job),
  });
  if (!res.ok) {
    const err = new Error('create failed');
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function updateJob(id, fields) {
  const res = await fetch(`${BASE}/jobs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error('update failed');
  return res.json();
}

export async function patchDone(id, done) {
  const res = await fetch(`${BASE}/jobs/${id}/done`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done }),
  });
  if (!res.ok) throw new Error('patch failed');
  return res.json();
}

export async function removeJob(id) {
  const res = await fetch(`${BASE}/jobs/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('delete failed');
}

export async function fetchDeliveryNotes() {
  const res = await fetch(`${BASE}/delivery-notes`);
  if (!res.ok) throw new Error('fetch failed');
  return res.json();
}

export async function createDeliveryNote(data) {
  const res = await fetch(`${BASE}/delivery-notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('create failed');
  return res.json();
}
