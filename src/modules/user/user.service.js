const User = require('../auth/auth.model');

/**
 * Creates or updates a user based on phone number
 * @param {string} phone - User's phone number
 * @param {string} name - User's name
 * @param {string} email - User's email (optional)
 * @returns {Object} Object containing user and isNew flag
 */
const createOrUpdateUser = async (phone, name, email = null) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ phone });

    if (user) {
      // User exists, return existing user
      return {
        user: user,
        isNew: false
      };
    } else {
      // User doesn't exist, create new user
      const newUser = new User({
        phone,
        name,
        email: email || null
      });

      user = await newUser.save();

      return {
        user: user,
        isNew: true
      };
    }
  } catch (error) {
    throw new Error(`Error creating or updating user: ${error.message}`);
  }
};

/**
 * Gets a user by phone number
 * @param {string} phone - User's phone number
 * @returns {Object} User object or null if not found
 */
const getUserByPhone = async (phone) => {
  try {
    const user = await User.findOne({ phone });
    return user;
  } catch (error) {
    throw new Error(`Error fetching user: ${error.message}`);
  }
};

/**
 * Updates user profile
 * @param {string} phone - User's phone number
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated user object
 */
const updateUserProfile = async (phone, updateData) => {
  try {
    const user = await User.findOneAndUpdate(
      { phone },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return user;
  } catch (error) {
    throw new Error(`Error updating user profile: ${error.message}`);
  }
};

module.exports = {
  createOrUpdateUser,
  getUserByPhone,
  updateUserProfile
};