const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
    {
        name: { type: String, required: [true, "Please add a name"] },
        email: { type: String, required: [true, "Please add an email"], unique: true },
        password: { type: String, required: [true, "Please add a password"] },
        isAdmin: { type: Boolean, required: true, default: false },
        trialActive: { type: Boolean, default: true },
        trialExpires: {
            type: Date,
            default: () => new Date(+new Date() + 3 * 24 * 60 * 60 * 1000),
        },
        plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },
        planExpires: { type: Date },
        allowedDevices: { type: Number, default: 2 },
    },
    { timestamps: true }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
