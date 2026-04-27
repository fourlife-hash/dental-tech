const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return { jobs: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), { encoding: 'utf8' });
}

// GET /api/jobs
app.get('/api/jobs', (req, res) => {
  const data = readData();
  res.json(data.jobs);
});

// POST /api/jobs
app.post('/api/jobs', (req, res) => {
  const { clinic, patient, setDate, setTime } = req.body;
  if (!clinic || !patient || !setDate || !setTime) {
    return res.status(400).json({ error: '必須項目が不足しています' });
  }

  const data = readData();

  const isDuplicate = data.jobs.some(
    j => j.clinic === clinic && j.patient === patient && j.setDate === setDate && j.setTime === setTime
  );
  if (isDuplicate) {
    return res.status(409).json({ error: '重複しています' });
  }

  const job = {
    id: uuidv4(),
    clinic,
    patient,
    setDate,
    setTime,
    done: false,
    createdAt: new Date().toISOString(),
  };

  data.jobs.push(job);
  writeData(data);
  res.status(201).json(job);
});

// PATCH /api/jobs/:id (update job fields)
app.patch('/api/jobs/:id', (req, res) => {
  const { id } = req.params;
  const { clinic, patient, setDate, setTime } = req.body;

  const data = readData();
  const job = data.jobs.find(j => j.id === id);
  if (!job) return res.status(404).json({ error: '案件が見つかりません' });

  if (clinic  != null) job.clinic  = clinic;
  if (patient != null) job.patient = patient;
  if (setDate != null) job.setDate = setDate;
  if (setTime != null) job.setTime = setTime;

  writeData(data);
  res.json(job);
});

// PATCH /api/jobs/:id/done
app.patch('/api/jobs/:id/done', (req, res) => {
  const { id } = req.params;
  const { done } = req.body;

  const data = readData();
  const job = data.jobs.find(j => j.id === id);
  if (!job) return res.status(404).json({ error: '案件が見つかりません' });

  job.done = Boolean(done);
  writeData(data);
  res.json(job);
});

// DELETE /api/jobs/:id
app.delete('/api/jobs/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();
  const idx = data.jobs.findIndex(j => j.id === id);
  if (idx === -1) return res.status(404).json({ error: '案件が見つかりません' });

  data.jobs.splice(idx, 1);
  writeData(data);
  res.status(204).end();
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`APIサーバー起動: http://localhost:${PORT}`);
});
