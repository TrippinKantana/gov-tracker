/**
 * Database Connection Handler
 * Connects to Neon Serverless PostgreSQL
 */

const { Pool } = require('pg');
require('dotenv').config();

let pool = null;

const initDatabase = () => {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not set. Using mock data mode.');
    return null;
  }

  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
      max: 10, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
    });

    // Test the connection
    pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.error('❌ Database connection failed:', err.message);
        pool = null;
      } else {
        console.log('✅ Database connected successfully');
      }
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('❌ Unexpected error on idle client', err);
    });

    return pool;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    return null;
  }
};

const getDatabase = () => {
  if (!pool) {
    pool = initDatabase();
  }
  return pool;
};

const query = async (text, params) => {
  const db = getDatabase();
  if (!db) {
    throw new Error('Database not connected. Please set DATABASE_URL environment variable.');
  }
  const start = Date.now();
  try {
    const res = await db.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executed in', duration, 'ms:', text.substring(0, 50));
    return res;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
};

module.exports = {
  getDatabase,
  query,
  initDatabase
};

