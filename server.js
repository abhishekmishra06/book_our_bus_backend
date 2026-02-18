const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import shared configurations
const connectDB = require('./src/shared/db');
const { errorHandler } = require('./src/shared/middleware/errorHandler');

// Import routes
const authRoutes = require('./src/modules/auth/auth.routes');
const agentRoutes = require('./src/modules/auth/agent.routes');
const busRoutes = require('./src/modules/bus/bus.routes');
const bookingRoutes = require('./src/modules/booking/booking.routes');
const searchRoutes = require('./src/modules/search/search.routes');
const notificationRoutes = require('./src/modules/notification/notification.routes');
const tokenRoutes = require('./src/modules/token/token.routes');
const sessionRoutes = require('./src/modules/session/session.routes');
// Additional routes can be added here as needed

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/agent', agentRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/token', tokenRoutes);
app.use('/api/sessions', sessionRoutes);
// Additional routes can be added here as needed

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bus Booking Backend is running',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    data: null,
    error: {
      code: 'NOT_FOUND',
      details: `Cannot ${req.method} ${req.originalUrl}`
    }
  });
});

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Bus Booking Backend server running on port ${PORT}`);
});

module.exports = app;