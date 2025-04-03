// fileControl/fileUpload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// Create multer instance with enhanced error handling
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024, // Increased to 25MB limit
        files: 1 // Only allow 1 file to be uploaded at once
    },
    fileFilter: function (req, file, cb) {
        // Log information about the incoming file
        console.log('Received file in multer:', {
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: req.headers['content-length'] || 'unknown'
        });
        
        // Only allow PDFs
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    }
}).single('syllabus'); // Pre-configure for single file named 'syllabus'

// Wrapper function to handle multer errors properly
const uploadMiddleware = (req, res, next) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading
            console.error('Multer upload error:', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({ 
                    error: 'File too large', 
                    message: 'The uploaded file exceeds the 25MB size limit.'
                });
            }
            return res.status(400).json({ 
                error: err.message,
                code: err.code 
            });
        } else if (err) {
            // An unknown error occurred
            console.error('Unknown upload error:', err);
            return res.status(500).json({ 
                error: 'File upload failed',
                message: err.message 
            });
        }
        // Everything went fine
        next();
    });
};

module.exports = uploadMiddleware;