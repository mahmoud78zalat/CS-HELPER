import { Pool } from 'pg';

// Using the connection string you provided, with proper encoding
const DATABASE_URL = 'postgresql://postgres:0103784716zZ%40@db.acejnylzjlfnchiajiyv.supabase.co:5432/postgres';

console.log('Setting up Supabase database connection...');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testAndSetupDatabase() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Supabase database successfully!');
    
    // Test a simple query
    const result = await client.query('SELECT version()');
    console.log('✅ Database version:', result.rows[0].version);
    
    client.release();
    await pool.end();
    console.log('✅ Database connection test completed successfully');
    
    // Update the environment variable
    process.env.DATABASE_URL = DATABASE_URL;
    console.log('✅ DATABASE_URL updated in environment');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testAndSetupDatabase();