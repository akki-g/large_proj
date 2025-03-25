
const express = require('express');
const router = express.Router();
const { createClass, searchClass, modifyClass, deleteClass, getAllClasses, getClassWithChapters } = require('../controllers/classController');

router.post('/create', createClass);
router.post('/search', searchClass);
router.post('/modify', modifyClass);
router.post('/delete', deleteClass);
router.get('/allClasses', getAllClasses);
router.get('/classWithChapters', getClassWithChapters);

module.exports = router;

