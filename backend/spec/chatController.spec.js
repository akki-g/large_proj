// spec/chatController.spec.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Chat = require('../models/Chat');
const User = require('../models/Users');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Mock axios for AI responses
jest.mock('axios');

describe('Chat Controller', () => {
  let authToken;
  const testUserId = 'test-chat-user-id';
  let testChatId;
  
  // Setup before tests
  beforeAll(async () => {
    try {
      // Connect to local test database
      await mongoose.connect(process.env.TEST_MONGODB_URI);
      
      // Clear collections
      await Chat.deleteMany({});
      await User.deleteMany({});
      
      // Create test user
      await User.create({
        firstName: 'Chat',
        lastName: 'Test',
        email: 'chat@example.com',
        password: 'hashedpassword',
        phone: '1234567890',
        userID: testUserId,
        isVerified: true
      });
      
      // Generate token for test user
      const payload = { user: { id: testUserId, email: 'chat@example.com' } };
      authToken = jwt.sign(payload, process.env.JWT_SECRET || 'test_secret_key_for_testing', { expiresIn: '1h' });
      
      // Mock axios response for AI processing
      axios.post.mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: 'This is a mocked AI response for testing.'
            }
          }]
        }
      });
    } catch (error) {
      console.error('Setup error:', error);
      throw error;
    }
  });

  // Cleanup after tests
  afterAll(async () => {
    await mongoose.connection.close();
  });
  
  afterEach(async () => {
    axios.post.mockClear();
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
  });

  describe('GET /api/chat/list', () => {
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
  
  describe('GET /api/chat/detail', () => {
    it('should get a specific chat by ID', async () => {
      const response = await request(app)
        .get('/api/chat/detail')
        .query({ 
          chatId: testChatId,
          jwtToken: authToken 
        });

      expect(response.status).toBe(200);
      expect(response.body.chat).toBeDefined();
      expect(response.body.chat._id).toBe(testChatId);
    });
    
    it('should return 404 for non-existent chat', async () => {
      const response = await request(app)
        .get('/api/chat/detail')
        .query({ 
          chatId: '507f1f77bcf86cd799439011', // Non-existent ID in ObjectId format
          jwtToken: authToken 
        });

      expect(response.status).toBe(404);
    });
  });
  
  describe('POST /api/chat/delete', () => {
    it('should delete a chat', async () => {
      const response = await request(app)
        .post('/api/chat/delete')
        .send({
          chatId: testChatId,
          jwtToken: authToken
        });

      expect(response.status).toBe(200);
      expect(response.body.msg).toContain('deleted successfully');
      
      // Verify it's deleted
      const checkResponse = await request(app)
        .get('/api/chat/detail')
        .query({ 
          chatId: testChatId,
          jwtToken: authToken 
        });
        
      expect(checkResponse.status).toBe(404);
    });
  });
});