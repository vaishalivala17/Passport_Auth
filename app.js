const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const local = require("passport-local");
const flash = require('connect-flash');
const authRoutes = require("./routes/authRoutes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");
const path = require("path");
const app = express();

// View engine
app.set("view engine", "ejs");

// Body parser
app.use(express.urlencoded({ extended: false }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Express Session
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}));

// Passport config
require("./config/passport")(passport);

app.use(passport.initialize());
app.use(passport.session());

// 2. Flash Configuration
app.use(flash());

// 3. Global Variables Middleware (Optional but recommended)
// This makes "messages" available in all your views automatically
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  next();
});

// Routes
app.use("/", authRoutes);
app.use("/blogs", blogRoutes);

function isAuthenticated (req, res, next) {
  if (req.session.user) next()
  else next('routes')
}
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Bootstrap and jQuery
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use('/jquery', express.static(path.join(__dirname, 'node_modules/jquery/dist')));

// DB
mongoose.connect("mongodb://127.0.0.1:27017/passport_auth");

app.listen(3000, (err) => {
  if(!err){
    console.log("Server running on http://localhost:3000");
  }else{
    console.log("Error..." , err);
  }
});
