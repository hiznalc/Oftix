const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const morgan = require('morgan');

dotenv.config();

const logger = require('./utils/logger');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const branchRoutes = require('./routes/branchRoutes');
const clientRoutes = require('./routes/clientRoutes');
const { handleErrors } = require('./middleware/errorHandler');

if (!process.env.JWT_SECRET) {
  logger.error('FATAL: JWT_SECRET is not set. Refusing to start.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "cdn.jsdelivr.net"],
    },
  },
}));
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));
app.use(cookieParser());

const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5500';
app.use(cors({ origin: frontendOrigin, credentials: true }));

app.use(morgan('combined', {
  skip: () => process.env.NODE_ENV === 'test',
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// Serve static assets (CSS, JS, images)
app.use('/assets', express.static(path.join(__dirname, '..', 'frontend', 'assets')));


// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/branch', branchRoutes);
app.use('/api/client', clientRoutes);

app.get('/api/health', (req, res) => res.json({ success: true, message: 'API is healthy.' }));

// Serve HTML pages (must be after API routes to avoid conflicts)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'index.html')));
app.get('/register.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'register.html')));
app.get('/admin-dashboard.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'admin-dashboard.html')));
app.get('/branch-dashboard.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'branch-dashboard.html')));
app.get('/client-dashboard.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'client-dashboard.html')));

// Fallback for any other requests to index.html (SPA-like routing)
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'index.html')));

app.use(handleErrors);

app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
