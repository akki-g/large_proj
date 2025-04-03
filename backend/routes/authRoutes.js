const express = require('express');
const router = express.Router();
const { register, verifyEmail, login, forgotPassword, resetPassword, retrieveData, deleteUser } = require('../controllers/authController');

router.post('/register', register);
router.get('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/retrieve-data', retrieveData);
router.post('/delete-account', deleteUser);

module.exports = router;