const crypto = require('crypto');

function generateOTP(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

function hashOTP(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function verifyOTP(otp, hashedOTP) {
  const hashedInput = hashOTP(otp);
  return hashedInput === hashedOTP;
}

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP
};
