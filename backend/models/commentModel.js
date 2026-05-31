const mongoose = require("mongoose");

const commentSchema = mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        video: { type: String, required: true },
        text: { type: String, required: true },
        likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
