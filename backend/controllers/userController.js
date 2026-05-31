const UserProfile = require('../models/userProfileModel');
const Interaction = require('../models/interactionModel');
const Video = require('../models/videoModel');
const User = require('../models/userModel');

// @desc    Get user profile + XP
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const profile = await UserProfile.findOne({ user: req.user._id })
            .populate('user', '-password');
        res.json({ success: true, data: profile });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
    const { subjects, classLevel, ageGroup, name, password } = req.body;
    try {
        const profile = await UserProfile.findOne({ user: req.user._id });
        if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
        
        if (subjects) profile.subjects = subjects;
        if (classLevel) profile.classLevel = classLevel;
        if (ageGroup) profile.ageGroup = ageGroup;
        
        await profile.save();

        const user = await require('../models/userModel').findById(req.user._id);
        if (name) user.name = name;
        if (password && password.trim() !== '') {
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }
        await user.save();

        await profile.populate('user', '-password');
        res.json({ success: true, data: profile });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get saved videos
// @route   GET /api/users/saved
// @access  Private
const getSaved = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalInteractions = await Interaction.countDocuments({ user: req.user._id, saved: true });

        const interactions = await Interaction.find({ user: req.user._id, saved: true })
            .populate({
                path: 'video',
                populate: { path: 'uploadedBy', select: 'name' }
            })
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);
        
        let videos = interactions.map(i => i.video).filter(v => v !== null);

        // Enrich with uploader profile image
        const uploaderIds = [...new Set(videos.map(v => v.uploadedBy?._id).filter(Boolean))];
        const uploaderProfiles = await UserProfile.find({ user: { $in: uploaderIds } });
        
        const profileMap = {};
        uploaderProfiles.forEach(p => {
            profileMap[p.user.toString()] = p.profileImage;
        });

        videos = videos.map(v => {
            const vObj = v.toObject ? v.toObject() : v;
            let uploaderInfo = null;
            if (vObj.uploadedBy) {
                uploaderInfo = {
                    _id: vObj.uploadedBy._id,
                    name: vObj.uploadedBy.name,
                    avatar: profileMap[vObj.uploadedBy._id.toString()] || null
                };
            }
            return { ...vObj, uploader: uploaderInfo };
        });

        const hasMore = skip + interactions.length < totalInteractions;
        res.json({ success: true, data: videos, hasMore });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get watched history
// @route   GET /api/users/history
// @access  Private
const getHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const query = {
            user: req.user._id,
            updatedAt: { $gte: startOfDay }
        };

        const totalInteractions = await Interaction.countDocuments(query);

        const interactions = await Interaction.find(query)
            .populate({
                path: 'video',
                populate: { path: 'uploadedBy', select: 'name' }
            })
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        let videos = interactions.map(i => i.video).filter(v => v !== null);

        // Enrich with uploader profile image
        const uploaderIds = [...new Set(videos.map(v => v.uploadedBy?._id).filter(Boolean))];
        const uploaderProfiles = await UserProfile.find({ user: { $in: uploaderIds } });
        
        const profileMap = {};
        uploaderProfiles.forEach(p => {
            profileMap[p.user.toString()] = p.profileImage;
        });

        videos = videos.map(v => {
            const vObj = v.toObject ? v.toObject() : v;
            let uploaderInfo = null;
            if (vObj.uploadedBy) {
                uploaderInfo = {
                    _id: vObj.uploadedBy._id,
                    name: vObj.uploadedBy.name,
                    avatar: profileMap[vObj.uploadedBy._id.toString()] || null
                };
            }
            return { ...vObj, uploader: uploaderInfo };
        });

        const hasMore = skip + interactions.length < totalInteractions;
        res.json({ success: true, data: videos, hasMore });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get progress
// @route   GET /api/users/progress
// @access  Private
const getProgress = async (req, res) => {
    try {
        const profile = await UserProfile.findOne({ user: req.user._id });
        res.json({ 
            success: true, 
            data: { 
                xp: profile ? profile.xp : 0, 
                streakDays: profile ? profile.streakDays : 0,
                subjects: profile ? profile.subjects : []
            } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get subscription status
// @route   GET /api/users/subscription
// @access  Private
const getSubscription = async (req, res) => {
    try {
        // req.user has been fetched in protect middleware
        res.json({ 
            success: true, 
            data: {
                trialActive: req.user.trialActive,
                trialExpires: req.user.trialExpires,
                plan: req.user.plan,
                planExpires: req.user.planExpires
            } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Upload profile avatar
// @route   POST /api/users/profile/image
// @access  Private
const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload an image file' });
        }

        const avatarUrl = `/avatars/${req.file.filename}`;
        
        let profile = await UserProfile.findOne({ user: req.user._id });
        if (!profile) {
            profile = new UserProfile({ user: req.user._id, profileImage: avatarUrl });
        } else {
            profile.profileImage = avatarUrl;
        }
        
        await profile.save();
        await profile.populate('user', '-password');

        res.json({ success: true, data: profile });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get public profile of a user
// @route   GET /api/users/:id/public-profile
// @access  Private (or Public, but assuming Private for following logic)
const getPublicProfile = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const targetProfile = await UserProfile.findOne({ user: targetUserId }).populate('user', 'name');
        if (!targetProfile) return res.status(404).json({ success: false, message: 'User not found' });

        const uploadedVideos = await Video.find({ uploadedBy: targetUserId, status: 'ready', isActive: true }).sort({ createdAt: -1 });
        
        // Determine if current user follows them
        let isFollowing = false;
        if (req.user) {
            const myProfile = await UserProfile.findOne({ user: req.user._id });
            if (myProfile && myProfile.following && myProfile.following.includes(targetUserId)) {
                isFollowing = true;
            }
        }

        res.json({
            success: true,
            data: {
                _id: targetUserId,
                name: targetProfile.user.name,
                profileImage: targetProfile.profileImage,
                followerCount: targetProfile.followers ? targetProfile.followers.length : 0,
                followingCount: targetProfile.following ? targetProfile.following.length : 0,
                isFollowing,
                videos: uploadedVideos
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Toggle follow a user
// @route   POST /api/users/:id/follow
// @access  Private
const toggleFollow = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        if (targetUserId === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
        }

        const myProfile = await UserProfile.findOne({ user: req.user._id });
        const targetProfile = await UserProfile.findOne({ user: targetUserId });

        if (!myProfile || !targetProfile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        const isFollowing = myProfile.following.includes(targetUserId);

        if (isFollowing) {
            myProfile.following.pull(targetUserId);
            targetProfile.followers.pull(req.user._id);
        } else {
            myProfile.following.push(targetUserId);
            targetProfile.followers.push(req.user._id);
        }

        await myProfile.save();
        await targetProfile.save();

        res.json({ success: true, data: { isFollowing: !isFollowing } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get following list
// @route   GET /api/users/:id/following
// @access  Private
const getFollowing = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const profile = await UserProfile.findOne({ user: targetUserId });

        if (!profile) return res.status(404).json({ success: false, message: 'User not found' });

        const followingIds = profile.following.slice(skip, skip + limit);
        const hasMore = skip + limit < profile.following.length;

        // Fetch their profiles to get avatars
        const followingProfiles = await UserProfile.find({ user: { $in: followingIds } }).populate('user', 'name');
        
        const data = followingProfiles.map(p => ({
            _id: p.user._id,
            name: p.user.name,
            profileImage: p.profileImage
        }));

        res.json({ success: true, data, hasMore });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get followers list
// @route   GET /api/users/:id/followers
// @access  Private
const getFollowers = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const profile = await UserProfile.findOne({ user: targetUserId });

        if (!profile) return res.status(404).json({ success: false, message: 'User not found' });

        const followerIds = profile.followers.slice(skip, skip + limit);
        const hasMore = skip + limit < profile.followers.length;

        // Fetch their profiles to get avatars
        const followerProfiles = await UserProfile.find({ user: { $in: followerIds } }).populate('user', 'name');
        
        const data = followerProfiles.map(p => ({
            _id: p.user._id,
            name: p.user.name,
            profileImage: p.profileImage
        }));

        res.json({ success: true, data, hasMore });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    uploadAvatar,
    getSaved,
    getHistory,
    getProgress,
    getSubscription,
    getPublicProfile,
    toggleFollow,
    getFollowing,
    getFollowers
};
