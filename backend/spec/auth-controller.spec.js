// spec/auth-controller.spec.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/Users');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

describe('Auth Controller Tests', () => {
  // Setup before all tests
  beforeAll(async () => {
    try {
      // Connect to test database
      await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/syllab_test');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  });

  // Clean up after all tests
  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Clear the database after each test
  afterEach(async () => {
    await User.deleteMany({});
  });

  // Mock nodemailer to avoid sending actual emails
  beforeEach(() => {
    spyOn(nodemailer, 'createTransport').and.returnValue({
      sendMail: (mailOptions, callback) => {
        callback(null, { response: 'Email sent' });
      }
    });
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
      
      // Check if user was created in database
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).not.toBeNull();
      expect(user.firstName).toBe('Test');
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
      const passwordHash = await bcrypt.hash('Password123!', 10);
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