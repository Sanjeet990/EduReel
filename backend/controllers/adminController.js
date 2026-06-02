const Video = require('../models/videoModel');
const User = require('../models/userModel');
const ffmpeg = require('fluent-ffmpeg');
const { transcode } = require('../services/transcodeService');
const fs = require('fs');
const Comment = require('../models/commentModel');
const VideoView = require('../models/videoViewModel');
const UserProfile = require('../models/userProfileModel');

// @desc    Upload new video
// @route   POST /api/admin/videos/upload
// @access  Private/Admin
const uploadVideo = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No video file provided' });
    }

    const { title, description, subject, targetClass, targetAgeGroup, tags } = req.body;
    const rawFilePath = req.file.path;
    const videoId = req.videoId; // Set by multer

    try {
        // Validate duration with ffprobe
        ffmpeg.ffprobe(rawFilePath, async (err, metadata) => {
            if (err) {
                fs.unlinkSync(rawFilePath);
                return res.status(500).json({ success: false, message: 'Error analyzing video file' });
            }

            const durationSeconds = metadata.format.duration;

            if (durationSeconds < 10) {
                fs.unlinkSync(rawFilePath);
                return res.status(400).json({ success: false, message: 'Video too short. Must be at least 10s.' });
            }
            if (durationSeconds > 90) {
                fs.unlinkSync(rawFilePath);
                return res.status(400).json({ success: false, message: 'Video too long. Must be under 90s.' });
            }

            // Create Video document
            const video = await Video.create({
                _id: videoId, // Use the uuid from multer
                title,
                description,
                subject,
                targetClass: targetClass ? (Array.isArray(targetClass) ? targetClass : targetClass.split(',').map(Number)) : [],
                targetAgeGroup,
                uploadedBy: req.user._id,
                durationSeconds,
                rawFilePath,
                tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : []
            });

            // Return 202 Accepted immediately
            res.status(202).json({ 
                success: true, 
                message: 'Upload successful, transcoding started',
                data: { videoId, status: 'processing' }
            });

            // Trigger transcoder asynchronously
            transcode(videoId, rawFilePath);
        });

    } catch (error) {
        fs.unlinkSync(rawFilePath);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reupload video
// @route   PUT /api/admin/videos/:id/reupload
// @access  Private/Admin
const reuploadVideo = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No video file provided' });
    }

    const videoId = req.params.id;
    const rawFilePath = req.file.path;

    try {
        const video = await Video.findById(videoId);
        if (!video) {
            fs.unlinkSync(rawFilePath);
            return res.status(404).json({ success: false, message: 'Video not found' });
        }

        // Validate duration with ffprobe
        ffmpeg.ffprobe(rawFilePath, async (err, metadata) => {
            if (err) {
                fs.unlinkSync(rawFilePath);
                return res.status(500).json({ success: false, message: 'Error analyzing video file' });
            }

            const durationSeconds = metadata.format.duration;

            if (durationSeconds < 10) {
                fs.unlinkSync(rawFilePath);
                return res.status(400).json({ success: false, message: 'Video too short. Must be at least 10s.' });
            }
            if (durationSeconds > 90) {
                fs.unlinkSync(rawFilePath);
                return res.status(400).json({ success: false, message: 'Video too long. Must be under 90s.' });
            }

            // Cleanup old HLS files and thumbnails
            const path = require('path');
            const hlsDir = path.join('public', 'hls', videoId);
            if (fs.existsSync(hlsDir)) {
                fs.rmSync(hlsDir, { recursive: true, force: true });
            }

            // Update video document
            video.status = 'processing';
            video.rawFilePath = rawFilePath;
            video.durationSeconds = durationSeconds;
            // Clear old URLs
            video.hlsUrl = undefined;
            video.thumbnailUrl = undefined;
            video.resolutions = [];
            
            await video.save();

            res.status(202).json({ 
                success: true, 
                message: 'Re-upload successful, transcoding started',
                data: { videoId, status: 'processing' }
            });

            // Trigger transcoder asynchronously
            transcode(videoId, rawFilePath);
        });

    } catch (error) {
        if (fs.existsSync(rawFilePath)) {
            fs.unlinkSync(rawFilePath);
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all videos (admin view)
// @route   GET /api/admin/videos
// @access  Private/Admin
const getVideos = async (req, res) => {
    try {
        const { page = 1, limit = 10, subject, targetClass, duration, search } = req.query;
        let query = { isActive: { $ne: false } };

        if (subject) query.subject = subject;
        if (targetClass !== undefined && targetClass !== null && targetClass !== '') {
            const parsedClass = Number(targetClass);
            if (!Number.isNaN(parsedClass)) {
                query.targetClass = parsedClass;
            }
        }
        if (search) query.title = { $regex: search, $options: 'i' };
        
        if (duration) {
            if (duration === 'short') query.durationSeconds = { $gte: 10, $lte: 30 };
            else if (duration === 'medium') query.durationSeconds = { $gte: 31, $lte: 60 };
            else if (duration === 'long') query.durationSeconds = { $gte: 61, $lte: 90 };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const videos = await Video.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await Video.countDocuments(query);

        res.json({ 
            success: true, 
            data: videos,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update video metadata
// @route   PUT /api/admin/videos/:id
// @access  Private/Admin
const updateVideo = async (req, res) => {
    try {
        const video = await Video.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
        res.json({ success: true, data: video });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Soft delete video
// @route   DELETE /api/admin/videos/:id
// @access  Private/Admin
const deleteVideo = async (req, res) => {
    try {
        const video = await Video.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
        res.json({ success: true, message: 'Video deactivated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const users = await User.find({})
            .populate('plan')
            .select('-password')
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments({});

        res.json({ 
            success: true, 
            data: users,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create user
// @route   POST /api/admin/users
// @access  Private/Admin
const createUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists with this email' });
        }

        const user = await User.create(req.body);
        const createdUser = await User.findById(user._id).select('-password');

        res.status(201).json({ success: true, data: createdUser });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get user by id
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('plan').select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const { password, ...updateData } = req.body;
        Object.assign(user, updateData);
        
        // If password is not empty, update it
        if (password && password.trim() !== '') {
            user.password = password;
        }

        await user.save();
        
        const updatedUser = await User.findById(user._id).select('-password');
        res.json({ success: true, data: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get user preferences
// @route   GET /api/admin/users/:id/preferences
// @access  Private/Admin
const getUserPreferences = async (req, res) => {
    try {
        let profile = await UserProfile.findOne({ user: req.params.id });
        if (!profile) {
            profile = { user: req.params.id, ageGroup: '', classLevel: null, subjects: [] };
        }
        res.json({ success: true, data: profile });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update user preferences
// @route   PUT /api/admin/users/:id/preferences
// @access  Private/Admin
const updateUserPreferences = async (req, res) => {
    try {
        const { ageGroup, classLevel, subjects } = req.body;
        let profile = await UserProfile.findOne({ user: req.params.id });
        
        if (!profile) {
            profile = new UserProfile({ user: req.params.id });
        }
        
        if (ageGroup !== undefined) profile.ageGroup = ageGroup;
        if (classLevel !== undefined) profile.classLevel = classLevel;
        if (subjects !== undefined) profile.subjects = subjects;
        
        await profile.save();
        res.json({ success: true, data: profile });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get dashboard analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalVideos = await Video.countDocuments();
        const activeSubscribers = await User.countDocuments({ trialActive: false, plan: { $exists: true } });
        
        // Aggregate views
        const videoStats = await Video.aggregate([
            { $group: { _id: null, totalViews: { $sum: "$viewCount" } } }
        ]);
        const totalViews = videoStats[0] ? videoStats[0].totalViews : 0;

        const viewsBySubjectRaw = await Video.aggregate([
            { $match: { isActive: { $ne: false } } },
            { $group: { _id: '$subject', views: { $sum: '$viewCount' } } },
            { $project: { _id: 0, name: { $ifNull: ['$_id', 'Unknown'] }, value: '$views' } },
            { $sort: { value: -1 } }
        ]);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setHours(0, 0, 0, 0);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        const viewsLast7DaysRaw = await VideoView.aggregate([
            { $match: { viewedAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: {
                        y: { $year: '$viewedAt' },
                        m: { $month: '$viewedAt' },
                        d: { $dayOfMonth: '$viewedAt' }
                    },
                    views: { $sum: 1 }
                }
            }
        ]);

        const dayMap = new Map();
        viewsLast7DaysRaw.forEach((row) => {
            const key = `${row._id.y}-${String(row._id.m).padStart(2, '0')}-${String(row._id.d).padStart(2, '0')}`;
            dayMap.set(key, row.views);
        });
        const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const viewsLast7Days = [];
        for (let i = 0; i < 7; i += 1) {
            const dt = new Date(sevenDaysAgo);
            dt.setDate(sevenDaysAgo.getDate() + i);
            const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
            viewsLast7Days.push({ name: weekday[dt.getDay()], views: dayMap.get(key) || 0 });
        }

        res.json({
            success: true,
            data: {
                totalUsers,
                totalVideos,
                activeSubscribers,
                totalViews,
                viewsBySubject: viewsBySubjectRaw,
                viewsLast7Days
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get comments for a video (admin view)
// @route   GET /api/admin/videos/:id/comments
// @access  Private/Admin
const getVideoComments = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const comments = await Comment.find({ video: req.params.id })
            .populate('user', 'name username profileImage')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await Comment.countDocuments({ video: req.params.id });

        res.json({
            success: true,
            data: comments,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete comment (moderation)
// @route   DELETE /api/admin/comments/:id
// @access  Private/Admin
const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

        // Decrement count on video
        await Video.findByIdAndUpdate(comment.video, { $inc: { commentCount: -1 } });

        // Delete the comment itself
        await Comment.findByIdAndDelete(req.params.id);

        // Delete any replies to this comment
        const replies = await Comment.find({ parentComment: req.params.id });
        if (replies.length > 0) {
            await Comment.deleteMany({ parentComment: req.params.id });
            // Decrement the reply count from video as well
            await Video.findByIdAndUpdate(comment.video, { $inc: { commentCount: -replies.length } });
        }

        res.json({ success: true, message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Edit comment text (moderation)
// @route   PUT /api/admin/comments/:id
// @access  Private/Admin
const editComment = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, message: 'Comment text is required' });
        }

        const comment = await Comment.findByIdAndUpdate(
            req.params.id,
            { text: text.trim(), editedByAdmin: true },
            { new: true, runValidators: true }
        ).populate('user', 'name username profileImage');

        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        res.json({ success: true, data: comment, message: 'Comment updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
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
};
