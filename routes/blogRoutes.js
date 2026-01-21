const express = require("express");
const Blog = require("../models/Blog");
const User = require("../models/User");
const isAuth = require("../middleware/isAuth");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Multer configuration for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Create blog post with image
router.post("/", isAuth, upload.single('image'), async (req, res) => {
    try {
        const { content } = req.body;
        const image = req.file ? req.file.filename : null;
        const blog = new Blog({
            content,
            image,
            author: req.user._id
        });
        await blog.save();
        req.flash('success', 'Blog post created successfully!');
        res.redirect("/dashboard");
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error creating blog post');
        res.redirect("/dashboard");
    }
});

// Get all blogs with pagination
router.get("/", isAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const blogs = await Blog.find().populate('author', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit);
        const totalBlogs = await Blog.countDocuments();
        const totalPages = Math.ceil(totalBlogs / limit);

        res.render("blogs", { blogs, currentPage: page, totalPages });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error fetching blogs');
        res.redirect("/dashboard");
    }
});

module.exports = router;
