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
    updateUser,
    getAnalytics,
    getVideoComments,
    deleteComment,
    editComment
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

router.get('/videos/:id/comments', getVideoComments);
router.put('/comments/:id', editComment);
router.delete('/comments/:id', deleteComment);

// Users
router.route('/users')
    .get(getUsers);
router.route('/users/:id')
    .put(updateUser);

// Analytics
router.get('/analytics', getAnalytics);

module.exports = router;
