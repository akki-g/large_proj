const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Chat = require('../models/Chat');
const User = require('../models/Users');
const tokenController = require('../controllers/tokenController');

describe('Chat Controller', () => {
  let authToken;
  const testUserId = 'test-chat-user-id';
  
  // Setup before tests
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/syllab_test');
    
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
    authToken = tokenController.createToken(payload);
  });

  // Cleanup after tests
  afterAll(async () => {
    await mongoose.connection.close();
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
    });
  });
});
