const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    otp: String,
    otpExpires: Date,
    isVerified: { type: Boolean, default: false },
    profile: {
        bio: String,
        location: String,
        website: String
    }
});

module.exports = mongoose.model("User", userSchema);
