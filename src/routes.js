const express = require('express');
const db = require('./db');
const config = require('../config');
const { startMonitor, stopMonitor } = require('./monitor');

const router = express.Router();

// Get all monitors with latest status
router.get('/api/monitors', (req, res) => {
  const monitors = db.prepare('SELECT * FROM monitors ORDER BY created_at DESC').all();

  const result = monitors.map((m) => {
    const latest = db.prepare(
      'SELECT * FROM checks WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT 1'
    ).get(m.id);

    const totalChecks = db.prepare(
      'SELECT COUNT(*) as count FROM checks WHERE monitor_id = ?'
    ).get(m.id).count;

    const upChecks = db.prepare(
      'SELECT COUNT(*) as count FROM checks WHERE monitor_id = ? AND status >= 200 AND status < 400'
    ).get(m.id).count;

    const uptime = totalChecks > 0 ? ((upChecks / totalChecks) * 100).toFixed(1) : null;

    const history = db.prepare(
      'SELECT status, response_time, checked_at FROM checks WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT 50'
    ).all(m.id).reverse();

    return {
      ...m,
      latestCheck: latest || null,
      uptime,
      history,
    };
  });

  res.json(result);
});

// Add a new monitor
router.post('/api/monitors', (req, res) => {
  const { name, url, interval } = req.body;

  if (!name || !url) {
    return res.status(400).json({ error: 'Name and URL are required' });
  }

  const checkInterval = Math.min(
    Math.max(interval || config.defaultInterval, config.minInterval),
    config.maxInterval
  );

  const stmt = db.prepare('INSERT INTO monitors (name, url, interval) VALUES (?, ?, ?)');
  const result = stmt.run(name, url, checkInterval);

  const monitor = db.prepare('SELECT * FROM monitors WHERE id = ?').get(result.lastInsertRowid);
  startMonitor(monitor);

  res.status(201).json(monitor);
});

// Delete a monitor
router.delete('/api/monitors/:id', (req, res) => {
  const { id } = req.params;
  stopMonitor(parseInt(id));
  db.prepare('DELETE FROM monitors WHERE id = ?').run(id);
  res.json({ success: true });
});

// Get check history for a monitor
router.get('/api/monitors/:id/checks', (req, res) => {
  const { id } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 100, 1000);

  const checks = db.prepare(
    'SELECT * FROM checks WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT ?'
  ).all(id, limit);

  res.json(checks);
});

// Status badge (SVG)
router.get('/api/badge/:id', (req, res) => {
  const { id } = req.params;
  const monitor = db.prepare('SELECT * FROM monitors WHERE id = ?').get(id);

  if (!monitor) {
    return res.status(404).send('Monitor not found');
  }

  const latest = db.prepare(
    'SELECT * FROM checks WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT 1'
  ).get(id);

  const isUp = latest && latest.status >= 200 && latest.status < 400;
  const statusText = latest ? (isUp ? 'up' : 'down') : 'unknown';
  const color = latest ? (isUp ? '#2ecc71' : '#e74c3c') : '#95a5a6';

  const labelWidth = monitor.name.length * 7 + 12;
  const statusWidth = statusText.length * 7 + 12;
  const totalWidth = labelWidth + statusWidth;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <linearGradient id="a" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <rect rx="3" width="${totalWidth}" height="20" fill="#555"/>
  <rect rx="3" x="${labelWidth}" width="${statusWidth}" height="20" fill="${color}"/>
  <path fill="${color}" d="M${labelWidth} 0h4v20h-4z"/>
  <rect rx="3" width="${totalWidth}" height="20" fill="url(#a)"/>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${monitor.name}</text>
    <text x="${labelWidth / 2}" y="14">${monitor.name}</text>
    <text x="${labelWidth + statusWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${statusText}</text>
    <text x="${labelWidth + statusWidth / 2}" y="14">${statusText}</text>
  </g>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache');
  res.send(svg);
});

module.exports = router;
