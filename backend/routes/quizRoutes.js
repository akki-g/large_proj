const express = require('express');
const router = express.Router();
const { generateQuiz, submitQuiz } = require('../controllers/quizController');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

router.post('/generate', jsonParser, generateQuiz);
router.post('/submit', jsonParser, submitQuiz);


module.exports = router;