module.exports = {
  port: process.env.PORT || 3000,
  dbPath: process.env.DB_PATH || './data/buoy.db',
  defaultInterval: 60,
  minInterval: 30,
  maxInterval: 300,
  historyRetentionDays: 30,
  maxResponseTimeMs: 30000,
};
