// ================================================================
// TURFBOOK — EXPRESS BACKEND SERVER ENTRYPOINT
// ================================================================

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const turfRoutes = require('./routes/turfs');
const bookingRoutes = require('./routes/bookings');
const favoriteRoutes = require('./routes/favorites');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend files from 'public' directory
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/turfs', turfRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        service: 'TurfBook API',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Serve frontend SPA/pages
app.get('/admin', (req, res) => {
    res.sendFile(path.join(publicDir, 'admin.html'));
});

// Fallback for API 404
app.use('/api/*', (req, res) => {
    res.status(404).json({ success: false, message: 'API route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error occurred',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server when run directly (local npm start or node server/server.js)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`
╔═════════════════════════════════════════════════════════════════╗
║                   ⚽ TURFBOOK SERVER STARTED 🏟️                 ║
╠═════════════════════════════════════════════════════════════════╣
║  🌐 Web Application:   http://localhost:${PORT}                   ║
║  👑 Admin Dashboard:   http://localhost:${PORT}/admin-login.html    ║
║  🤖 AI Assistant:      Active & Ready                           ║
║  🔑 Demo Admin:        admin@turfbook.com  |  admin123          ║
║  👤 Demo User:         user@turfbook.com   |  user123           ║
╚═════════════════════════════════════════════════════════════════╝
        `);
    });
}

// Export app for Vercel Serverless Functions
module.exports = app;
