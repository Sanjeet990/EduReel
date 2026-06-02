const mongoose = require("mongoose");

const userProfileSchema = mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        ageGroup: { 
            type: String, 
            enum: ['Under 13','13-17','18-22','23+']
        },
        classLevel: { type: Number }, // 6-12 or 0 for college/professional
        subjects: [{ type: String }],
        watchedVideos: [{ type: String, ref: "Video" }],
        xp: { type: Number, default: 0 },
        streakDays: { type: Number, default: 0 },
        lastActiveDate: { type: Date },
        profileImage: { type: String, default: null },
        followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
    },
    { timestamps: true }
);

module.exports = mongoose.model("UserProfile", userProfileSchema);
