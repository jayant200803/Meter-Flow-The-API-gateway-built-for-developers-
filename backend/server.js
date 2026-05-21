const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/apis');
const apiKeyRoutes = require('./routes/apiKeys');
const gatewayRoutes = require('./routes/gateway');
const usageRoutes = require('./routes/usage');
const billingRoutes = require('./routes/billing');
const analyticsRoutes = require('./routes/analytics');
const webhookRoutes = require('./routes/webhooks');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Make io accessible throughout app
app.set('io', io);

// Connect to databases
connectDB();
connectRedis();

// Security middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing - raw for Stripe webhooks
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/apis', apiRoutes);
app.use('/api/keys', apiKeyRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/webhooks', webhookRoutes);

// Gateway - The core feature (proxies requests through MeterFlow)
app.use('/gateway', gatewayRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join-dashboard', (userId) => {
    socket.join(`user-${userId}`);
    logger.info(`User ${userId} joined dashboard room`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`🚀 MeterFlow server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
});

// Start billing cron job
require('./services/billingCron');

module.exports = { app, io };
