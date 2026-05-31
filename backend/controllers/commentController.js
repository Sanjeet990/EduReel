const Comment = require('../models/commentModel');
const Video = require('../models/videoModel');

// @desc    Get comments for a video
// @route   GET /api/videos/:id/comments
// @access  Public or Private
const getComments = async (req, res) => {

    const videoId = req.params.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    try {
        const comments = await Comment.find({ video: videoId })
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({ success: true, data: comments, page, limit });
    } catch (error) {

        console.error('Error fetching comments:', error);

        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add a comment to a video
// @route   POST /api/videos/:id/comments
// @access  Private
const addComment = async (req, res) => {
    const videoId = req.params.id;
    const { text, parentComment } = req.body;

    if (!text || text.trim() === '') {
        return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    try {
        const video = await Video.findById(videoId);
        if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

        const comment = await Comment.create({
            user: req.user._id,
            video: videoId,
            text,
            parentComment: parentComment || null
        });

        // Increment video comment count
        video.commentCount += 1;
        await video.save();

        const populatedComment = await Comment.findById(comment._id).populate('user', 'name email');
        res.status(201).json({ success: true, data: populatedComment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:cid
// @access  Private
const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.cid);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        if (comment.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        await comment.deleteOne();

        // Decrement video comment count
        const video = await Video.findById(comment.video);
        if (video) {
            video.commentCount = Math.max(0, video.commentCount - 1);
            await video.save();
        }

        res.json({ success: true, message: 'Comment removed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Toggle like on a comment
// @route   POST /api/comments/:cid/like
// @access  Private
const toggleLikeComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.cid);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

        const index = comment.likedBy.indexOf(req.user._id);
        let isLiked = false;
        
        if (index === -1) {
            comment.likedBy.push(req.user._id);
            isLiked = true;
        } else {
            comment.likedBy.splice(index, 1);
            isLiked = false;
        }

        await comment.save();
        res.json({ success: true, data: { likes: comment.likedBy.length, isLiked } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getComments,
    addComment,
    deleteComment,
    toggleLikeComment
};
