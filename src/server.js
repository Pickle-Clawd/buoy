const express = require('express');
const path = require('path');
const config = require('../config');
const routes = require('./routes');
const { startAllMonitors, stopAllMonitors } = require('./monitor');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(routes);

const server = app.listen(config.port, () => {
  console.log(`Buoy is running on http://localhost:${config.port}`);
  startAllMonitors();
});

process.on('SIGINT', () => {
  stopAllMonitors();
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopAllMonitors();
  server.close();
  process.exit(0);
});
