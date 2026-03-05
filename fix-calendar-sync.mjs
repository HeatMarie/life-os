import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ 
  connectionString: "postgresql://postgres.duicdtikgbxxebtaitvt:ywqBFtX6F9OQolUK@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true",
  ssl: false 
});

async function fix() {
  // Get the active sync from the demo user (has the valid tokens)
  const demoSync = await pool.query(
    'SELECT "accessToken", "refreshToken", "tokenExpiresAt" FROM calendar_syncs WHERE id = $1',
    ['cmldylklt0001s9x9b5uuims2']
  );
  
  if (demoSync.rows.length === 0) {
    console.error('No demo sync found');
    pool.end();
    return;
  }
  
  const tokens = demoSync.rows[0];
  console.log('Token expires:', tokens.tokenExpiresAt);
  
  // Update the real user's sync with the valid tokens and reactivate it
  const result = await pool.query(
    'UPDATE calendar_syncs SET "accessToken" = $1, "refreshToken" = $2, "tokenExpiresAt" = $3, "isActive" = true WHERE id = $4 RETURNING id, "isActive"',
    [tokens.accessToken, tokens.refreshToken, tokens.tokenExpiresAt, 'cmlm9pcvy0000ajx9ucvojt6i']
  );
  console.log('Updated real user sync:', JSON.stringify(result.rows));
  
  // Deactivate the demo user's sync
  await pool.query(
    'UPDATE calendar_syncs SET "isActive" = false WHERE id = $1',
    ['cmldylklt0001s9x9b5uuims2']
  );
  console.log('Deactivated demo user sync');
  
  // Verify
  const verify = await pool.query('SELECT id, "userId", "isActive", "tokenExpiresAt" FROM calendar_syncs');
  console.log('Final state:', JSON.stringify(verify.rows, null, 2));
  
  pool.end();
}

fix().catch(e => { console.error(e); pool.end(); });
