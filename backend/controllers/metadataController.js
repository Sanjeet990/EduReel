const Metadata = require('../models/metadataModel');

// @desc    Get metadata (classes & subjects)
// @route   GET /api/metadata
// @access  Public
const getMetadata = async (req, res) => {
    try {
        let metadata = await Metadata.findOne({ isSingleton: true });
        if (!metadata) {
            // Failsafe in case seeding failed
            metadata = { classes: [], subjects: [] };
        }
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
