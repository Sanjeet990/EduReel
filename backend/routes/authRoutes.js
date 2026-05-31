const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    logoutUser, 
    getMe, 
    updateOnboarding 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { enforceDeviceLimit } = require('../middleware/deviceMiddleware');

router.post('/register', registerUser);
router.post('/login', enforceDeviceLimit, loginUser);
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMe);
router.put('/onboarding', protect, updateOnboarding);

module.exports = router;
