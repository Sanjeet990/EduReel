const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getComments, addComment, deleteComment, toggleLikeComment } = require('../controllers/commentController');

// The video routes for comments are usually mounted as /api/videos/:id/comments
// We can handle that in server.js or mount here if using mergeParams.
// To keep it simple, we can define the routes here and mount at /api

router.get('/videos/:id/comments', getComments);
router.post('/videos/:id/comments', protect, addComment);
router.delete('/comments/:cid', protect, deleteComment);
router.post('/comments/:cid/like', protect, toggleLikeComment);

module.exports = router;
