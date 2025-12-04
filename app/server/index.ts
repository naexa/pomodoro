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

// Categories API
app.get('/api/categories', async (_, res) => {
  try {
    const data = await readJsonFile('categories.json');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read categories' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const data = await readJsonFile('categories.json');
    data.categories.push(req.body);
    await writeJsonFile('categories.json', data);
    res.json(req.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const data = await readJsonFile('categories.json');
    const index = data.categories.findIndex((c: { id: string }) => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }
    data.categories[index] = { ...data.categories[index], ...req.body };
    await writeJsonFile('categories.json', data);
    res.json(data.categories[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const data = await readJsonFile('categories.json');
    data.categories = data.categories.filter((c: { id: string }) => c.id !== req.params.id);
    await writeJsonFile('categories.json', data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Stats API - 日別集計
app.get('/api/stats/daily/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const [taskHistory, categories] = await Promise.all([
      readJsonFile('taskHistory.json'),
      readJsonFile('categories.json'),
    ]);

    const tasks = taskHistory.tasks[date] || [];
    const categoryMap = new Map(categories.categories.map((c: { id: string }) => [c.id, c]));

    const stats: Record<string, number> = {};
    let uncategorizedCount = 0;

    for (const task of tasks) {
      if (task.categoryId && categoryMap.has(task.categoryId)) {
        stats[task.categoryId] = (stats[task.categoryId] || 0) + 1;
      } else {
        uncategorizedCount++;
      }
    }

    const categoryStats = Object.entries(stats).map(([categoryId, count]) => {
      const cat = categoryMap.get(categoryId) as { id: string; name: string; color: string };
      return {
        categoryId,
        categoryName: cat?.name || 'Unknown',
        color: cat?.color || 'gray',
        completedCount: count,
      };
    });

    res.json({
      date,
      categories: categoryStats,
      uncategorizedCount,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get daily stats' });
  }
});

// Stats API - 月別集計
app.get('/api/stats/monthly/:month', async (req, res) => {
  try {
    const { month } = req.params; // "2025-12"
    const [taskHistory, categories] = await Promise.all([
      readJsonFile('taskHistory.json'),
      readJsonFile('categories.json'),
    ]);

    const categoryMap = new Map(categories.categories.map((c: { id: string }) => [c.id, c]));

    const monthlyStats: Record<string, number> = {};
    let monthlyUncategorized = 0;
    const dailyBreakdown: Array<{ date: string; categories: Array<{ categoryId: string; categoryName: string; color: string; completedCount: number }>; uncategorizedCount: number }> = [];

    for (const [date, tasks] of Object.entries(taskHistory.tasks)) {
      if (!date.startsWith(month)) continue;

      const dayStats: Record<string, number> = {};
      let dayUncategorized = 0;

      for (const task of tasks as Array<{ categoryId?: string }>) {
        if (task.categoryId && categoryMap.has(task.categoryId)) {
          dayStats[task.categoryId] = (dayStats[task.categoryId] || 0) + 1;
          monthlyStats[task.categoryId] = (monthlyStats[task.categoryId] || 0) + 1;
        } else {
          dayUncategorized++;
          monthlyUncategorized++;
        }
      }

      dailyBreakdown.push({
        date,
        categories: Object.entries(dayStats).map(([categoryId, count]) => {
          const cat = categoryMap.get(categoryId) as { id: string; name: string; color: string };
          return {
            categoryId,
            categoryName: cat?.name || 'Unknown',
            color: cat?.color || 'gray',
            completedCount: count,
          };
        }),
        uncategorizedCount: dayUncategorized,
      });
    }

    dailyBreakdown.sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      month,
      categories: Object.entries(monthlyStats).map(([categoryId, count]) => {
        const cat = categoryMap.get(categoryId) as { id: string; name: string; color: string };
        return {
          categoryId,
          categoryName: cat?.name || 'Unknown',
          color: cat?.color || 'gray',
          completedCount: count,
        };
      }),
      uncategorizedCount: monthlyUncategorized,
      dailyBreakdown,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get monthly stats' });
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
