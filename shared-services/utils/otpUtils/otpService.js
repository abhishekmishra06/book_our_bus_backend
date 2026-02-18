require('dotenv').config();
const { generateOTP, hashOTP } = require('../utils/otpUtils/otpGenerator');
const { validatePhoneNumber } = require('../utils/phoneValidator');

// Mock database for storing OTPs (in production, this would be Redis)
const otpStorage = new Map();

/**
 * Sends OTP to the given phone number
 * @param {string} phoneNumber - The phone number to send OTP to
 * @returns {Promise<Object>} - Result of OTP sending operation
 */
async function sendOTP(phoneNumber) {
  try {
    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    // Generate OTP
    const otp = generateOTP(6);
    const hashedOTP = hashOTP(otp);

    // Store OTP with expiry (2 minutes as per PRD)
    const expiryTime = Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || '2') * 60 * 1000);
    otpStorage.set(phoneNumber, {
      otp: hashedOTP,
      expiry: expiryTime,
      attempts: 0,
      maxAttempts: parseInt(process.env.MAX_OTP_RETRIES || '3')
    });

    // In a real implementation, this would send the OTP via SMS service
    // For demo purposes, we'll log the OTP (never do this in production!)
    console.log(`OTP ${otp} generated for phone number: ${phoneNumber}`);
    
    // Return success response (in a real app, this would be sent via SMS)
    return {
      success: true,
      message: 'OTP sent successfully',
      phoneNumber: phoneNumber,
      otpExpiry: new Date(expiryTime),
      // Note: In real implementation, we wouldn't return the actual OTP
      // This is just for demonstration purposes in our dummy implementation
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

/**
 * Verifies the OTP for a given phone number
 * @param {string} phoneNumber - The phone number
 * @param {string} otp - The OTP to verify
 * @returns {Promise<Object>} - Verification result
 */
async function verifyOTP(phoneNumber, otp) {
  try {
    const otpData = otpStorage.get(phoneNumber);

    if (!otpData) {
      return {
        success: false,
        message: 'No OTP found for this phone number'
      };
    }

    // Check if OTP has expired
    if (Date.now() > otpData.expiry) {
      otpStorage.delete(phoneNumber); // Clean up expired OTP
      return {
        success: false,
        message: 'OTP has expired'
      };
    }

    // Check max attempts
    if (otpData.attempts >= otpData.maxAttempts) {
      return {
        success: false,
        message: 'Maximum OTP attempts exceeded. Please request a new OTP.'
      };
    }

    // Verify OTP
    const isValid = verifyOTPInternal(otp, otpData.otp);
    
    if (isValid) {
      // OTP verified, remove from storage
      otpStorage.delete(phoneNumber);
      return {
        success: true,
        message: 'OTP verified successfully'
      };
    } else {
      // Increment attempt counter
      otpData.attempts += 1;
      
      if (otpData.attempts >= otpData.maxAttempts) {
        otpStorage.delete(phoneNumber); // Remove after max attempts
        return {
          success: false,
          message: 'Maximum OTP attempts exceeded. Please request a new OTP.'
        };
      } else {
        otpStorage.set(phoneNumber, otpData); // Update attempt count
        return {
          success: false,
          message: `Invalid OTP. ${otpData.maxAttempts - otpData.attempts} attempts remaining.`
        };
      }
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: 'Error occurred during OTP verification'
    };
  }
}

/**
 * Internal function to verify OTP
 * @param {string} otp - The OTP entered by user
 * @param {string} hashedOTP - The stored hashed OTP
 * @returns {boolean} - True if match, false otherwise
 */
function verifyOTPInternal(otp, hashedOTP) {
  const hashedInput = hashOTP(otp);
  return hashedInput === hashedOTP;
}

/**
 * Resends OTP to the given phone number if the previous one has expired
 * @param {string} phoneNumber - The phone number to resend OTP to
 * @returns {Promise<Object>} - Result of OTP resending operation
 */
async function resendOTP(phoneNumber) {
  // Simply call sendOTP again, which will overwrite the previous OTP
  return await sendOTP(phoneNumber);
}

module.exports = {
  sendOTP,
  verifyOTP,
  resendOTP
};