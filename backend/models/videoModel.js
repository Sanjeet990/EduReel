const mongoose = require("mongoose");

const videoSchema = mongoose.Schema(
    {
        _id: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String },
        subject: { 
            type: String, 
            enum: ['Science','Maths','History','Geography','Coding','English','GK','Chemistry','Civics','Art','Physics','Biology','Economics']
        },
        targetClass: [{ type: Number }], // e.g. [9, 10] means visible to class 9 and 10
        targetAgeGroup: { 
            type: String, 
            enum: ['Under 13','13-17','18-22','23+']
        },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: { 
            type: String, 
            enum: ['processing','ready','failed'], 
            default: 'processing' 
        },
        durationSeconds: { type: Number },
        thumbnailUrl: { type: String },
        hlsUrl: { type: String },
        resolutions: [{ 
            label: String, 
            playlistUrl: String 
        }],
        rawFilePath: { type: String },
        tags: [{ type: String }],
        viewCount: { type: Number, default: 0 },
        likeCount: { type: Number, default: 0 },
        commentCount: { type: Number, default: 0 },
        shareCount: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Video", videoSchema);
