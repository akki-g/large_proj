const mongoose = require('mongoose');
const User = require('../../models/Users');
const Class = require('../../models/Class');
const Chapter = require('../../models/Chapter');
const Quiz = require('../../models/Question');
const Chat = require('../../models/Chat');

// Connect to test database
const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/syllab_test');
    console.log('Connected to test database');
  } catch (error) {
    console.error('Test database connection error:', error);
    throw error;
  }
};

// Clear all collections
const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Class.deleteMany({});
    await Chapter.deleteMany({});
    await Quiz.deleteMany({});
    await Chat.deleteMany({});
    console.log('Database cleared');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};

// Close database connection
const closeDatabase = async () => {
  try {
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
};

module.exports = {
  connectDatabase,
  clearDatabase,
  closeDatabase
};