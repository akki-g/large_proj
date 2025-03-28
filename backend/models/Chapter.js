// models/Chapter.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const questionSchema = require('./Question'); 

const chapterSchema = new Schema({
  chapterName: { type: String, required: true },
  className: { type: String, required: true },
  classID: { type: String, required: true },
  summary : { type: String, required: false },
  quiz: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
  userID: { type: String, required: true },

  isCompleted: {
    type: Boolean,
    default: false,
  },
  quizScore: {
    type: Number,
    default: 0,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  attemps: {
    type: Number,
    default: 0,
  }
});

module.exports = mongoose.model('Chapter', chapterSchema);
