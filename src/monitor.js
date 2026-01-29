const http = require('http');
const https = require('https');
const db = require('./db');
const config = require('../config');

const activeTimers = new Map();

function pingUrl(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    const client = url.startsWith('https') ? https : http;

    const req = client.get(url, { timeout: config.maxResponseTimeMs }, (res) => {
      res.resume();
      resolve({
        status: res.statusCode,
        responseTime: Date.now() - start,
        error: null,
      });
    });

    req.on('error', (err) => {
      resolve({
        status: null,
        responseTime: Date.now() - start,
        error: err.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: null,
        responseTime: Date.now() - start,
        error: 'Timeout',
      });
    });
  });
}

function recordCheck(monitorId, result) {
  const stmt = db.prepare(
    'INSERT INTO checks (monitor_id, status, response_time, error) VALUES (?, ?, ?, ?)'
  );
  stmt.run(monitorId, result.status, result.responseTime, result.error);
}

async function checkMonitor(monitor) {
  const result = await pingUrl(monitor.url);
  recordCheck(monitor.id, result);
}

function startMonitor(monitor) {
  if (activeTimers.has(monitor.id)) return;

  checkMonitor(monitor);

  const timer = setInterval(() => {
    checkMonitor(monitor);
  }, monitor.interval * 1000);

  activeTimers.set(monitor.id, timer);
}

function stopMonitor(monitorId) {
  const timer = activeTimers.get(monitorId);
  if (timer) {
    clearInterval(timer);
    activeTimers.delete(monitorId);
  }
}

function startAllMonitors() {
  const monitors = db.prepare('SELECT * FROM monitors WHERE active = 1').all();
  for (const monitor of monitors) {
    startMonitor(monitor);
  }
}

function stopAllMonitors() {
  for (const [id] of activeTimers) {
    stopMonitor(id);
  }
}

module.exports = { startMonitor, stopMonitor, startAllMonitors, stopAllMonitors };
