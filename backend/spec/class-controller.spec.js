// spec/class-controller.spec.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Class = require('../models/Class');
const Chapter = require('../models/Chapter');
const User = require('../models/Users');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

describe('Class Controller Tests', () => {
  let testUser;
  let authToken;
  let testClassId;
  
  // Setup before all tests
  beforeAll(async () => {
    try {
      // Connect to test database
      await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/syllab_test');
      
      // Clear collections
      await Class.deleteMany({});
      await Chapter.deleteMany({});
      await User.deleteMany({});
      
      // Create test user
      const userId = uuidv4();
      const passwordHash = await bcrypt.hash('Password123!', 10);
      
      testUser = {
        firstName: 'Class',
        lastName: 'Test',
        email: 'class@example.com',
        password: passwordHash,
        phone: '1234567890',
        userID: userId,
        isVerified: true
      };
      
      await User.create(testUser);
      
      // Generate token for test user
      const payload = { user: { id: userId, email: 'class@example.com' } };
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

  // Reset class and chapter data before each test
  beforeEach(async () => {
    await Class.deleteMany({});
    await Chapter.deleteMany({});
    
    // Mock axios for OpenAI responses
    spyOn(axios, 'post').and.returnValue(Promise.resolve({
      data: {
        choices: [{
          message: {
            content: '["Chapter 1: Introduction", "Chapter 2: Testing"]'
          }
        }]
      }
    }));
  });

  describe('GET /api/classes/allClasses', () => {
    it('should return empty array when no classes exist', async () => {
      const response = await request(app)
        .get('/api/classes/allClasses')
        .query({ token: authToken });

      expect(response.status).toBe(200);
      expect(response.body.classes).toBeDefined();
      expect(Array.isArray(response.body.classes)).toBe(true);
      expect(response.body.classes.length).toBe(0);
    });
    
    it('should return classes when they exist', async () => {
      // Create a test class
      const testClass = new Class({
        name: 'Test Class',
        number: 'TEST101',
        syllabus: 'Mock syllabus content',
        userID: testUser.userID,
        chapters: []
      });
      const savedClass = await testClass.save();
      testClassId = savedClass._id;
      
      const response = await request(app)
        .get('/api/classes/allClasses')
        .query({ token: authToken });

      expect(response.status).toBe(200);
      expect(response.body.classes).toBeDefined();
      expect(response.body.classes.length).toBe(1);
      expect(response.body.classes[0].name).toBe('Test Class');
    });
  });
  
  describe('GET /api/classes/classWithChapters', () => {
    beforeEach(async () => {
      // Create a test class with chapters
      const testClass = new Class({
        name: 'Test Class with Chapters',
        number: 'TEST102',
        syllabus: 'Mock syllabus content',
        userID: testUser.userID,
        chapters: []
      });
      const savedClass = await testClass.save();
      testClassId = savedClass._id;
      
      // Create chapters
      const chapter1 = new Chapter({
        chapterName: 'Chapter 1',
        className: 'Test Class with Chapters',
        classID: testClassId.toString(),
        summary: 'Chapter 1 summary',
        userID: testUser.userID
      });
      const chapter2 = new Chapter({
        chapterName: 'Chapter 2',
        className: 'Test Class with Chapters',
        classID: testClassId.toString(),
        summary: 'Chapter 2 summary',
        userID: testUser.userID
      });
      
      const savedChapter1 = await chapter1.save();
      const savedChapter2 = await chapter2.save();
      
      // Update class with chapter IDs
      testClass.chapters = [savedChapter1._id, savedChapter2._id];
      await testClass.save();
    });
    
    it('should return class with its chapters', async () => {
      // Convert testClassId to a string explicitly
      const classIdString = testClassId.toString();
      
      const response = await request(app)
        .get('/api/classes/classWithChapters')
        .query({ 
          classID: classIdString,
          jwtToken: authToken 
        });

      expect(response.status).toBe(200);
      expect(response.body.class).toBeDefined();
      expect(response.body.class._id.toString()).toBe(classIdString);
      expect(response.body.class.chapters).toBeDefined();
      expect(response.body.class.chapters.length).toBe(2);
    });
  });
  
  describe('POST /api/classes/search', () => {
    beforeEach(async () => {
      // Create multiple test classes for search
      const class1 = new Class({
        name: 'Computer Science',
        number: 'CS101',
        syllabus: 'Computer Science syllabus',
        userID: testUser.userID,
        chapters: []
      });
      await class1.save();
      
      const class2 = new Class({
        name: 'Mathematics',
        number: 'MATH101',
        syllabus: 'Mathematics syllabus',
        userID: testUser.userID,
        chapters: []
      });
      await class2.save();
    });
    
    it('should find classes matching search keyword', async () => {
      const response = await request(app)
        .post('/api/classes/search')
        .send({
          keyword: 'Computer',
          jwtToken: authToken
        });

      expect(response.status).toBe(200);
      expect(response.body.classes).toBeDefined();
      expect(response.body.classes.length).toBe(1);
      expect(response.body.classes[0].name).toBe('Computer Science');
    });
  });
  
  describe('POST /api/classes/delete', () => {
    beforeEach(async () => {
      // Create a test class
      const testClass = new Class({
        name: 'Test Class for Deletion',
        number: 'DELETE101',
        syllabus: 'Mock syllabus content',
        userID: testUser.userID,
        chapters: []
      });
      const savedClass = await testClass.save();
      testClassId = savedClass._id;
    });
    
    it('should delete a class', async () => {
      const response = await request(app)
        .post('/api/classes/delete')
        .send({
          classID: testClassId,
          jwtToken: authToken
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted');
      
      // Verify it's deleted
      const checkResponse = await request(app)
        .get('/api/classes/allClasses')
        .query({ token: authToken });
        
      expect(checkResponse.body.classes.length).toBe(0);
    });
  });
});