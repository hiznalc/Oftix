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
const { createLimiter } = require('./middleware/rateLimiter');
const { handleErrors } = require('./middleware/errorHandler');

if (!process.env.JWT_SECRET) {
  logger.error('FATAL: JWT_SECRET is not set. Refusing to start.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));
app.use(cookieParser());

const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5500';
app.use(cors({ origin: frontendOrigin, credentials: true }));

app.use(morgan('combined', {
  skip: () => process.env.NODE_ENV === 'test',
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// Global rate limiter
app.use(createLimiter({ windowMs: 15 * 60 * 1000, max: 150 }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/branch', branchRoutes);
app.use('/api/client', clientRoutes);

app.get('/api/health', (req, res) => res.json({ success: true, message: 'API is healthy.' }));

app.use(handleErrors);

app.use(express.static(path.join(__dirname, '..', 'frontend', 'assets')));
app.use('/', express.static(path.join(__dirname, '..', 'frontend', 'pages')));

app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
