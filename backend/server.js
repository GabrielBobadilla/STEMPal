const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Firebase Admin SDK initialized on first require of config/firebase.js
require('./config/firebase');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const preferenceRoutes = require('./routes/preferences');
const noteRoutes = require('./routes/notes');
const reviewerRoutes = require('./routes/reviewers');
const pdfRoutes = require('./routes/pdf');
const quizRoutes = require('./routes/quizzes');
const flashcardRoutes = require('./routes/flashcards');
const studyRoutes = require('./routes/study');
const breakRoutes = require('./routes/breaks');
const streakRoutes = require('./routes/streaks');
const achievementRoutes = require('./routes/achievements');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const searchRoutes = require('./routes/search');
const gamificationRoutes = require('./routes/gamification');
const crosswordRoutes = require('./routes/crosswords');
const multiplayerRoutes = require('./routes/multiplayer');
const pomodoroRoutes = require('./routes/pomodoro');

const app = express();
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || true, credentials: true },
});
const setupSocketHandlers = require('./socket/handlers');
setupSocketHandlers(io);

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`STEMPal Server running on port ${PORT}`);
  });
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/reviewers', reviewerRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/breaks', breakRoutes);
app.use('/api/streaks', streakRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/crosswords', crosswordRoutes);
app.use('/api/multiplayer', multiplayerRoutes);
app.use('/api/pomodoro', pomodoroRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

module.exports = app;
