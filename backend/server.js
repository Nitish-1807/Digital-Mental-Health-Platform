import express from 'express';
import { createServer } from 'node:http';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/security.js';
import authRoutes from './routes/auth.js';
import collegeRoutes from './routes/colleges.js';
import resourceRoutes from './routes/resources.js';
import postRoutes from './routes/posts.js';
import chatRoutes from './routes/chat.js';
import connectRoutes from './routes/connect.js';
import adminRoutes from './routes/admin.js';
import assessmentRoutes from './routes/assessments.js';
import videoRoutes from './routes/video.js';
import notificationRoutes from './routes/notification.js';
import communityGroupRoutes from './routes/communityGroups.js';
import { connectToSocket } from './services/socketManager.js';

dotenv.config();

const app = express();

// Safe startup config logs (do not print secrets)
const isRealKey = (v) => {
  if (!v) return false;
  const s = String(v).trim();
  if (!s) return false;
  const lowered = s.toLowerCase();
  return !(
    lowered.includes('your-openai-api-key') ||
    lowered.includes('your-super-secret') ||
    lowered.includes('change-in-production') ||
    lowered === 'changeme' ||
    lowered === 'replace_me'
  );
};


// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Logging middleware
app.use(morgan('combined'));

// CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all API routes
app.use('/api', apiRateLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/connect', connectRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/community-groups', communityGroupRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mental-health-platform')
  .then(() => {
    console.log(`✅ MongoDB connected to ${process.env.MONGODB_URI || 'mongodb://localhost:27017/mental-health-platform'}`);
    const PORT = process.env.PORT || 5000;
    const server = createServer(app);
    connectToSocket(server);
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

export default app;
