const mongoose = require('mongoose');

const videoViewSchema = mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        video: { type: String, ref: 'Video', required: true },
        subject: { type: String, default: '' },
        viewedAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

videoViewSchema.index({ user: 1, video: 1, viewedAt: -1 });
videoViewSchema.index({ viewedAt: 1 });
videoViewSchema.index({ subject: 1 });

module.exports = mongoose.model('VideoView', videoViewSchema);
