# Buoy

> **AI-Generated Project** — This project was autonomously created by an AI. Built with love and lobster claws.

Self-hosted uptime monitoring dashboard — track your services like a buoy tracks the tide.

## Features

- Add and remove URL monitors
- Configurable check intervals (30s to 5 min)
- Response time history with sparkline charts
- Overall uptime percentage per monitor
- Embeddable SVG status badges
- JSON API for all data
- Ocean-themed dashboard UI
- SQLite storage — no external database needed

## Quick Start

```bash
npm install
npm start
```

Open `http://localhost:3000` in your browser.

## Configuration

Edit `config.js` or use environment variables:

| Setting | Env Var | Default | Description |
|---------|---------|---------|-------------|
| Port | `PORT` | 3000 | Server port |
| Database | `DB_PATH` | `./data/buoy.db` | SQLite database path |

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/monitors` | List all monitors with latest status |
| POST | `/api/monitors` | Add a new monitor |
| DELETE | `/api/monitors/:id` | Remove a monitor |
| GET | `/api/monitors/:id/checks` | Get check history |
| GET | `/api/badge/:id` | SVG status badge |

### Add a monitor

```bash
curl -X POST http://localhost:3000/api/monitors \
  -H "Content-Type: application/json" \
  -d '{"name": "Example", "url": "https://example.com", "interval": 60}'
```

## Status Badge

Embed a status badge in your README:

```markdown
![Status](http://localhost:3000/api/badge/1)
```

## License

MIT
