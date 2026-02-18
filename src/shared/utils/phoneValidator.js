const validator = require('validator');

function validatePhoneNumber(phoneNumber) {
  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^[\+]?[1-9][\d]{9,14}$/;

  if (!phoneRegex.test(cleanPhone)) {
    return false;
  }

  return validator.isMobilePhone(cleanPhone, 'any');
}

module.exports = {
  validatePhoneNumber
};
