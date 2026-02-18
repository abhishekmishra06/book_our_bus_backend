const validator = require('validator');

/**
 * Validates phone number format
 * @param {string} phoneNumber - The phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validatePhoneNumber(phoneNumber) {
  // Remove any spaces, dashes, or parentheses
  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Check if it's a valid mobile number format (supports international formats)
  // This regex supports various international phone formats
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  
  if (!phoneRegex.test(cleanPhone)) {
    return false;
  }

  // Additional validation using validator library
  return validator.isMobilePhone(cleanPhone, ['any'], { strictMode: false });
}

module.exports = {
  validatePhoneNumber
};