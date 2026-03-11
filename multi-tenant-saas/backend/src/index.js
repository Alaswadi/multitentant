require('dotenv').config();
const express = require('express');
const cors = require('cors');
const tenantMiddleware = require('./middleware/tenant');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:5173', 'https://mfrontend.phishsimulator.com', /\.phishsimulator\.com$/],
  credentials: true
}));
app.use(express.json());

// WHY: Global tenant middleware handles subdomain/header detection early.
app.use(tenantMiddleware);

app.get('/', (req, res) => {
    res.json({ message: 'Multi-tenant API is running', tenant: req.tenantSlug || 'None' });
});

app.use('/api', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
