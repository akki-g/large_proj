// spec/quizController.spec.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Quiz = require('../models/Question');
const Chapter = require('../models/Chapter');
const Class = require('../models/Class');
const User = require('../models/Users');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Mock axios for AI responses
jest.mock('axios');

describe('Quiz Controller', () => {
  let authToken;
  const testUserId = 'test-quiz-user-id';
  let testClassId;
  let testChapterId;
  let testQuizQuestions;
  
  // Setup before tests
  beforeAll(async () => {
    try {
      // Connect to local test database
      await mongoose.connect(process.env.TEST_MONGODB_URI);
      
      // Clear collections
      await Quiz.deleteMany({});
      await Chapter.deleteMany({});
      await Class.deleteMany({});
      await User.deleteMany({});
      
      // Create test user
      await User.create({
        firstName: 'Quiz',
        lastName: 'Test',
        email: 'quiz@example.com',
        password: 'hashedpassword',
        phone: '1234567890',
        userID: testUserId,
        isVerified: true
      });
      
      // Generate token for test user
      const payload = { user: { id: testUserId, email: 'quiz@example.com' } };
      authToken = jwt.sign(payload, process.env.JWT_SECRET || 'test_secret_key_for_testing', { expiresIn: '1h' });
      
      // Create test class
      const testClass = new Class({
        name: 'Test Class for Quiz',
        number: 'QUIZ101',
        syllabus: 'Mock syllabus for quiz testing',
        userID: testUserId,
        chapters: []
      });
      
      const savedClass = await testClass.save();
      testClassId = savedClass._id;
      
      // Create test chapter
      const testChapter = new Chapter({
        chapterName: 'Test Chapter for Quiz',
        className: 'Test Class for Quiz',
        classID: testClassId.toString(),
        summary: 'This is a test chapter summary for quiz testing',
        userID: testUserId,
        quiz: []
      });
      
      const savedChapter = await testChapter.save();
      testChapterId = savedChapter._id;
      
      // Mock OpenAI response for quiz generation
      axios.post.mockResolvedValue({
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
                  options: ["Wrong option", "Another wrong option", "Correct option", "Yet another wrong option"],
                  correctOption: "Correct option"
                }
              ])
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

  describe('POST /api/quiz/generate', () => {
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
    });
  });
  
  describe('POST /api/quiz/submit', () => {
    it('should submit quiz answers and return results', async () => {
      // Prepare answers (all correct for simplicity)
      const answers = testQuizQuestions.map(q => ({
        questionId: q._id,
        chosenOption: q.option2 // Assuming option2 is correct based on our mock
      }));
      
      const response = await request(app)
        .post('/api/quiz/submit')
        .send({
          chapterID: testChapterId.toString(),
          answers: answers,
          jwtToken: authToken
        });

      expect(response.status).toBe(200);
      expect(response.body.score).toBeDefined();
      expect(response.body.correctCount).toBeDefined();
      expect(response.body.results).toBeDefined();
      expect(Array.isArray(response.body.results)).toBe(true);
    });
  });
});