import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, '..', 'data');

app.use(cors());
app.use(express.json());

// Helper functions
const readJsonFile = async (filename: string) => {
  const filePath = path.join(DATA_DIR, filename);
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
};

const writeJsonFile = async (filename: string, data: unknown) => {
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

// Tasks API
app.get('/api/tasks', async (_, res) => {
  try {
    const data = await readJsonFile('tasks.json');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read tasks' });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const data = await readJsonFile('tasks.json');
    data.tasks.push(req.body);
    await writeJsonFile('tasks.json', data);
    res.json(req.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const data = await readJsonFile('tasks.json');
    const index = data.tasks.findIndex((t: { id: string }) => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    data.tasks[index] = { ...data.tasks[index], ...req.body };
    await writeJsonFile('tasks.json', data);
    res.json(data.tasks[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const data = await readJsonFile('tasks.json');
    data.tasks = data.tasks.filter((t: { id: string }) => t.id !== req.params.id);
    await writeJsonFile('tasks.json', data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Calendar API
app.get('/api/calendar', async (_, res) => {
  try {
    const data = await readJsonFile('calendar.json');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read calendar' });
  }
});

app.put('/api/calendar/:date', async (req, res) => {
  try {
    const data = await readJsonFile('calendar.json');
    data.entries[req.params.date] = req.body;
    await writeJsonFile('calendar.json', data);
    res.json(data.entries[req.params.date]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update calendar' });
  }
});

// Reflections API
app.get('/api/reflections', async (_, res) => {
  try {
    const data = await readJsonFile('reflections.json');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read reflections' });
  }
});

app.post('/api/reflections', async (req, res) => {
  try {
    const data = await readJsonFile('reflections.json');
    data.reflections.push(req.body);
    await writeJsonFile('reflections.json', data);
    res.json(req.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create reflection' });
  }
});

app.put('/api/reflections/:id', async (req, res) => {
  try {
    const data = await readJsonFile('reflections.json');
    const index = data.reflections.findIndex((r: { id: string }) => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Reflection not found' });
    }
    data.reflections[index] = { ...data.reflections[index], ...req.body };
    await writeJsonFile('reflections.json', data);
    res.json(data.reflections[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update reflection' });
  }
});

// Settings API
app.get('/api/settings', async (_, res) => {
  try {
    const data = await readJsonFile('settings.json');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    await writeJsonFile('settings.json', req.body);
    res.json(req.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Task History API
app.get('/api/task-history', async (_, res) => {
  try {
    const data = await readJsonFile('taskHistory.json');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read task history' });
  }
});

app.get('/api/task-history/:date', async (req, res) => {
  try {
    const data = await readJsonFile('taskHistory.json');
    res.json({ tasks: data.tasks[req.params.date] || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read task history' });
  }
});

app.post('/api/task-history/:date', async (req, res) => {
  try {
    const data = await readJsonFile('taskHistory.json');
    const { date } = req.params;
    const task = req.body;

    if (!data.tasks[date]) {
      data.tasks[date] = [];
    }

    // 同じIDのタスクがなければ追加
    const exists = data.tasks[date].some((t: { id: string }) => t.id === task.id);
    if (!exists) {
      data.tasks[date].push(task);
      await writeJsonFile('taskHistory.json', data);
    }

    res.json({ tasks: data.tasks[date] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save task history' });
  }
});

// Daily Log API - 日付ごとの全データを取得
app.get('/api/daily-log/:date', async (req, res) => {
  try {
    const { date } = req.params;

    const [calendar, taskHistory, reflections, tasksData] = await Promise.all([
      readJsonFile('calendar.json'),
      readJsonFile('taskHistory.json'),
      readJsonFile('reflections.json'),
      readJsonFile('tasks.json'),
    ]);

    const calendarEntry = calendar.entries[date] || { completedCount: 0, pomodoroCount: 0, tasks: [] };

    // まずtaskHistoryから取得、なければカレンダーのタスクIDからtasks.jsonを参照
    let tasks = taskHistory.tasks[date] || [];
    if (tasks.length === 0 && calendarEntry.tasks.length > 0) {
      // tasks.jsonから該当タスクを取得
      tasks = tasksData.tasks.filter((t: { id: string; completed: boolean }) =>
        calendarEntry.tasks.includes(t.id) && t.completed
      );
    }

    // 振り返りは「その日に書いた」もの（date フィールド）を検索
    const reflection = reflections.reflections.find(
      (r: { date: string }) => r.date === date
    ) || null;

    res.json({
      date,
      calendarEntry,
      tasks,
      reflection,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read daily log' });
  }
});

// Quotes API
app.get('/api/quotes', async (_, res) => {
  try {
    const csvPath = path.join(DATA_DIR, 'famous_saying.csv');
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    const lines = csvContent.trim().split('\n');
    const quotes = lines.map(line => {
      const [author, message] = line.split(',');
      return { author: author.trim(), message: message.trim() };
    });
    res.json({ quotes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read quotes' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
