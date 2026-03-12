// WHY: This middleware identifies the tenant for every incoming request.
// It supports both real subdomains (lvh.me) and a header fallback for local Docker development.

const tenantMiddleware = (req, res, next) => {
    const host = req.hostname;
  const subdomain = host.split('.')[0];
  const baseDomain = process.env.BASE_DOMAIN || 'localhost';
  
  // WHY: We need to ignore the main domain and specific administrative subdomains (like 'mfrontend' or 'api').
  const isMainDomain = host === baseDomain || host.endsWith(`.${baseDomain}`);
  // WHY: We need to ignore administrative subdomains so they aren't treated as tenants.
  const reservedSubdomains = ['localhost', 'backend', 'mbackend', 'frontend', 'mfrontend', 'www', 'api'];

  let tenantSlug = (!reservedSubdomains.includes(subdomain) && host !== baseDomain && !host.includes('mbackend')) 
    ? subdomain 
    : req.headers['x-tenant-slug'];

    if (!tenantSlug && (req.path.includes('/signup') || req.path.includes('/login') || req.path === '/')) {
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
