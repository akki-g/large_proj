const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    phone : {
        type: String,
        required: true,
    },
    userID : {
        type: String,
        required: true,
        unique: true
    },
});


module.exports = mongoose.model('User', userSchema);