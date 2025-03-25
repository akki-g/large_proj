
const express = require('express');
const router = express.Router();
const { createClass, searchClass, modifyClass, deleteClass, getAllClasses, getClassWithChapters } = require('../controllers/classController');
const upload = require('../fileControl/fileUpload');

router.post('/create',  upload.single('syllabus'), createClass);
router.post('/search', searchClass);
router.post('/modify', modifyClass);
router.post('/delete', deleteClass);
router.get('/allClasses', getAllClasses);
router.get('/classWithChapters', getClassWithChapters);

module.exports = router;

