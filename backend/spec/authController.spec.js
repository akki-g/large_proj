const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Your Express app
const User = require('../models/Users');

describe('Auth Controller', () => {
  // Setup before tests
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/syllab_test');
    // Clear users collection before tests
    await User.deleteMany({});
  });

  // Cleanup after tests
  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          password: 'Password123!',
          phone: '1234567890'
        });

      expect(response.status).toBe(200);
      expect(response.body.msg).toContain('User registered successfully');
      expect(response.body.user).toBeDefined();
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          // Missing email and password
        });

      expect(response.status).toBe(400);
      expect(response.body.msg).toContain('All fields are required');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Create a test user for login tests
      const saltRounds = 10;
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('Password123!', saltRounds);
      
      await User.create({
        firstName: 'Login',
        lastName: 'Test',
        email: 'login@example.com',
        password: passwordHash,
        phone: '1234567890',
        userID: 'test-user-id',
        isVerified: true
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.message).toContain('Login Successful');
    });

    it('should return 400 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.msg).toContain('Invalid credentials');
    });
  });
});