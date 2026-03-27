// Email service — integrate nodemailer or SendGrid here
const sendEmail = async (to, subject, text) => {
  // TODO: replace with real email provider
  console.log(`[EMAIL] To: ${to} | Subject: ${subject}\n${text}`);
};

module.exports = { sendEmail };
