// spec/chat-controller.spec.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Chat = require('../models/Chat');
const User = require('../models/Users');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

describe('Chat Controller Tests', () => {
  let testUser;
  let authToken;
  
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
  
  // Reset chat data before each test to ensure test isolation
  beforeEach(async () => {
    // Clear all chats
    await Chat.deleteMany({});
    
    // Mock axios for OpenAI responses
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

  describe('POST /api/chat/send', () => {
    it('should return an error when no message is provided', async () => {
      const response = await request(app)
        .post('/api/chat/send')
        .send({
          jwtToken: authToken
          // No message provided
        });

      expect(response.status).toBe(400);
      expect(response.body.msg).toContain('required');
    });
    
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
    });
    
    it('should continue an existing chat', async () => {
      // First create a new chat
      const createResponse = await request(app)
        .post('/api/chat/send')
        .send({
          message: 'Initial message for continuation test',
          jwtToken: authToken
        });
      
      // Verify the chat was created successfully
      expect(createResponse.status).toBe(200);
      expect(createResponse.body.chat).toBeDefined();
      
      // Get the chat ID for continuation
      const chatId = createResponse.body.chat._id;
      
      // Wait a moment to ensure the first chat is fully saved
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Now send a follow-up message to the same chat
      const response = await request(app)
        .post('/api/chat/send')
        .send({
          message: 'This is a follow-up message',
          chatId: chatId, // Use the ID from the first chat
          jwtToken: authToken
        });

      // Verify the continuation was successful
      expect(response.status).toBe(200);
      expect(response.body.chat).toBeDefined();
      expect(response.body.chat._id).toBe(chatId);
      expect(response.body.chat.messages.length).toBe(4); // Initial message + AI response + Follow-up + AI response
    });
  });

  describe('GET /api/chat/list', () => {
    it('should return list of chats for the user', async () => {
      // Create a test chat first
      await request(app)
        .post('/api/chat/send')
        .send({
          message: 'Test message for chat list',
          jwtToken: authToken
        });
      
      // Wait a moment to ensure the chat is saved
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the list of chats
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
    let testChatId;
    
    beforeEach(async () => {
      // Create a test chat for detail retrieval
      const createResponse = await request(app)
        .post('/api/chat/send')
        .send({
          message: 'Test message for chat detail',
          jwtToken: authToken
        });
      
      testChatId = createResponse.body.chat._id;
      
      // Wait a moment to ensure the chat is saved
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
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
    let testChatId;
    
    beforeEach(async () => {
      // Create a test chat for deletion
      const createResponse = await request(app)
        .post('/api/chat/send')
        .send({
          message: 'Test message for chat deletion',
          jwtToken: authToken
        });
      
      testChatId = createResponse.body.chat._id;
      
      // Wait a moment to ensure the chat is saved
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
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