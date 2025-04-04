// spec/helpers/mock-utils.js
const fs = require('fs');
const path = require('path');

// Mock nodemailer for testing
const mockNodemailer = () => {
  jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockImplementation((mailOptions, callback) => {
        callback(null, { response: 'Email sent' });
      })
    })
  }));
};

// Mock axios for testing
const mockAxios = () => {
  jest.mock('axios', () => ({
    post: jest.fn().mockImplementation((url, data) => {
      // Mock different axios responses based on the URL or data
      if (url.includes('completions')) {
        // For OpenAI API calls
        return Promise.resolve({
          data: {
            choices: [{
              message: {
                content: 'This is a mock AI response.'
              }
            }]
          }
        });
      }
      return Promise.resolve({ data: {} });
    })
  }));
};

// Create a mock PDF file for testing uploads
const createMockPdfFile = () => {
  const dirPath = path.join(__dirname, '../tmp');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }
  
  const filePath = path.join(dirPath, 'mock-syllabus.pdf');
  fs.writeFileSync(filePath, 'Mock PDF content');
  return filePath;
};

// Remove mock files
const cleanupMockFiles = () => {
  const filePath = path.join(__dirname, '../tmp/mock-syllabus.pdf');
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  
  const dirPath = path.join(__dirname, '../tmp');
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmdirSync(dirPath);
    } catch (error) {
      console.error('Error removing tmp directory:', error);
    }
  }
};

module.exports = {
  mockNodemailer,
  mockAxios,
  createMockPdfFile,
  cleanupMockFiles
};
