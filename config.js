module.exports = {
  port: process.env.PORT || 3000,
  dbPath: process.env.DB_PATH || './data/buoy.db',
  adminPassword: process.env.ADMIN_PASSWORD || 'buoy-admin-2026',
  jwtSecret: process.env.JWT_SECRET || 'buoy-jwt-secret-' + require('crypto').randomBytes(8).toString('hex'),
  defaultInterval: 60,
  minInterval: 30,
  maxInterval: 300,
  historyRetentionDays: 30,
  maxResponseTimeMs: 30000,
};
