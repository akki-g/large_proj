// models/Chapter.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const questionSchema = require('./Question'); 

const chapterSchema = new Schema({
  chapterName: { type: String, required: true },
  className: { type: String, required: true },
  classID: { type: String, required: true },
  summary : { type: String, required: false },
  quiz: [questionSchema]

});

module.exports = mongoose.model('Chapter', chapterSchema);
