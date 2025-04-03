// routes/classRoutes.js
const express = require('express');
const router = express.Router();
const { createClass, searchClasses, modifyClass, deleteClass, getAllClasses, getClassWithChapters } = require('../controllers/classController');
const uploadMiddleware = require('../fileControl/fileUpload');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json({ limit: '50mb' });

// Route to test file uploads (for debugging)
router.post('/test-upload', uploadMiddleware, (req, res) => {
    if (!req.file) {
        return res.status(400).json({ 
            success: false,
            message: 'No file was uploaded' 
        });
    }
    
    console.log('TEST UPLOAD - File received:', req.file);
    console.log('TEST UPLOAD - Body fields:', req.body);
    
    res.json({
        success: true,
        message: 'File upload test successful',
        fileInfo: req.file,
        bodyFields: req.body
    });
});

router.post('/create', uploadMiddleware, createClass);
router.post('/search', jsonParser, searchClasses);
router.post('/modify', jsonParser, modifyClass);
router.post('/delete', deleteClass);
router.get('/allClasses', getAllClasses);
router.get('/classWithChapters', getClassWithChapters);

module.exports = router;