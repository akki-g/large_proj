// spec/helpers/database.js
const mongoose = require('mongoose');
const User = require('../../models/Users');
const Class = require('../../models/Class');
const Chapter = require('../../models/Chapter');
const Quiz = require('../../models/Question');
const Chat = require('../../models/Chat');

module.exports.connectToTestDB = async () => {
  await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/syllab_test');
};

module.exports.clearDatabase = async () => {
  await User.deleteMany({});
  await Class.deleteMany({});
  await Chapter.deleteMany({});
  await Quiz.deleteMany({});
  await Chat.deleteMany({});
};

module.exports.closeDatabase = async () => {
  await mongoose.connection.close();
};