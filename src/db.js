import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

pool
  .connect()
  .then((client) => {
    console.log('Connected to database');
    client.release();
  })
  .catch((err) => {
    console.error('Database connection error', err.message);
  });

export default pool;
