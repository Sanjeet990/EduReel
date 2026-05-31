const Metadata = require('../models/metadataModel');

// @desc    Get metadata (classes & subjects)
// @route   GET /api/metadata
// @access  Public
const getMetadata = async (req, res) => {
    try {
        let metadata = await Metadata.findOne({ isSingleton: true }).lean();
        if (!metadata) {
            // Failsafe in case seeding failed
            metadata = { classes: [], subjects: [] };
        }
        
        // Aggregate video counts per subject
        const Video = require('../models/videoModel');
        const subjectCounts = await Video.aggregate([
            { $match: { status: 'ready', isActive: true } },
            { $group: { _id: "$subject", count: { $sum: 1 } } }
        ]);

        const subjectCountMap = {};
        subjectCounts.forEach(item => {
            if (item._id) subjectCountMap[item._id] = item.count;
        });

        const enrichedSubjects = (metadata.subjects || []).map(sub => {
            const subjectName = sub.name;
            return {
                name: subjectName,
                icon: sub.icon,
                count: subjectCountMap[subjectName] || 0
            };
        });

        // Add the count to the actual subjects array in the response
        metadata.subjects = enrichedSubjects;
        
        // Remove subjectDetails since we can just enrich subjects directly
        // metadata.subjectDetails = enrichedSubjects;

        res.json({ success: true, data: metadata });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update metadata (classes & subjects)
// @route   PUT /api/metadata
// @access  Private/Admin
const updateMetadata = async (req, res) => {
    try {
        const { classes, subjects } = req.body;
        let metadata = await Metadata.findOne({ isSingleton: true });
        
        if (!metadata) {
            metadata = new Metadata({ isSingleton: true });
        }
        
        if (classes) metadata.classes = classes;
        if (subjects) metadata.subjects = subjects;
        
        await metadata.save();
        res.json({ success: true, data: metadata });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getMetadata,
    updateMetadata
};
