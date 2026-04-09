const axios = require('axios');

const BASE = 'https://api.paymongo.com/v1';

const getHeaders = () => ({
  'Authorization': `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
  'Content-Type': 'application/json',
});

/**
 * Create a PayMongo payment link
 * @param {number} amount - in PHP (e.g. 1499)
 * @param {string} description
 * @param {object} meta - { client_id, subscription_id }
 * @returns {{ checkout_url, payment_link_id, status }}
 */
const createPaymentLink = async (amount, description, meta = {}) => {
  const res = await axios.post(`${BASE}/links`, {
    data: {
      attributes: {
        amount: Math.round(amount * 100), // centavos
        description,
        remarks: JSON.stringify(meta),
      },
    },
  }, { headers: getHeaders() });

  const link = res.data.data;
  return {
    payment_link_id: link.id,
    checkout_url: link.attributes.checkout_url,
    status: link.attributes.status,
  };
};

/**
 * Retrieve a payment link status by ID
 */
const getPaymentLink = async (linkId) => {
  const res = await axios.get(`${BASE}/links/${linkId}`, { headers: getHeaders() });
  return res.data.data;
};

module.exports = { createPaymentLink, getPaymentLink };
