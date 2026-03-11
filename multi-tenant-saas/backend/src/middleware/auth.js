const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');

        // WHY: We verify that the user's token belongs to the tenant they are trying to access.
        // This prevents a user from one tenant using their valid token to access another tenant's schema.
        if (decoded.tenantSlug !== req.tenantSlug) {
            return res.status(403).json({ error: 'Forbidden: Token does not match tenant context' });
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

module.exports = authMiddleware;
