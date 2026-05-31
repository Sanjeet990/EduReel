const mongoose = require("mongoose");

const deviceSessionSchema = mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        deviceId: { type: String, required: true }, // fingerprint from Android
        deviceName: { type: String },
        jwtToken: { type: String },
        lastSeen: { type: Date },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("DeviceSession", deviceSessionSchema);
