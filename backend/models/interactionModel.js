const mongoose = require("mongoose");

const interactionSchema = mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        video: { type: String, ref: "Video", required: true },
        liked: { type: Boolean, default: false },
        saved: { type: Boolean, default: false },
        watchedSeconds: { type: Number, default: 0 },
        completionRate: { type: Number, default: 0 }, // 0.0 - 1.0
    },
    { timestamps: true }
);

interactionSchema.index({ user: 1, video: 1 }, { unique: true });

module.exports = mongoose.model("Interaction", interactionSchema);
