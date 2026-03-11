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

module.exports = {
  pool,
  provisionTenant
};
