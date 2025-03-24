const chapterSchema = require('./Chapter');

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const classSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    number: {
        type: String,
        required: true,
    },
    syllabus: {
        type: String,
        required: false,
    },
    userID : {
        type: String,
        required: true,
    },
    chapters: [chapterSchema]
});

module.exports = mongoose.model('Class', classSchema);