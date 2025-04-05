
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userResponseSchema = new Schema({
    userID: { type: String, required: true },
    chosenOption: { type: String },
    correct: { type: Boolean, default: false },
    attemptedAt: { type: Date, default: Date.now }
});

const quizSchema = new Schema({
    question : { type: String, required: true },
    option1 : { type: String, required: true },
    option2 : { type: String, required: true },
    option3 : { type: String, required: true },
    option4 : { type: String, required: true },
    correctOption : { type: String, required: true },
    chosenOption : { type: String, required: false },
    chapterID : { type: String, required: true },
    classID : { type: String, required: true },

    userResponses: [userResponseSchema]

});

module.exports = mongoose.model('Quiz', quizSchema);