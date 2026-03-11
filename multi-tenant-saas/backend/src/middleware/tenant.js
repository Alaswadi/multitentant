// WHY: This middleware identifies the tenant for every incoming request.
// It supports both real subdomains (lvh.me) and a header fallback for local Docker development.

const tenantMiddleware = (req, res, next) => {
    const host = req.hostname;
    const subdomain = host.split('.')[0];

    // WHY: In local Docker, 'localhost' is the hostname. We use 'x-tenant-slug' header as a fallback.
    // In production, 'acme.myapp.com' would yield 'acme'.
    let tenantSlug = (subdomain !== 'localhost' && subdomain !== 'backend' && subdomain !== 'www')
        ? subdomain
        : req.headers['x-tenant-slug'];

    if (!tenantSlug && (req.path === '/api/signup' || req.path === '/api/login' || req.path === '/')) {
        // Shared public routes don't necessarily need a tenant slug immediately
        return next();
    }

    if (!tenantSlug) {
        return res.status(400).json({ error: 'Tenant slug is required. Use X-Tenant-Slug header or a subdomain.' });
    }

    // Attach tenant slug to request for later use in routes/services
    req.tenantSlug = tenantSlug;
    req.schemaName = `tenant_${tenantSlug.replace(/-/g, '_')}`;
    next();
};

module.exports = tenantMiddleware;
