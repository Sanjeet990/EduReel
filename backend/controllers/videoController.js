const Video = require('../models/videoModel');
const Interaction = require('../models/interactionModel');
const UserProfile = require('../models/userProfileModel');
const VideoView = require('../models/videoViewModel');
const { getRecommendedFeed } = require('../services/recommendationService');

// @desc    Get video feed (recommended)
// @route   GET /api/videos/feed
// @access  Private (Subscription checked via middleware)
const getFeed = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    try {
        const feed = await getRecommendedFeed(req.user._id, page, limit);
        res.json({ success: true, data: feed, page, limit });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get explore videos
// @route   GET /api/videos/explore
// @access  Public or Private
const getExplore = async (req, res) => {
    const { subject, classLevel, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    let query = { status: 'ready', isActive: true };
    if (subject) query.subject = subject;
    if (classLevel) query.targetClass = Number(classLevel);
    if (search) query.title = { $regex: search, $options: 'i' };

    try {
        const totalVideos = await Video.countDocuments(query);

        const videos = await Video.find(query)
            .sort({ viewCount: -1 })
            .skip(skip)
            .limit(limit)
            .populate('uploadedBy', 'name')
            .lean();

        // Enrich with uploader profile image
        const uploaderIds = [...new Set(videos.map(v => v.uploadedBy?._id).filter(Boolean))];
        const uploaderProfiles = await UserProfile.find({ user: { $in: uploaderIds } });
        
        const profileMap = {};
        uploaderProfiles.forEach(p => {
            profileMap[p.user.toString()] = p.profileImage;
        });

        let followingList = [];
        let interactionsMap = {};
        if (req.user) {
            const myProfile = await UserProfile.findOne({ user: req.user._id });
            if (myProfile && myProfile.following) {
                followingList = myProfile.following.map(id => id.toString());
            }

            const videoIds = videos.map(v => v._id.toString());
            const userInteractions = await Interaction.find({
                user: req.user._id,
                video: { $in: videoIds }
            });

            userInteractions.forEach(interaction => {
                interactionsMap[interaction.video.toString()] = {
                    isLiked: interaction.liked || false,
                    isSaved: interaction.saved || false
                };
            });
        }

        const finalVideos = videos.map(v => {
            let uploaderInfo = null;
            if (v.uploadedBy) {
                uploaderInfo = {
                    _id: v.uploadedBy._id,
                    name: v.uploadedBy.name,
                    avatar: profileMap[v.uploadedBy._id.toString()] || null,
                    isFollowing: followingList.includes(v.uploadedBy._id.toString())
                };
            }
            const videoIdStr = v._id.toString();
            const interaction = interactionsMap[videoIdStr] || { isLiked: false, isSaved: false };
            
            return { 
                ...v, 
                uploader: uploaderInfo,
                isLiked: interaction.isLiked,
                isSaved: interaction.isSaved
            };
        });

        const hasMore = skip + videos.length < totalVideos;
        res.json({ success: true, data: finalVideos, hasMore });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Search videos
// @route   GET /api/videos/search
// @access  Public or Private
const searchVideos = async (req, res) => {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    if (!q) {
        return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    let query = { status: 'ready', isActive: true };
    query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } }
    ];

    try {
        const totalVideos = await Video.countDocuments(query);

        const videos = await Video.find(query)
            .sort({ viewCount: -1 })
            .skip(skip)
            .limit(limit)
            .populate('uploadedBy', 'name')
            .lean();

        // Enrich with uploader profile image
        const uploaderIds = [...new Set(videos.map(v => v.uploadedBy?._id).filter(Boolean))];
        const uploaderProfiles = await UserProfile.find({ user: { $in: uploaderIds } });
        
        const profileMap = {};
        uploaderProfiles.forEach(p => {
            profileMap[p.user.toString()] = p.profileImage;
        });

        let followingList = [];
        let interactionsMap = {};
        if (req.user) {
            const myProfile = await UserProfile.findOne({ user: req.user._id });
            if (myProfile && myProfile.following) {
                followingList = myProfile.following.map(id => id.toString());
            }

            const videoIds = videos.map(v => v._id.toString());
            const userInteractions = await Interaction.find({
                user: req.user._id,
                video: { $in: videoIds }
            });

            userInteractions.forEach(interaction => {
                interactionsMap[interaction.video.toString()] = {
                    isLiked: interaction.liked || false,
                    isSaved: interaction.saved || false
                };
            });
        }

        const finalVideos = videos.map(v => {
            let uploaderInfo = null;
            if (v.uploadedBy) {
                uploaderInfo = {
                    _id: v.uploadedBy._id,
                    name: v.uploadedBy.name,
                    avatar: profileMap[v.uploadedBy._id.toString()] || null,
                    isFollowing: followingList.includes(v.uploadedBy._id.toString())
                };
            }
            const videoIdStr = v._id.toString();
            const interaction = interactionsMap[videoIdStr] || { isLiked: false, isSaved: false };
            
            return { 
                ...v, 
                uploader: uploaderInfo,
                isLiked: interaction.isLiked,
                isSaved: interaction.isSaved
            };
        });

        const hasMore = skip + videos.length < totalVideos;
        res.json({ success: true, data: finalVideos, hasMore });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get video detail
// @route   GET /api/videos/:id
// @access  Public
const getVideoDetail = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
        res.json({ success: true, data: video });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    View a video
// @route   POST /api/videos/:id/view
// @access  Private
const viewVideo = async (req, res) => {
    const { watchedSeconds } = req.body;
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

        const completionRate = Math.min(1, watchedSeconds / video.durationSeconds);
        const now = new Date();
        const interaction = await Interaction.findOne({ user: req.user._id, video: video._id });
        const shouldCountView = !interaction?.lastViewedAt || (now - new Date(interaction.lastViewedAt)) >= (24 * 60 * 60 * 1000);

        if (shouldCountView) {
            video.viewCount += 1;
            await video.save();
            await VideoView.create({
                user: req.user._id,
                video: video._id,
                subject: video.subject || '',
                viewedAt: now
            });
        }

        await Interaction.findOneAndUpdate(
            { user: req.user._id, video: video._id },
            { $set: { watchedSeconds, completionRate, lastViewedAt: shouldCountView ? now : (interaction?.lastViewedAt || now) } },
            { upsert: true, new: true }
        );

        // Update User Profile XP and streak
        const profile = await UserProfile.findOne({ user: req.user._id });
        if (profile) {
            if (completionRate >= 0.8) profile.xp += 10;
            else if (completionRate >= 0.5) profile.xp += 5;

            const lastActive = profile.lastActiveDate ? new Date(profile.lastActiveDate) : null;
            
            if (!lastActive) {
                profile.streakDays = 1;
            } else {
                const diffTime = Math.abs(now - lastActive);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    profile.streakDays += 1;
                } else if (diffDays > 1) {
                    profile.streakDays = 1;
                }
            }
            
            profile.lastActiveDate = now;
            
            // Add to watched if not exists
            if (!profile.watchedVideos.includes(video._id)) {
                profile.watchedVideos.push(video._id);
            }

            await profile.save();
        }

        res.json({ success: true, message: 'View recorded' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Toggle like video
// @route   POST /api/videos/:id/like
// @access  Private
const likeVideo = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

        const interaction = await Interaction.findOne({ user: req.user._id, video: video._id });
        
        let isLiked = false;
        if (interaction) {
            interaction.liked = !interaction.liked;
            isLiked = interaction.liked;
            await interaction.save();
        } else {
            await Interaction.create({ user: req.user._id, video: video._id, liked: true });
            isLiked = true;
        }

        if (isLiked) {
            video.likeCount += 1;
        } else {
            video.likeCount = Math.max(0, video.likeCount - 1);
        }
        await video.save();

        res.json({ success: true, data: { isLiked, likeCount: video.likeCount } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Toggle save video
// @route   POST /api/videos/:id/save
// @access  Private
const saveVideo = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

        const interaction = await Interaction.findOne({ user: req.user._id, video: video._id });
        
        let isSaved = false;
        if (interaction) {
            interaction.saved = !interaction.saved;
            isSaved = interaction.saved;
            await interaction.save();
        } else {
            await Interaction.create({ user: req.user._id, video: video._id, saved: true });
            isSaved = true;
        }

        res.json({ success: true, data: { isSaved } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getFeed,
    getExplore,
    searchVideos,
    getVideoDetail,
    viewVideo,
    likeVideo,
    saveVideo
};
