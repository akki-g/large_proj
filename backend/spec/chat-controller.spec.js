// spec/chat-controller.spec.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Chat = require('../models/Chat');
const User = require('../models/Users');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

describe('Chat Controller Tests', () => {
  let testUser;
  let authToken;
  let testChatId;
  
  // Mock axios responses
  beforeEach(() => {
    spyOn(axios, 'post').and.returnValue(Promise.resolve({
      data: {
        choices: [{
          message: {
            content: 'This is a mocked AI response for testing.'
          }
        }]
      }
    }));
  });
  
  // Setup before all tests
  beforeAll(async () => {
    try {
      // Connect to test database
      await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/syllab_test');
      
      // Clear collections
      await Chat.deleteMany({});
      await User.deleteMany({});
      
      // Create test user
      const userId = uuidv4();
      const passwordHash = await bcrypt.hash('Password123!', 10);
      
      testUser = {
        firstName: 'Chat',
        lastName: 'Test',
        email: 'chat@example.com',
        password: passwordHash,
        phone: '1234567890',
        userID: userId,
        isVerified: true
      };
      
      await User.create(testUser);
      
      // Generate token for test user
      const payload = { user: { id: userId, email: 'chat@example.com' } };
      authToken = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'test_jwt_secret_for_testing',
        { expiresIn: '1h' }
      );
    } catch (error) {
      console.error('Setup error:', error);
      throw error;
    }
  });

  // Clean up after all tests
  afterAll(async () => {
    await mongoose.connection.close();
  });
  
  // Reset data before each test
  beforeEach(async () => {
    await Chat.deleteMany({});
  });

  describe('POST /api/chat/send', () => {
    it('should create a new chat with a message', async () => {
      const response = await request(app)
        .post('/api/chat/send')
        .send({
          message: 'Hello, this is a test message',
          jwtToken: authToken
        });

      expect(response.status).toBe(200);
      expect(response.body.chat).toBeDefined();
      expect(response.body.chat.messages.length).toBe(2); // User message + AI response
      expect(response.body.chat.messages[0].content).toBe('Hello, this is a test message');
      expect(response.body.chat.messages[0].sender).toBe('user');
      expect(response.body.jwtToken).toBeDefined();
      
      // Save chat ID for later tests
      testChatId = response.body.chat._id;
    });
    
    it('should continue an existing chat', async () => {
      // First create a chat if we don't already have one
      if (!testChatId) {
        const createResponse = await request(app)
          .post('/api/chat/send')
          .send({
            message: 'Initial message',
            jwtToken: authToken
          });
        testChatId = createResponse.body.chat._id;
      }
      
      const response = await request(app)
        .post('/api/chat/send')
        .send({
          message: 'This is a follow-up message',
          chatId: testChatId,
          jwtToken: authToken
        });

      expect(response.status).toBe(200);
      expect(response.body.chat).toBeDefined();
      expect(response.body.chat.messages.length).toBe(4); // Previous messages + new message + AI response
    });
    
    it('should return an error when no message is provided', async () => {
      const response = await request(app)
        .post('/api/chat/send')
        .send({
          jwtToken: authToken
          // No message
        });

      expect(response.status).toBe(400);
      expect(response.body.msg).toContain('required');
    });
  });

  describe('GET /api/chat/list', () => {
    beforeEach(async () => {
      // Create a test chat if no chats exist
      const chat = await Chat.findOne({ userID: testUser.userID });
      if (!chat) {
        await request(app)
          .post('/api/chat/send')
          .send({
            message: 'Test message for chat list',
            jwtToken: authToken
          });
      }
    });
    
    it('should return list of chats for the user', async () => {
      const response = await request(app)
        .get('/api/chat/list')
        .query({ jwtToken: authToken });

      expect(response.status).toBe(200);
      expect(response.body.chats).toBeDefined();
      expect(Array.isArray(response.body.chats)).toBe(true);
      expect(response.body.chats.length).toBeGreaterThan(0);
    });
  });
});