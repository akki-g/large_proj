
const express = require('express');
const router = express.Router();
const { createClass, searchClass, modifyClass, deleteClass, getAllClasses, getClassWithChapters } = require('../controllers/classController');
const upload = require('../fileControl/fileUpload');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json({ limit: '50mb' });

const multer = require('multer');
const testUpload = multer({ dest: 'uploads/' });

router.post('/create',  upload.single('syllabus'), createClass);
router.post('/search', jsonParser, searchClass);
router.post('/modify', jsonParser, modifyClass);
router.post('/delete', deleteClass);
router.get('/allClasses', getAllClasses);
router.get('/classWithChapters', getClassWithChapters);


router.post('/test-upload', testUpload.single('testFile'), (req, res) => {
    console.log('TEST UPLOAD - File received:', req.file);
    console.log('TEST UPLOAD - Body fields:', req.body);
    
    res.json({
      success: true,
      message: 'File upload test successful',
      fileInfo: req.file || 'No file received',
      bodyFields: req.body
    });
});

module.exports = router;

