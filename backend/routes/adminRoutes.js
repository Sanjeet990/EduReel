const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
    uploadVideo,
    getVideos,
    updateVideo,
    deleteVideo,
    getUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    getUserPreferences,
    updateUserPreferences,
    getAnalytics,
    getVideoComments,
    deleteComment,
    editComment,
    reuploadVideo
} = require('../controllers/adminController');

// All routes here are admin only
router.use(protect, adminOnly);

// Videos
router.post('/videos/upload', upload.single('video'), uploadVideo);
router.route('/videos')
    .get(getVideos);
router.route('/videos/:id')
    .put(updateVideo)
    .delete(deleteVideo);
router.put('/videos/:id/reupload', upload.single('video'), reuploadVideo);

router.get('/videos/:id/comments', getVideoComments);
router.put('/comments/:id', editComment);
router.delete('/comments/:id', deleteComment);

// Users
router.route('/users')
    .get(getUsers)
    .post(createUser);
router.route('/users/:id')
    .get(getUserById)
    .put(updateUser)
    .delete(deleteUser);

router.route('/users/:id/preferences')
    .get(getUserPreferences)
    .put(updateUserPreferences);

// Analytics
router.get('/analytics', getAnalytics);

module.exports = router;
