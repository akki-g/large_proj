
const express = require('express');
const router = express.Router();
const { createClass, searchClass, modifyClass, deleteClass, getAllClasses, getClassWithChapters } = require('../controllers/classController');
const upload = require('../fileControl/fileUpload');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json({ limit: '50mb' });

router.post('/create',  upload.single('syllabus'), createClass);
router.post('/search', jsonParser, searchClass);
router.post('/modify', jsonParser, modifyClass);
router.post('/delete', deleteClass);
router.get('/allClasses', getAllClasses);
router.get('/classWithChapters', getClassWithChapters);

module.exports = router;

