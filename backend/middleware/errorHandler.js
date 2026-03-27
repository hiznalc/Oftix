const logger = require('../utils/logger');

const handleErrors = (err, req, res, next) => {
  logger.error({ message: err.message, stack: err.stack, path: req.path, method: req.method });
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
};

module.exports = { handleErrors };
