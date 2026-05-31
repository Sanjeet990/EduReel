const Video = require('../models/videoModel');
const Interaction = require('../models/interactionModel');
const UserProfile = require('../models/userProfileModel');

const normalizeSubject = (value = '') => {
    return String(value)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const getRecommendedFeed = async (userId, page = 1, limit = 20) => {

    console.log('Generating feed for user:', userId, 'page:', page, 'limit:', limit);

    const profile = await UserProfile.findOne({ user: userId });
    if (!profile) return [];

    const userClass = profile.classLevel;
    const userSubjects = profile.subjects || [];
    const normalizedUserSubjects = new Set(userSubjects.map(normalizeSubject).filter(Boolean));
    const watchedVideos = profile.watchedVideos || [];
    const followingList = profile.following ? profile.following.map(id => id.toString()) : [];

    const interactions = await Interaction.find({ user: userId, video: { $in: watchedVideos } });
    const fullyWatchedVideoIds = interactions
        .filter(i => i.completionRate >= 0.5)
        .map(i => i.video.toString());

    const allCandidates = await Video.find({
        status: 'ready',
        isActive: true
    }).populate('uploadedBy', 'name').lean();
    console.log('[feed-debug] profile:', {
        userId: String(userId),
        classLevel: userClass,
        ageGroup: profile.ageGroup || null,
        subjects: userSubjects,
        watchedVideosCount: watchedVideos.length,
        fullyWatchedVideoIdsCount: fullyWatchedVideoIds.length,
        allCandidatesCount: allCandidates.length
    });

    const userAgeGroup = profile.ageGroup || null;

    const getTopClass = (targetClass = []) => {
        if (!Array.isArray(targetClass) || targetClass.length === 0) return null;
        return Math.max(...targetClass);
    };

    const classEligibleCandidates = allCandidates.filter((video) => {
        const topClass = getTopClass(video.targetClass);
        // If class is not tagged on video, keep it as generic content.
        if (topClass === null || userClass === undefined || userClass === null) return true;
        return topClass >= userClass;
    });

    const getBucket = (video) => {
        const normalizedVideoSubject = normalizeSubject(video.subject || '');
        const subjectMatch = normalizedUserSubjects.has(normalizedVideoSubject);
        const includesUserClass = Array.isArray(video.targetClass) && video.targetClass.includes(userClass);
        const topClass = getTopClass(video.targetClass);
        const higherThanUserClass = topClass !== null && topClass > userClass;
        const ageMatch = userAgeGroup && video.targetAgeGroup ? userAgeGroup === video.targetAgeGroup : false;

        // Ordering intent:
        // 1) user class + preferred subjects
        // 2) higher class + preferred subjects
        // 3) user class + any subject
        // 4) higher class + any subject
        // 5) everything else
        if (includesUserClass && subjectMatch && ageMatch) return 0;
        if (includesUserClass && subjectMatch) return 1;
        if (higherThanUserClass && subjectMatch && ageMatch) return 2;
        if (higherThanUserClass && subjectMatch) return 3;
        if (includesUserClass && ageMatch) return 4;
        if (includesUserClass) return 5;
        if (higherThanUserClass && ageMatch) return 6;
        if (higherThanUserClass) return 7;
        return 8;
    };

    const rankedCandidates = classEligibleCandidates
        .map((video) => {
            const alreadyWatched = watchedVideos.some(id => id.toString() === video._id.toString()) ? 1 : 0;
            return {
                ...video,
                bucket: getBucket(video),
                alreadyWatched,
                viewCount: video.viewCount || 0
            };
        })
        .sort((a, b) => {
            if (a.alreadyWatched !== b.alreadyWatched) return a.alreadyWatched - b.alreadyWatched;
            if (a.bucket !== b.bucket) return a.bucket - b.bucket;
            if (a.viewCount !== b.viewCount) return b.viewCount - a.viewCount;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

    const bucketCounts = rankedCandidates.reduce((acc, item) => {
        const key = String(item.bucket);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
    console.log('[feed-debug] bucketCounts:', bucketCounts);
    console.log('[feed-debug] classEligibility:', {
        before: allCandidates.length,
        after: classEligibleCandidates.length
    });

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const finalVideos = rankedCandidates.slice(startIndex, endIndex);
    console.log('[feed-debug] pagination:', {
        startIndex,
        endIndex,
        returnedCount: finalVideos.length
    });
    console.log('[feed-debug] topReturned:', finalVideos.map((v) => ({
        id: v._id,
        title: v.title,
        subject: v.subject,
        targetClass: v.targetClass,
        targetAgeGroup: v.targetAgeGroup,
        viewCount: v.viewCount || 0,
        bucket: v.bucket,
        alreadyWatched: v.alreadyWatched
    })));

    // Enrich with uploader profile image
    const uploaderIds = [...new Set(finalVideos.map(v => v.uploadedBy?._id).filter(Boolean))];
    const uploaderProfiles = await UserProfile.find({ user: { $in: uploaderIds } });
    
    const profileMap = {};
    uploaderProfiles.forEach(p => {
        profileMap[p.user.toString()] = p.profileImage;
    });

    // Fetch interactions for finalVideos to map liked and saved state
    const finalVideoIds = finalVideos.map(v => v._id.toString());
    const finalInteractions = await Interaction.find({
        user: userId,
        video: { $in: finalVideoIds }
    });

    const interactionsMap = {};
    finalInteractions.forEach(interaction => {
        interactionsMap[interaction.video.toString()] = {
            isLiked: interaction.liked || false,
            isSaved: interaction.saved || false
        };
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
        const videoIdStr = v._id.toString();
        const interaction = interactionsMap[videoIdStr] || { isLiked: false, isSaved: false };

        return { 
            ...v, 
            uploader: uploaderInfo,
            isLiked: interaction.isLiked,
            isSaved: interaction.isSaved
        };
    });
};

module.exports = { getRecommendedFeed };
