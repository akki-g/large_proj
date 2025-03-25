const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
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

const upload = multer({ 
    storage: storage,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
      // Log information about the incoming file for debugging
      console.log('Received file in multer:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype
      });
      
      // Accept all files for now to diagnose the issue
      cb(null, true);
      
      // To only allow PDFs, uncomment this:
      // if (file.mimetype === 'application/pdf') {
      //   cb(null, true);
      // } else {
      //   cb(new Error('Only PDF files are allowed!'), false);
      // }
    }
  });


module.exports = upload;