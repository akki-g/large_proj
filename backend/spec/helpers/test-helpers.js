// spec/helpers/test-helpers.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../../models/Users');
const { v4: uuidv4 } = require('uuid');

// Create a test user and return user data
const createTestUser = async () => {
  const userId = uuidv4();
  const user = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: await bcrypt.hash('Password123!', 10),
    phone: '1234567890',
    userID: userId,
    isVerified: true
  };

  await User.create(user);
  return user;
};

// Generate a JWT token for test user
const generateAuthToken = (userId, email) => {
  const payload = {
    user: {
      id: userId,
      email: email
    }
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'test_jwt_secret_for_testing',
    { expiresIn: '1h' }
  );
};

module.exports = {
  createTestUser,
  generateAuthToken
};