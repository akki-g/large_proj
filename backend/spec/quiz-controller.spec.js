// spec/quiz-controller.spec.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Quiz = require('../models/Question');
const Chapter = require('../models/Chapter');
const Class = require('../models/Class');
const User = require('../models/Users');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

describe('Quiz Controller Tests', () => {
  let testUser;
  let authToken;
  let testClassId;
  let testChapterId;
  let testQuizQuestions;
  
  // Setup before all tests
  beforeAll(async () => {
    try {
      // Connect to test database
      await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/syllab_test');
      
      // Clear collections
      await Quiz.deleteMany({});
      await Chapter.deleteMany({});
      await Class.deleteMany({});
      await User.deleteMany({});
      
      // Create test user
      const userId = uuidv4();
      const passwordHash = await bcrypt.hash('Password123!', 10);
      
      testUser = {
        firstName: 'Quiz',
        lastName: 'Test',
        email: 'quiz@example.com',
        password: passwordHash,
        phone: '1234567890',
        userID: userId,
        isVerified: true
      };
      
      await User.create(testUser);
      
      // Generate token for test user
      const payload = { user: { id: userId, email: 'quiz@example.com' } };
      authToken = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'test_jwt_secret_for_testing',
        { expiresIn: '1h' }
      );
      
      // Create test class
      const testClass = new Class({
        name: 'Test Class for Quiz',
        number: 'QUIZ101',
        syllabus: 'Mock syllabus for quiz testing',
        userID: userId,
        chapters: []
      });
      const savedClass = await testClass.save();
      testClassId = savedClass._id;
      
      // Create test chapter with "attemps" initialized to 0
      // Note the typo in the field name - it's "attemps" not "attempts" in the model
      const testChapter = new Chapter({
        chapterName: 'Test Chapter for Quiz',
        className: 'Test Class for Quiz',
        classID: testClassId.toString(),
        summary: 'This is a test chapter summary for quiz testing',
        userID: userId,
        quiz: [],
        attemps: 0 // Note the typo: "attemps" not "attempts"
      });
      const savedChapter = await testChapter.save();
      testChapterId = savedChapter._id;
    } catch (error) {
      console.error('Setup error:', error);
      throw error;
    }
  });

  // Clean up after all tests
  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Reset quiz data before each test
  beforeEach(async () => {
    await Quiz.deleteMany({});
    
    // Mock axios for OpenAI responses
    spyOn(axios, 'post').and.returnValue(Promise.resolve({
      data: {
        choices: [{
          message: {
            content: JSON.stringify([
              {
                question: "What is a test?",
                options: ["Option 1", "Option 2", "Option 3", "Option 4"],
                correctOption: "Option 2"
              },
              {
                question: "Which option is correct?",
                options: ["Wrong", "Incorrect", "Right", "False"],
                correctOption: "Right"
              }
            ])
          }
        }]
      }
    }));
  });

  describe('POST /api/quiz/generate', () => {
    it('should return error for invalid chapter ID', async () => {
      const response = await request(app)
        .post('/api/quiz/generate')
        .send({
          chapterID: '507f1f77bcf86cd799439011', // Non-existent ID in ObjectId format
          jwtToken: authToken
        });

      expect(response.status).toBe(404);
    });
    
    it('should generate quiz questions for a chapter', async () => {
      const response = await request(app)
        .post('/api/quiz/generate')
        .send({
          chapterID: testChapterId.toString(),
          jwtToken: authToken
        });

      expect(response.status).toBe(200);
      expect(response.body.questions).toBeDefined();
      expect(Array.isArray(response.body.questions)).toBe(true);
      expect(response.body.questions.length).toBeGreaterThan(0);
      
      // Save questions for submit test
      testQuizQuestions = response.body.questions;
      
      // Verify chapter is updated with quiz questions
      const updatedChapter = await Chapter.findById(testChapterId);
      expect(updatedChapter.quiz.length).toBeGreaterThan(0);
    });
  });
  
  describe('POST /api/quiz/submit', () => {
    it('should submit quiz answers and return results', async () => {
      // Generate quiz questions for the chapter
      const generateResponse = await request(app)
        .post('/api/quiz/generate')
        .send({
          chapterID: testChapterId.toString(),
          jwtToken: authToken
        });
      
      // Verify generation was successful
      expect(generateResponse.status).toBe(200);
      
      // Get the generated questions
      const questions = generateResponse.body.questions;
      
      // Reset the chapter's attemps to 0 to ensure clean test
      // Note the typo: "attemps" not "attempts"
      await Chapter.findByIdAndUpdate(testChapterId, { attemps: 0 });
      
      // Prepare answers for submission - create a valid format that matches what the controller expects
      const answers = questions.map(q => ({
        questionId: q._id,
        chosenOption: q.option2
      }));
      
      // Submit quiz answers
      const response = await request(app)
        .post('/api/quiz/submit')
        .send({
          chapterID: testChapterId.toString(),
          answers: answers,
          jwtToken: authToken
        });
      
      // Verify response is successful
      expect(response.status).toBe(200);
      expect(response.body.score).toBeDefined();
      expect(response.body.correctCount).toBeDefined();
      
      // Important: Get a fresh copy of the chapter directly from the database
      // without any caching to check that attemps were incremented
      const updatedChapter = await Chapter.findById(testChapterId).lean();
      
      // Verify attemps (note the typo) have been incremented
      expect(updatedChapter.attemps).toBeGreaterThanOrEqual(1);
    });
  });
});