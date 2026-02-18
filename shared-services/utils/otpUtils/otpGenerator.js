const crypto = require('crypto');

/**
 * Generates a random OTP code
 * @param {number} length - Length of the OTP (default: 6)
 * @returns {string} - Generated OTP
 */
function generateOTP(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

/**
 * Generates a hash of the OTP for secure storage
 * @param {string} otp - The OTP to hash
 * @returns {string} - Hashed OTP
 */
function hashOTP(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Verifies if the provided OTP matches the stored hash
 * @param {string} otp - The OTP entered by user
 * @param {string} hashedOTP - The stored hashed OTP
 * @returns {boolean} - True if match, false otherwise
 */
function verifyOTP(otp, hashedOTP) {
  const hashedInput = hashOTP(otp);
  return hashedInput === hashedOTP;
}

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP
};