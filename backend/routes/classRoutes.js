const express = require('express');
const router = express.Router();
const { createClass, searchClass, modifyClass, deleteClass } = require('../controllers/classController');

router.post('/create', createClass);
router.post('/search', searchClass);
router.post('/modify', modifyClass);
router.post('/delete', deleteClass);

module.exports = router;