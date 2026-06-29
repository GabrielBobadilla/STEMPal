if (process.env.USE_MOCK_DB === 'true' || process.env.VERCEL === '1') {
  let poolPromise;
  try {
    const { createMockDb } = require('./mockDb');
    poolPromise = createMockDb().catch(err => {
      console.error('Mock DB init error:', err);
      return null;
    });
  } catch (err) {
    console.error('Mock DB load error:', err);
    poolPromise = Promise.resolve(null);
  }
  module.exports = new Proxy({}, {
    get(_, prop) {
      if (prop === 'query') return async (...args) => {
        const p = await poolPromise;
        if (p) return p.query(...args);
        return [[], []];
      };
      if (prop === 'execute') return async (...args) => {
        const p = await poolPromise;
        if (p) return p.query(...args);
        return [[], []];
      };
      return undefined;
    }
  });
  return;
}

const mysql = require('mysql2/promise');
require('dotenv').config();

const sslConfig = process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {};

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'stempal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...sslConfig
});

if (process.env.NODE_ENV !== 'production') {
  pool.getConnection()
    .then(conn => {
      console.log('MySQL connected successfully');
      conn.release();
    })
    .catch(err => {
      console.error('MySQL connection error:', err.message);
    });
}

module.exports = pool;
