const { Pool } = require('pg');

// WHY: Using a single pool for the public schema. 
// For tenant-specific queries, we will use the same pool but set the search_path.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Provisions a new tenant by creating a dedicated schema and its required tables.
 * This implements the "Schema-per-Tenant" isolation pattern.
 */
async function provisionTenant(client, slug) {
  const schemaName = `tenant_${slug.replace(/-/g, '_')}`;
  
  // WHY: Creating a schema provides logical isolation within the same database.
  // It's a balance between pure row-level isolation (shared tables) and database isolation (separate DBs).
  await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
  
  // WHY: Each tenant has their own projects table. No data leak possible at the SQL layer
  // if the search_path is correctly set to this schema.
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${schemaName}.projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  return schemaName;
}

/**
 * Initializes the public registry tables if they do not exist.
 * This is useful for environments like Coolify where init.sql might not run.
 */
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('Verifying database initialization...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug VARCHAR(63) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        password_hash TEXT NOT NULL,
        tenant_id UUID REFERENCES public.tenants(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(email, tenant_id)
      );
    `);
    console.log('Database initialization complete.');
  } catch (err) {
    console.error('Database initialization failed:', err);
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  provisionTenant,
  initializeDatabase
};
