/*

const express = require('express');
const router = express.Router();
const { sendMessage, getChats, getChatById, deleteChat } = require('../controllers/chatController');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json({ limit: '50mb' });

router.post('/send', jsonParser, sendMessage);

router.get('/list', getChats);

router.get('/detail', getChatById);

router.post('/delete', jsonParser, deleteChat);

module.exports = router;

*/