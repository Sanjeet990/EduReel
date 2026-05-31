const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    getProfile, 
    updateProfile, 
    uploadAvatar,
    getSaved, 
    getHistory, 
    getProgress, 
    getSubscription,
    getPublicProfile,
    toggleFollow,
    getFollowing
} = require('../controllers/userController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure avatars directory exists
const avatarDir = path.join(__dirname, '../public/avatars');
if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'public/avatars/');
    },
    filename(req, file, cb) {
        cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
            return cb(new Error('Please upload an image file'));
        }
        cb(null, true);
    }
});

router.use(protect);

router.route('/profile')
    .get(getProfile)
    .put(updateProfile);

router.post('/profile/image', upload.single('avatar'), uploadAvatar);

router.get('/saved', getSaved);
router.get('/history', getHistory);
router.get('/progress', getProgress);
router.get('/subscription', getSubscription);

// Public profile & Following/Followers
router.get('/:id/public-profile', getPublicProfile);
router.post('/:id/follow', toggleFollow);
router.get('/:id/following', getFollowing);
router.get('/:id/followers', require('../controllers/userController').getFollowers);

module.exports = router;
