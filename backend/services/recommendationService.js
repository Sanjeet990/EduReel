const Video = require('../models/videoModel');
const Interaction = require('../models/interactionModel');
const UserProfile = require('../models/userProfileModel');

const getRecommendedFeed = async (userId, page = 1, limit = 20) => {

    console.log('Generating feed for user:', userId, 'page:', page, 'limit:', limit);

    const profile = await UserProfile.findOne({ user: userId });
    if (!profile) return [];

    const userClass = profile.classLevel;
    const userSubjects = profile.subjects || [];
    const watchedVideos = profile.watchedVideos || [];
    const followingList = profile.following ? profile.following.map(id => id.toString()) : [];

    const interactions = await Interaction.find({ user: userId, video: { $in: watchedVideos } });
    const fullyWatchedVideoIds = interactions
        .filter(i => i.completionRate >= 0.5)
        .map(i => i.video.toString());

    const candidates = await Video.find({
        status: 'ready',
        isActive: true,
        _id: { $nin: fullyWatchedVideoIds }
    }).populate('uploadedBy', 'name').lean();

    const scoredCandidates = candidates.map(video => {
        let score = 0;
        
        const subjectMatch = userSubjects.includes(video.subject) ? 1 : 0;
        const classMatch = (video.targetClass && video.targetClass.includes(userClass)) ? 1 : 0;
        const isUpperClass = (video.targetClass && video.targetClass.includes(userClass + 1));
        
        const daysSinceUpload = (new Date() - new Date(video.createdAt)) / (1000 * 60 * 60 * 24);
        const recencyScore = Math.max(0, 7 - daysSinceUpload);

        // Simple retention boost based on likes for now
        const retentionBoost = (video.viewCount > 0 && (video.likeCount / video.viewCount) > 0.1) ? 2 : 0;

        score = (subjectMatch * 3) + (classMatch * 2) + retentionBoost + recencyScore;
        
        if (isUpperClass && subjectMatch) {
            score += 2.5; 
        }

        const alreadyWatched = watchedVideos.some(id => id.toString() === video._id.toString()) ? 1 : 0;
        score -= (alreadyWatched * 10);

        return { ...video, score };
    });

    scoredCandidates.sort((a, b) => b.score - a.score);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const finalVideos = scoredCandidates.slice(startIndex, endIndex);

    // Enrich with uploader profile image
    const uploaderIds = [...new Set(finalVideos.map(v => v.uploadedBy?._id).filter(Boolean))];
    const uploaderProfiles = await UserProfile.find({ user: { $in: uploaderIds } });
    
    const profileMap = {};
    uploaderProfiles.forEach(p => {
        profileMap[p.user.toString()] = p.profileImage;
    });

    return finalVideos.map(v => {
        let uploaderInfo = null;
        if (v.uploadedBy) {
            uploaderInfo = {
                _id: v.uploadedBy._id,
                name: v.uploadedBy.name,
                avatar: profileMap[v.uploadedBy._id.toString()] || null,
                isFollowing: followingList.includes(v.uploadedBy._id.toString())
            };
        }
        return { ...v, uploader: uploaderInfo };
    });
};

module.exports = { getRecommendedFeed };
