// models/Chapter.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chapterSchema = new Schema({
  chapterName: { type: String, required: true },
  className: { type: String, required: true },
  classID: { type: String, required: true },
  summaries : { type: String, required: false },
});

module.exports = mongoose.model('Chapter', chapterSchema);
