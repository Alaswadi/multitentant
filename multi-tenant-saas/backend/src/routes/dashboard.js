const express = require('express');
const router = express.Router();
const { pool } = require('../services/tenantProvisioner');
const authMiddleware = require('../middleware/auth');

// WHY: All routes here are protected and execute in the context of the tenant's schema.
router.use(authMiddleware);

// WHY: Fetching dashboard data requires setting the search_path to the tenant's schema.
router.get('/', async (req, res) => {
    const client = await pool.connect();
    try {
        // WHY: Setting search_path ensures subsequent queries hit the correct tenant's tables.
        await client.query(`SET search_path TO ${req.schemaName}, public`);

        const projects = await client.query('SELECT * FROM projects');
        const tenantInfo = await client.query('SELECT name FROM public.tenants WHERE slug = $1', [req.tenantSlug]);

        res.json({
            tenant: tenantInfo.rows[0],
            user: req.user,
            projects: projects.rows
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to load dashboard: ' + err.message });
    } finally {
        client.release();
    }
});

router.post('/projects', async (req, res) => {
    const { name, description } = req.body;
    const client = await pool.connect();
    try {
        await client.query(`SET search_path TO ${req.schemaName}`);
        const result = await client.query(
            'INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create project: ' + err.message });
    } finally {
        client.release();
    }
});

module.exports = router;
