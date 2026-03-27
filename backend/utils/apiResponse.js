/**
 * Formats a standard API response.
 * @param {boolean} success
 * @param {string} message
 * @param {*} data
 */
const apiResponse = (success, message, data = null) => ({
  success,
  message,
  ...(data !== null && { data }),
});

module.exports = { apiResponse };
