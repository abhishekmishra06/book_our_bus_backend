require('dotenv').config();
const { generateOTP, hashOTP } = require('./otpGenerator');
const { validatePhoneNumber } = require('../phoneValidator');

const otpStorage = new Map();

async function sendOTP(phoneNumber) {
  try {
    if (!validatePhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    const otp = generateOTP(6);
    const hashedOTP = hashOTP(otp);

    const expiryTime = Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || '2') * 60 * 1000);
    otpStorage.set(phoneNumber, {
      otp: hashedOTP,
      expiry: expiryTime,
      attempts: 0,
      maxAttempts: parseInt(process.env.MAX_OTP_RETRIES || '3')
    });

    console.log(`OTP ${otp} generated for phone number: ${phoneNumber}`);

    return {
      success: true,
      message: 'OTP sent successfully',
      phoneNumber: phoneNumber,
      otpExpiry: new Date(expiryTime),
      testOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
    };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      message: error.message,
      phoneNumber: phoneNumber
    };
  }
}

async function verifyOTP(phoneNumber, otp) {
  try {
    const otpData = otpStorage.get(phoneNumber);

    if (!otpData) {
      return { success: false, message: 'No OTP found for this phone number' };
    }

    if (Date.now() > otpData.expiry) {
      otpStorage.delete(phoneNumber);
      return { success: false, message: 'OTP has expired' };
    }

    if (otpData.attempts >= otpData.maxAttempts) {
      return { success: false, message: 'Maximum OTP attempts exceeded. Please request a new OTP.' };
    }

    const isValid = verifyOTPInternal(otp, otpData.otp);

    if (isValid) {
      otpStorage.delete(phoneNumber);
      return { success: true, message: 'OTP verified successfully' };
    } else {
      otpData.attempts += 1;
      if (otpData.attempts >= otpData.maxAttempts) {
        otpStorage.delete(phoneNumber);
        return { success: false, message: 'Maximum OTP attempts exceeded. Please request a new OTP.' };
      } else {
        otpStorage.set(phoneNumber, otpData);
        return { success: false, message: `Invalid OTP. ${otpData.maxAttempts - otpData.attempts} attempts remaining.` };
      }
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, message: 'Error occurred during OTP verification' };
  }
}

function verifyOTPInternal(otp, hashedOTP) {
  const hashedInput = hashOTP(otp);
  return hashedInput === hashedOTP;
}

async function resendOTP(phoneNumber) {
  return await sendOTP(phoneNumber);
}

module.exports = {
  sendOTP,
  verifyOTP,
  resendOTP
};
