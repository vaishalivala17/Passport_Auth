const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require("../../models/User");
const Blog = require("../../models/Blog");
const isAuth = require("../../middleware/isAuth");
const otpGenerator = require('otp-generate');
const nodemailer = require('nodemailer');

const router = express.Router();

// Landing page
router.get("/", (req, res) => {
    res.render("landing");
});

// Register page
router.get("/register", (req, res) => {
    res.render("pages/register");
});

// Register user
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Normalize email to lowercase
        const normalizedEmail = email.toLowerCase();

        // Check if user already exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            req.flash('error', 'Email already registered. Please use a different email or log in.');
            return res.redirect("/register");
        }

        const hash = await bcrypt.hash(password, 10);
        // const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
        const otpExpires = new Date(Date.now() + 10 * 60 * 100); // 1 minutes

        await User.create({ name, email: normalizedEmail, password: hash, otp, otpExpires });

        // Send OTP via email
        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: 'vaishaliivala1703@gmail.com',
                pass: 'mgxwcpqenzxkvchc'
            }
        });

        const mailOptions = {
            from: 'vaishalivala1703@gmail.com',
            to: email,
            subject: 'OTP for Blog App Registration',
            text: `Your OTP is: ${otp}`
        };

        await transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + `${otp}`);
            }
        });

        req.flash('success', 'Registration successful! Please check your email for OTP.');
        res.redirect("/verify-otp");
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred during registration. Please try again.');
        res.redirect("/register");
    }
});

// Login page
router.get("/login", (req, res) => {
    res.render("pages/login");
});

// Login user
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !user.isVerified) {
            req.flash('error', 'Please verify your email first.');
            return res.redirect("/login");
        }

        passport.authenticate("local", {
            successRedirect: "/dashboard",
            failureRedirect: "/login"
        })(req, res);
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred during login. Please try again.');
        res.redirect("/login");
    }
});

// Dashboard (protected)
router.get("/dashboard", isAuth, async (req, res) => {
    try {
        const blogs = await Blog.find({ author: req.user._id }).sort({ createdAt: -1 });
        res.render("dashboard", { user: req.user, blogs });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading blogs');
        res.render("dashboard", { user: req.user, blogs: [] });
    }
});

// Verify OTP page
router.get("/verify-otp", (req, res) => {
    res.render("pages/verify-otp");
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || user.otp !== otp || user.otpExpires < new Date()) {
            req.flash('error', 'Invalid or expired OTP.');
            return res.redirect("/verify-otp");
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        req.flash('success', 'Email verified successfully! You can now log in.');
        res.redirect("/login");
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred during OTP verification. Please try again.');
        res.redirect("/verify-otp");
    }
});

// Profile page
router.get("/profile", isAuth, (req, res) => {
    res.render("profile", { user: req.user });
});

// Update profile
router.post("/profile", isAuth, async (req, res) => {
    try {
        const { bio, location, website } = req.body;
        req.user.profile = { bio, location, website };
        await req.user.save();
        req.flash('success', 'Profile updated successfully!');
        res.redirect("/profile");
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error updating profile');
        res.redirect("/profile");
    }
});

// Logout
router.get("/logout", (req, res, next) => {
    req.logout(function (err) {
        if (err) return next(err);
        res.redirect("/login");
    });
});

module.exports = router;
