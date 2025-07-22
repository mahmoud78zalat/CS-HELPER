import { Pool } from 'pg';
import fs from 'fs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  try {
    const sql = fs.readFileSync('schema.sql', 'utf8');
    console.log('Executing schema...');
    await pool.query(sql);
    console.log('Database schema created successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await pool.end();
  }
}

setupDatabase();