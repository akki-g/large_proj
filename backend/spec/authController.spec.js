// spec/authController.spec.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/Users');
const bcrypt = require('bcryptjs');

describe('Auth Controller', () => {
  // Setup before tests
  beforeAll(async () => {
    try {
      // Connect to local test database
      await mongoose.connect(process.env.TEST_MONGODB_URI);
      console.log('Connected to test database');
      
      // Clear users collection before tests
      await User.deleteMany({});
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  });

  // Cleanup after tests
  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Clear the database after each test
  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock the email sending functionality
      const originalSendMail = require('nodemailer').createTransport().sendMail;
      require('nodemailer').createTransport = jest.fn().mockReturnValue({
        sendMail: jest.fn().mockImplementation((mailOptions, callback) => {
          callback(null, { response: 'Email sent' });
        })
      });
      
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
      
      // Restore original function
      require('nodemailer').createTransport = jest.fn().mockReturnValue({
        sendMail: originalSendMail
      });
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
    beforeEach(async () => {
      // Create a test user for login tests
      const saltRounds = 10;
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