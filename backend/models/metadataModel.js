const mongoose = require('mongoose');

const metadataSchema = mongoose.Schema({
    isSingleton: { type: Boolean, default: true, unique: true },
    classes: [{
        name: { type: String, required: true },
        value: { type: Number, required: true }
    }],
    subjects: [{
        name: { type: String, required: true },
        icon: { type: String, required: true } // emoji or icon URL
    }]
}, { timestamps: true });

module.exports = mongoose.model('Metadata', metadataSchema);
