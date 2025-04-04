// spec/setup.js
require('dotenv').config({ path: '.env.test' });

console.log('Test environment setup complete');
console.log('Using test MongoDB URI:', process.env.TEST_MONGODB_URI);
console.log('JWT Secret available:', !!process.env.JWT_SECRET);

// Mock console.error to reduce noise during tests
const originalConsoleError = console.error;
console.error = function(...args) {
  // Filter out some common errors to reduce test output noise
  const errorMessage = args.join(' ');
  if (
    errorMessage.includes('mongodb duplicate key') ||
    errorMessage.includes('Cast to ObjectId failed')
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};