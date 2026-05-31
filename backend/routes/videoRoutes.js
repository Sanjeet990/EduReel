const express = require('express');
const router = express.Router();
const { 
    getFeed, 
    getExplore, 
    searchVideos,
    getVideoDetail,
    viewVideo,
    likeVideo,
    saveVideo 
} = require('../controllers/videoController');
const { protect } = require('../middleware/authMiddleware');
const { checkSubscription } = require('../middleware/subscriptionMiddleware');

// User video routes
router.get('/feed', protect, checkSubscription, getFeed);
router.get('/explore', getExplore);
router.get('/search', searchVideos);
router.get('/:id', getVideoDetail);
router.get('/:id/stream', (req, res) => {
    // Redirect to HLS master file
    res.redirect(`/hls/${req.params.id}/master.m3u8`);
});

router.post('/:id/view', protect, viewVideo);
router.post('/:id/like', protect, likeVideo);
router.post('/:id/save', protect, saveVideo);

// Comments
const { getComments, addComment } = require('../controllers/commentController');
router.get('/:id/comments', getComments);
router.post('/:id/comments', protect, addComment);

module.exports = router;
