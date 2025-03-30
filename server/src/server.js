const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

// Connect to database
connectDB();

// Route files
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatbotRoutes = require('./routes/chatbots');
const consultationRoutes = require('./routes/consultations');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const webChatRoutes = require('./routes/webChat.routes');
const webhookRoutes = require('./routes/webhook.routes');
const aiRoutes = require('./routes/ai.routes');
// Temporarily disabled for testing Notion integration
// const speechRoutes = require('./routes/speech.routes');
const notionRoutes = require('./routes/notion.routes');

const app = express();

// Body parser
app.use(express.json());

// File upload middleware
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  abortOnLimit: true,
  useTempFiles: false
}));

// Enable CORS
app.use(cors());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set static folder
app.use(express.static(path.join(__dirname, '../../website')));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chatbots', chatbotRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', webChatRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/ai', aiRoutes);
// Temporarily disabled for testing Notion integration
// app.use('/api/speech', speechRoutes);
app.use('/api/notion', notionRoutes);

// Serve React front-end in production
app.get('/admin*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../admin/build', 'index.html'));
});

app.get('/dashboard*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../dashboard/build', 'index.html'));
});

// Handle 404
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) {
    return res.status(404).sendFile(path.resolve(__dirname, '../../website/404.html'));
  }
  
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = server;
