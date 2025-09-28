import express from "express";
import bodyParser from "body-parser";
import ejsLayouts from "express-ejs-layouts";
import path from "path";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import { connectUsingMongoose } from "./config/mongodb.js";
import router from "./routes/routes.js";
import authrouter from "./routes/authRoutes.js";

dotenv.config(); // Load biến môi trường từ .env
const app = express();

// SESSION
app.use(
    session({
        secret: process.env.SESSION_SECRET || "SecretKey", // đọc từ .env
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    })
);

// MIDDLEWARE
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy({
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL ||
                    "https://nodejs-authentication-system-l2pu.onrender.com/auth/google/callback",
                scope: ["profile", "email"],
            },
            function(accessToken, refreshToken, profile, callback) {
                callback(null, profile);
            }
        )
    );
} else {
    console.warn(
        "⚠️ Google OAuth is disabled (missing GOOGLE_CLIENT_ID/SECRET in .env)"
    );
}

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Template Engine
app.set("view engine", "ejs");
app.use(ejsLayouts);
app.set("views", path.join(path.resolve(), "views"));

// DB Connection
connectUsingMongoose();

// ROUTES
app.get("/", (req, res) => {
    res.send("Hey Ninja ! Go to /user/signin for the login page.");
});
app.use("/user", router);
app.use("/auth", authrouter);
app.use(express.static("public"));

// LISTEN
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});