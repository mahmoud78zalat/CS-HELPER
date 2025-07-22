import { Pool } from 'pg';

// Different connection formats to try
const connectionStrings = [
  // Original format you provided
  'postgresql://postgres:0103784716zZ%40@db.acejnylzjlfnchiajiyv.supabase.co:5432/postgres',
  
  // Pooler format 
  'postgresql://postgres.acejnylzjlfnchiajiyv:0103784716zZ%40@aws-0-us-west-1.pooler.supabase.com:6543/postgres',
  
  // Alternative pooler format
  'postgresql://postgres.acejnylzjlfnchiajiyv:0103784716zZ%40@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
  
  // Direct format without password encoding
  'postgresql://postgres:0103784716zZ@db.acejnylzjlfnchiajiyv.supabase.co:5432/postgres'
];

async function testConnections() {
  for (let i = 0; i < connectionStrings.length; i++) {
    console.log(`\n--- Testing connection format ${i + 1} ---`);
    console.log(`URL: ${connectionStrings[i].replace(/:[^:]+@/, ':***@')}`);
    
    const pool = new Pool({
      connectionString: connectionStrings[i],
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 5000
    });
    
    try {
      const client = await pool.connect();
      console.log('✅ Connection successful!');
      
      const result = await client.query('SELECT version()');
      console.log('✅ Database version:', result.rows[0].version.substring(0, 50) + '...');
      
      client.release();
      await pool.end();
      
      console.log('✅ SUCCESS! This connection string works.');
      process.exit(0);
      
    } catch (error) {
      console.log('❌ Connection failed:', error.message);
      await pool.end().catch(() => {});
    }
  }
  
  console.log('\n❌ All connection attempts failed. Please check your Supabase credentials.');
}

testConnections();