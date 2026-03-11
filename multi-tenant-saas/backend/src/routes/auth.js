const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, provisionTenant } = require('../services/tenantProvisioner');

// WHY: Registration creates a new tenant slug and a dedicated database schema.
router.post('/signup', async (req, res) => {
    const { companyName, email, password } = req.body;
    const slug = companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Create tenant entry
        const tenantRes = await client.query(
            'INSERT INTO public.tenants (name, slug) VALUES ($1, $2) RETURNING id',
            [companyName, slug]
        );
        const tenantId = tenantRes.rows[0].id;

        // 2. Create user entry (owner)
        const passwordHash = await bcrypt.hash(password, 10);
        await client.query(
            'INSERT INTO public.users (email, password_hash, tenant_id) VALUES ($1, $2, $3)',
            [email, passwordHash, tenantId]
        );

        // 3. Provision tenant schema
        await provisionTenant(client, slug);

        await client.query('COMMIT');
        res.status(201).json({ message: 'Tenant created successfully!', slug });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Signup failed: ' + err.message });
    } finally {
        client.release();
    }
});

// WHY: Login facilitates issuing a JWT that pins the user to their tenant schema.
router.post('/login', async (req, res) => {
    const { email, password, slug } = req.body;

    try {
        // 1. Find tenant
        const tenantRes = await pool.query('SELECT id FROM public.tenants WHERE slug = $1', [slug]);
        if (tenantRes.rows.length === 0) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        const tenantId = tenantRes.rows[0].id;

        // 2. Find user in that tenant
        const userRes = await pool.query(
            'SELECT * FROM public.users WHERE email = $1 AND tenant_id = $2',
            [email, tenantId]
        );

        const user = userRes.rows[0];
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 3. Issue JWT with tenantSlug (crucial for security)
        const token = jwt.sign(
            { userId: user.id, email: user.email, tenantSlug: slug },
            process.env.JWT_SECRET || 'supersecretkey',
            { expiresIn: '1d' }
        );

        res.json({ token, tenantSlug: slug });
    } catch (err) {
        res.status(500).json({ error: 'Login failed: ' + err.message });
    }
});

module.exports = router;
