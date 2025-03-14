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
    time: {
        type: String,
        required: false,
    },
    syllabus: {
        type: String,
        required: false,
    },
    userID : {
        type: String,
        required: true,
    }
});