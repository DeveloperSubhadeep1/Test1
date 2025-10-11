const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Import Mongoose Models
const User = require('../models/User');
const StoredMovie = require('../models/StoredMovie');
const SupportTicket = require('../models/SupportTicket');
const Favorite = require('../models/Favorite');
const Watchlist = require('../models/Watchlist');

// --- Helper Middleware ---
const getUserId = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ message: 'User ID is required for this action.' });
    }
    req.userId = userId;
    next();
};

const requireAdmin = (req, res, next) => {
    // This middleware relies on getUserId running first to set req.userId
    // The special admin user has a hardcoded ID. In a real app, this would be a role-based system.
    if (req.userId !== 'admin_user') {
        return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }
    next();
};

// --- OTP Store (In-memory, clears on server restart) ---
const otpStore = {};

// --- Nodemailer Setup ---
// IMPORTANT: For this to work with Gmail, you MUST enable 2-Factor Authentication
// on your Google account and then generate an "App Password".
// DO NOT use your regular Gmail password here.
// Store these credentials securely in your .env file on the server.
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: process.env.EMAIL_USER, // e.g., 'cinestream2006@gmail.com'
        pass: process.env.EMAIL_PASS, // The 16-character App Password from Google
    },
    // Add timeouts to prevent the request from hanging indefinitely on auth failure
    connectionTimeout: 10000, // 10 seconds
    socketTimeout: 10000,     // 10 seconds
});


// --- Auth Routes ---
router.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Special admin case
        if (username === 'admin' && password === 'devils2@2006') {
            return res.json({ _id: 'admin_user', username: 'admin', avatarId: 'avatar4' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }
        
        // In a real app, use bcrypt.compare(password, user.password)
        if (password !== user.password) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }
        
        const { password: _, ...userProfile } = user.toObject();
        res.json(userProfile);
    } catch (error) {
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// Step 1 of Signup - Send OTP
router.post('/auth/send-otp', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(409).json({ message: 'Username or email already exists.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

        otpStore[username] = { otp, email, password, expiry };
        
        await transporter.sendMail({
            from: `"CineStream" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your CineStream Verification Code',
            html: `
                <div style="font-family: sans-serif; text-align: center; padding: 20px; color: #333;">
                    <h2 style="color: #0D1117;">Welcome to CineStream!</h2>
                    <p>Your verification code is:</p>
                    <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background: #f0f0f0; padding: 10px 20px; border-radius: 5px; display: inline-block;">${otp}</p>
                    <p>This code will expire in 10 minutes.</p>
                </div>
            `,
        });

        res.status(200).json({ message: 'OTP sent successfully. Please check your email.' });

    } catch (error) {
        console.error('Error sending OTP:', error);
        // Provide more specific feedback for common SMTP issues.
        if (error.code === 'EAUTH' || error.responseCode === 535) {
            return res.status(500).json({ message: 'Email server authentication failed. Please check credentials in the backend environment.' });
        }
        if (error.code === 'ETIMEDOUT' || error.command === 'CONN') {
            return res.status(500).json({ message: 'Connection to email server timed out. This may be due to a security block from your email provider. Please check the troubleshooting steps in the deployment guide.' });
        }
        res.status(500).json({ message: 'Server error while sending OTP.' });
    }
});


// Step 2 of Signup - Verify OTP and Create User
router.post('/auth/signup', async (req, res) => {
    try {
        const { username, otp } = req.body;
        const storedData = otpStore[username];

        if (!storedData) {
            return res.status(400).json({ message: 'Invalid request. Please start the signup process again.' });
        }
        
        if (Date.now() > storedData.expiry) {
            delete otpStore[username];
            return res.status(400).json({ message: 'OTP has expired. Please try again.' });
        }

        if (otp !== storedData.otp) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }
        
        const { email, password } = storedData;
        
        // In a real app, hash the password: const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password /*: hashedPassword*/, avatarId: 'avatar1' });
        await newUser.save();
        
        delete otpStore[username];

        const { password: _, ...userProfile } = newUser.toObject();
        res.status(201).json(userProfile);
    } catch (error) {
        if (error.code === 11000) {
             return res.status(409).json({ message: 'Username or email already exists.' });
        }
        console.error('Error during signup:', error);
        res.status(500).json({ message: 'Server error during signup.' });
    }
});


// --- User Routes ---
router.patch('/users/:id', getUserId, async (req, res) => {
    // Ensure a user can only update their own profile
    if (req.params.id !== req.userId) {
        return res.status(403).json({ message: 'Forbidden: You can only update your own profile.' });
    }
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        const { password, ...userProfile } = updatedUser.toObject();
        res.json(userProfile);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user profile.' });
    }
});

// --- User Management (Admin) ---
router.get('/users', getUserId, requireAdmin, async (req, res) => {
    try {
        // Fetch all users, excluding the admin and passwords
        const users = await User.find({ username: { $ne: 'admin' } }, '-password').lean();

        // For each user, get their favorites and watchlist counts
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const favoritesCount = await Favorite.countDocuments({ userId: user._id.toString() });
            const watchlistCount = await Watchlist.countDocuments({ userId: user._id.toString() });
            return {
                ...user,
                favoritesCount,
                watchlistCount,
            };
        }));
        
        res.json(usersWithStats);
    } catch (error) {
        console.error('Error fetching users for admin:', error);
        res.status(500).json({ message: 'Server error fetching user data.' });
    }
});


// --- Admin / Stored Content Routes ---
router.get('/stored-movies', getUserId, requireAdmin, async (req, res) => res.json(await StoredMovie.find({})));
router.get('/stored-movies/find', async (req, res) => {
    const { tmdbId, type } = req.query;
    res.json(await StoredMovie.findOne({ tmdb_id: tmdbId, type: type }));
});
router.post('/stored-movies', getUserId, requireAdmin, async (req, res) => {
    try {
        const newMovie = new StoredMovie(req.body);
        await newMovie.save();
        res.status(201).json(newMovie);
    } catch (error) {
        // Handle unique constraint error
        if (error.code === 11000) {
            return res.status(409).json({ message: 'This movie/TV show already has links stored.' });
        }
        res.status(500).json({ message: 'Failed to add movie.' });
    }
});
router.patch('/stored-movies/:id', getUserId, requireAdmin, async (req, res) => {
    try {
        const { download_links } = req.body;
        const updatedMovie = await StoredMovie.findByIdAndUpdate(
            req.params.id,
            { download_links },
            { new: true, runValidators: true }
        );
        if (!updatedMovie) {
            return res.status(404).json({ message: 'Movie not found.' });
        }
        res.json(updatedMovie);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update movie.' });
    }
});
router.delete('/stored-movies/:id', getUserId, requireAdmin, async (req, res) => {
    await StoredMovie.findByIdAndDelete(req.params.id);
    res.status(204).send();
});
router.patch('/stored-movies/:id/increment', async (req, res) => {
    await StoredMovie.findByIdAndUpdate(req.params.id, { $inc: { download_count: 1 } });
    res.status(204).send();
});


// --- Support Tickets ---
router.get('/support-tickets', getUserId, requireAdmin, async (req, res) => res.json(await SupportTicket.find({}).sort({ timestamp: -1 })));
router.post('/support-tickets', async (req, res) => {
    const newTicket = new SupportTicket({ ...req.body, timestamp: new Date() });
    await newTicket.save();
    res.status(201).json(newTicket);
});
router.delete('/support-tickets/:id', getUserId, requireAdmin, async (req, res) => {
    await SupportTicket.findByIdAndDelete(req.params.id);
    res.status(204).send();
});


// --- Metrics ---
router.get('/metrics', getUserId, requireAdmin, async (req, res) => {
    const movies = await StoredMovie.find({});
    const ticketsCount = await SupportTicket.countDocuments();
    const usersCount = await User.countDocuments({ username: { $ne: 'admin' } });
    const totalLinks = movies.reduce((sum, movie) => sum + movie.download_links.length, 0);
    const totalDownloads = movies.reduce((sum, movie) => sum + movie.download_count, 0);
    res.json({ totalLinks, totalDownloads, totalSupportTickets: ticketsCount, totalUsers: usersCount });
});


// --- User-specific lists (Favorites & Watchlist) ---

// Favorites
router.get('/favorites', getUserId, async (req, res) => res.json(await Favorite.find({ userId: req.userId })));
router.post('/favorites', getUserId, async (req, res) => {
    const newFavorite = new Favorite({ ...req.body, userId: req.userId, dateAdded: new Date() });
    await newFavorite.save();
    res.status(201).json(newFavorite);
});
router.delete('/favorites/:id', getUserId, async (req, res) => {
    const fav = await Favorite.findById(req.params.id);
    if (fav && fav.userId === req.userId) {
        await Favorite.findByIdAndDelete(req.params.id);
        return res.status(204).send();
    }
    res.status(404).json({ message: 'Favorite item not found or you do not have permission to delete it.' });
});

// Watchlist
router.get('/watchlist', getUserId, async (req, res) => res.json(await Watchlist.find({ userId: req.userId })));
router.post('/watchlist', getUserId, async (req, res) => {
    const newWatchlistItem = new Watchlist({ ...req.body, userId: req.userId, dateAdded: new Date() });
    await newWatchlistItem.save();
    res.status(201).json(newWatchlistItem);
});
router.delete('/watchlist/:id', getUserId, async (req, res) => {
    const item = await Watchlist.findById(req.params.id);
    if (item && item.userId === req.userId) {
        await Watchlist.findByIdAndDelete(req.params.id);
        return res.status(204).send();
    }
    res.status(404).json({ message: 'Watchlist item not found or you do not have permission to delete it.' });
});


module.exports = router;