const monitorsEl = document.getElementById('monitors');
const form = document.getElementById('add-form');

async function fetchMonitors() {
  const res = await fetch('/api/monitors');
  return res.json();
}

function getStatus(check) {
  if (!check) return 'unknown';
  return check.status >= 200 && check.status < 400 ? 'up' : 'down';
}

function renderSparkline(history) {
  if (!history || history.length === 0) return '';

  const maxTime = Math.max(...history.map(h => h.response_time || 0), 1);

  return `<div class="sparkline-container">${history.map(h => {
    const isUp = h.status >= 200 && h.status < 400;
    const height = Math.max(((h.response_time || 0) / maxTime) * 30, 2);
    const cls = !isUp ? 'down' : (h.response_time > 2000 ? 'slow' : 'up');
    return `<div class="sparkline-bar ${cls}" style="height:${height}px" title="${h.response_time}ms - ${h.checked_at}"></div>`;
  }).join('')}</div>`;
}

function renderMonitor(m) {
  const status = getStatus(m.latestCheck);
  const responseTime = m.latestCheck ? `${m.latestCheck.response_time}ms` : '--';
  const uptimeText = m.uptime !== null ? `${m.uptime}%` : '--';

  return `
    <div class="monitor-card">
      <div class="monitor-header">
        <div class="monitor-info">
          <div class="status-dot ${status}"></div>
          <div>
            <div class="monitor-name">${escapeHtml(m.name)}</div>
            <div class="monitor-url">${escapeHtml(m.url)}</div>
          </div>
        </div>
        <div class="monitor-actions">
          <span class="uptime-badge">${uptimeText} uptime</span>
          <button class="delete-btn" onclick="deleteMonitor(${m.id})">Remove</button>
        </div>
      </div>
      <div class="monitor-details">
        <span>Interval: ${m.interval}s</span>
        <span>Response: ${responseTime}</span>
        <span>Badge: <code>/api/badge/${m.id}</code></span>
      </div>
      ${renderSparkline(m.history)}
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function refresh() {
  const monitors = await fetchMonitors();
  if (monitors.length === 0) {
    monitorsEl.innerHTML = '<p class="loading">No monitors yet. Add one above!</p>';
    return;
  }
  monitorsEl.innerHTML = monitors.map(renderMonitor).join('');
}

window.deleteMonitor = async function(id) {
  if (!confirm('Remove this monitor?')) return;
  await fetch(`/api/monitors/${id}`, { method: 'DELETE' });
  refresh();
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('mon-name').value;
  const url = document.getElementById('mon-url').value;
  const interval = parseInt(document.getElementById('mon-interval').value);

  await fetch('/api/monitors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, url, interval }),
  });

  form.reset();
  refresh();
});

refresh();
setInterval(refresh, 10000);
