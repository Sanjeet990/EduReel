const mongoose = require("mongoose");

const planSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        durationDays: { type: Number, required: true },
        features: [String],
        price: { type: Number, required: true },
        numberOfDevices: { type: Number, required: true, default: 1 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);
