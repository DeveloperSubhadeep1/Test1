const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Import Mongoose Models
const User = require('../models/User');
const StoredMovie = require('../models/StoredMovie');
const SupportTicket = require('../models/SupportTicket');
const Collection = require('../models/Collection');
const History = require('../models/History');
const Favorite = require('../models/Favorite');
const Watchlist = require('../models/Watchlist');


// --- Helper Middleware ---
const getUserId = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ message: 'User ID is required for this action.' });
        }

        // The admin user is a special case and doesn't exist in the DB.
        if (userId !== 'admin_user') {
            const user = await User.findById(userId);
            if (!user) {
                // This is the likely source of the 404 error.
                // It happens if the client has a session with a user ID that no longer exists in the database.
                return res.status(404).json({ message: 'User not found. Your session may be invalid. Please log out and log back in.' });
            }
        }
        
        req.userId = userId;
        next();
    } catch (error) {
        // Mongoose findById throws a CastError for invalid ObjectId format
        if (error.name === 'CastError') {
             return res.status(400).json({ message: 'Invalid User ID format.' });
        }
        console.error("Error in getUserId middleware:", error);
        return res.status(500).json({ message: "Server error during user validation." });
    }
};

const requireAdmin = (req, res, next) => {
    // This middleware relies on getUserId running first to set req.userId
    // The special admin user has a hardcoded ID. In a real app, this would be a role-based system.
    if (req.userId !== 'admin_user') {
        return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }
    next();
};

// --- Rate Limiting (In-memory) ---
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 5;
const rateLimitStore = {}; // { ip: [timestamp1, timestamp2, ...] }

const rateLimiter = (req, res, next) => {
    const ip = req.ip; // Relies on `app.set('trust proxy', 1)` in server.js
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    // Get recent requests for this IP, filtering out old ones
    const userRequests = (rateLimitStore[ip] || []).filter(ts => ts > windowStart);

    if (userRequests.length >= MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }

    // Add the current request timestamp and proceed
    rateLimitStore[ip] = [...userRequests, now];
    next();
};

// Periodically clean up the rate limit store to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    for (const ip in rateLimitStore) {
        const recentRequests = rateLimitStore[ip].filter(ts => ts > windowStart);
        if (recentRequests.length > 0) {
            rateLimitStore[ip] = recentRequests;
        } else {
            delete rateLimitStore[ip];
        }
    }
}, 30 * 60 * 1000); // Clean up every 30 minutes


// --- OTP Generation and Storage ---
// Structure: { key: { otp, expiry, type, ...data } }
// e.g., 'testuser': { otp: '123', expiry: ..., type: 'signup', email: '...', password: '...' }
// e.g., 'test@test.com': { otp: '456', expiry: ..., type: 'reset' }
const otpStore = {};
const OTP_EXPIRY_DURATION = 60 * 60 * 1000; // 1 hour

// Generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Periodically clean up expired OTPs to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const key in otpStore) {
        if (otpStore[key].expiry < now) {
            delete otpStore[key];
        }
    }
}, 10 * 60 * 1000); // Clean up every 10 minutes

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


// --- Notifications ---
router.get('/notifications', async (req, res) => {
    try {
        const recentMovies = await StoredMovie.find({})
            .sort({ _id: -1 }) // Sort by ObjectId descending (approximates creation time)
            .limit(10)
            .select('_id title type tmdb_id') // Select only necessary fields
            .lean(); // Use lean for performance
        res.json(recentMovies);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error fetching notifications.' });
    }
});


// --- Auth Routes ---
router.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Special admin case
        if (username === 'admin' && password === (process.env.ADMIN_PASS || 'devils2@2006')) {
            return res.json({ _id: 'admin_user', username: 'admin', avatar: 'avatar4' });
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

// Step 1 of Signup - Send OTP (Rate Limited)
router.post('/auth/send-otp', rateLimiter, async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(409).json({ message: 'Username or email already exists.' });
        }

        const otp = generateOTP();
        const expiry = Date.now() + OTP_EXPIRY_DURATION;

        otpStore[username] = { otp, email, password, expiry, type: 'signup' };
        
        await transporter.sendMail({
            from: `"CineStream" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your CineStream Verification Code',
            html: `
                <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; overflow: hidden;">
                    <div style="background-color: #0D1117; color: #ffffff; padding: 24px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Welcome to CineStream!</h1>
                        <p style="margin: 8px 0 0; font-size: 16px;">Your adventure into movies & TV starts now.</p>
                    </div>
                    <div style="padding: 32px; text-align: center; background-color: #f6f8fa;">
                        <p style="font-size: 18px; color: #1f2328;">Here is your verification code:</p>
                        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ffffff; background-color: #58A6FF; padding: 16px 24px; border-radius: 8px; display: inline-block; margin: 16px 0;">
                            ${otp}
                        </div>
                        <p style="font-size: 14px; color: #57606a;">This code is your key to unlock a universe of entertainment. It will expire in 1 hour.</p>
                    </div>
                    <div style="background-color: #161B22; color: #8B949E; padding: 16px; text-align: center; font-size: 12px;">
                        <p>If you did not request this code, you can safely ignore this email.</p>
                        <p>&copy; ${new Date().getFullYear()} CineStream. All Rights Reserved.</p>
                    </div>
                </div>
            `,
        });

        res.status(200).json({ message: 'OTP sent successfully. Please check your email.' });

    } catch (error) {
        console.error('Error sending OTP:', error);
        let message = 'Server error while sending OTP.';
        if (error.code === 'EAUTH' || error.responseCode === 535) {
            message = 'Email service authentication failed. The server is misconfigured. Please contact the site administrator.';
        } else if (error.code === 'ETIMEDOUT') {
            message = 'Connection to email service timed out. Please try again later.';
        }
        res.status(500).json({ message });
    }
});


// Step 2 of Signup - Verify OTP and Create User
router.post('/auth/signup', async (req, res) => {
    try {
        const { username, otp } = req.body;
        const storedData = otpStore[username];

        if (!storedData || storedData.type !== 'signup') {
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
        const newUser = new User({ username, email, password /*: hashedPassword*/, avatar: 'avatar1' });
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

// Step 1 of Password Reset - Send Reset OTP (Rate Limited)
router.post('/auth/send-reset-otp', rateLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email address is required.' });
        }

        const user = await User.findOne({ email });
        // To prevent user enumeration, always send a generic success message.
        if (user) {
            const otp = generateOTP();
            const expiry = Date.now() + OTP_EXPIRY_DURATION;
            
            otpStore[email] = { otp, expiry, type: 'reset' };

            await transporter.sendMail({
                from: `"CineStream" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Your CineStream Password Reset Code',
                html: `
                    <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; overflow: hidden;">
                        <div style="background-color: #0D1117; color: #ffffff; padding: 24px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Password Reset Request</h1>
                            <p style="margin: 8px 0 0; font-size: 16px;">We're here to help you get back into your account.</p>
                        </div>
                        <div style="padding: 32px; text-align: center; background-color: #f6f8fa;">
                            <p style="font-size: 18px; color: #1f2328;">Use the following code to reset your password:</p>
                            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ffffff; background-color: #FF2E63; padding: 16px 24px; border-radius: 8px; display: inline-block; margin: 16px 0;">
                                ${otp}
                            </div>
                            <p style="font-size: 14px; color: #57606a;">This code is valid for 1 hour. Please use it promptly to secure your account.</p>
                        </div>
                        <div style="background-color: #161B22; color: #8B949E; padding: 16px; text-align: center; font-size: 12px;">
                            <p>If you did not request a password reset, please disregard this email. Your account is safe.</p>
                            <p>&copy; ${new Date().getFullYear()} CineStream. All Rights Reserved.</p>
                        </div>
                    </div>
                `,
            });
        }
        
        res.status(200).json({ message: 'If an account with this email exists, a password reset code has been sent.' });

    } catch (error) {
        console.error('Error sending password reset OTP:', error);
        let message = 'Server error while sending password reset code.';
        if (error.code === 'EAUTH' || error.responseCode === 535) {
            message = 'Email service authentication failed. The server is misconfigured. Please contact the site administrator.';
        } else if (error.code === 'ETIMEDOUT') {
            message = 'Connection to email service timed out. Please try again later.';
        }
        res.status(500).json({ message });
    }
});

// Step 2 of Password Reset - Verify OTP and update password
router.post('/auth/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        const storedData = otpStore[email];

        if (!storedData || storedData.type !== 'reset') {
            return res.status(400).json({ message: 'Invalid request or no active password reset for this email.' });
        }

        if (Date.now() > storedData.expiry) {
            delete otpStore[email];
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        if (otp !== storedData.otp) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // In a real app, hash this password
        user.password = newPassword;
        await user.save();
        
        delete otpStore[email];

        res.status(200).json({ message: 'Password has been reset successfully. Please log in.' });

    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Server error during password reset.' });
    }
});

// --- Admin Diagnostics ---
router.post('/admin/test-email', getUserId, requireAdmin, async (req, res) => {
    try {
        await transporter.verify(); // First, verify connection config
        const info = await transporter.sendMail({
            from: `"CineStream Diagnostics" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: 'CineStream Email Test Successful ✔',
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Email Configuration Test</h2>
                    <p>This is an automated test email from your CineStream application.</p>
                    <p>If you received this, your email service is configured correctly!</p>
                    <p style="color: #888;">Timestamp: ${new Date().toISOString()}</p>
                </div>
            `,
        });

        console.log('Test email sent: %s', info.messageId);
        res.status(200).json({ success: true, message: `Successfully sent test email to ${process.env.EMAIL_USER}. Message ID: ${info.messageId}` });

    } catch (error) {
        console.error('Email diagnostic test failed:', error);
        
        let errorMessage = `Failed to send test email. Error: ${error.message}. Code: ${error.code || 'N/A'}. Command: ${error.command || 'N/A'}.`;
        
        // Add specific troubleshooting advice for common errors
        if (error.code === 'ETIMEDOUT') {
            errorMessage += `\n\nTROUBLESHOOTING:\nThis is a connection timeout error. It usually means the server couldn't reach Google's mail server. Please check the following:\n1.  **Google Security Alert:** Check the inbox of your EMAIL_USER (${process.env.EMAIL_USER}) for a "Security alert" email from Google. You may need to approve the sign-in attempt from the new server location (Render).\n2.  **Firewall:** Ensure your hosting provider (Render) allows outbound connections on port 465. (This is usually not an issue).\n3.  **Wait and Retry:** Sometimes, this is a temporary network issue. Please wait a minute and try again.`;
        } else if (error.code === 'EAUTH' || (error.responseCode === 535)) {
             errorMessage += `\n\nTROUBLESHOOTING:\nThis is an authentication error. Please check your email credentials:\n1.  **Correct App Password:** Make sure your EMAIL_PASS is the 16-character "App Password" generated from your Google Account, NOT your regular Gmail password.\n2.  **No Spaces:** Ensure the App Password was copied without any spaces.\n3.  **2-Step Verification:** "App Passwords" can only be used if 2-Step Verification is enabled on your Google Account.`;
        }

        res.status(500).json({ success: false, message: errorMessage });
    }
});

// --- User Management ---
router.patch('/users/profile', getUserId, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const { customName, dob, gender } = req.body;
        if (customName !== undefined) user.customName = customName;
        if (dob !== undefined) user.dob = dob;
        if (gender !== undefined) user.gender = gender;
        
        await user.save();
        const { password, ...userProfile } = user.toObject();
        res.json(userProfile);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Server error updating profile.' });
    }
});

router.get('/users', getUserId, requireAdmin, async (req, res) => {
    try {
        const users = await User.aggregate([
            { $match: { username: { $ne: 'admin' } } },
            { $project: { password: 0, __v: 0 } },
            {
                $lookup: {
                    from: 'favorites',
                    let: { userIdString: { $toString: '$_id' } },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$userId', '$$userIdString'] } } },
                        { $count: 'count' }
                    ],
                    as: 'favorites',
                },
            },
            {
                $lookup: {
                    from: 'watchlists',
                    let: { userIdString: { $toString: '$_id' } },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$userId', '$$userIdString'] } } },
                        { $count: 'count' }
                    ],
                    as: 'watchlist',
                },
            },
            {
                $addFields: {
                    favoritesCount: { $ifNull: [{ $arrayElemAt: ['$favorites.count', 0] }, 0] },
                    watchlistCount: { $ifNull: [{ $arrayElemAt: ['$watchlist.count', 0] }, 0] },
                },
            },
            { $project: { favorites: 0, watchlist: 0 } }
        ]);
        res.json(users);
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
    // Also add to user history if a user is logged in
    const userId = req.headers['x-user-id'];
    if (userId) {
        try {
            const movie = await StoredMovie.findById(req.params.id);
            if (movie) {
                 // Use updateOne with upsert to avoid creating duplicates
                await History.updateOne(
                    { userId, id: movie.tmdb_id },
                    { 
                        $set: {
                            ...movie.toObject(),
                            userId: userId,
                            id: movie.tmdb_id,
                            viewedAt: new Date()
                        },
                    },
                    { upsert: true }
                );
            }
        } catch (histError) {
            console.error("Could not update history on download increment", histError);
        }
    }
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
    const collectionsCount = await Collection.countDocuments();
    const totalLinks = movies.reduce((sum, movie) => sum + movie.download_links.length, 0);
    const totalDownloads = movies.reduce((sum, movie) => sum + movie.download_count, 0);
    res.json({ totalLinks, totalDownloads, totalSupportTickets: ticketsCount, totalUsers: usersCount, totalCollections: collectionsCount });
});


// --- User-specific lists (Favorites, Watchlist, History) ---
// Favorites
router.get('/favorites', getUserId, async (req, res) => res.json(await Favorite.find({ userId: req.userId }).sort({ dateAdded: -1 })));
router.post('/favorites', getUserId, async (req, res) => {
    const newItem = new Favorite({ ...req.body, userId: req.userId });
    await newItem.save();
    res.status(201).json(newItem);
});
router.delete('/favorites/:tmdbId', getUserId, async (req, res) => {
    await Favorite.deleteOne({ userId: req.userId, id: req.params.tmdbId });
    res.status(204).send();
});

// Watchlist
router.get('/watchlist', getUserId, async (req, res) => res.json(await Watchlist.find({ userId: req.userId }).sort({ dateAdded: -1 })));
router.post('/watchlist', getUserId, async (req, res) => {
    const newItem = new Watchlist({ ...req.body, userId: req.userId });
    await newItem.save();
    res.status(201).json(newItem);
});
router.delete('/watchlist/:tmdbId', getUserId, async (req, res) => {
    await Watchlist.deleteOne({ userId: req.userId, id: req.params.tmdbId });
    res.status(204).send();
});


// History
router.get('/history', getUserId, async (req, res) => res.json(await History.find({ userId: req.userId }).sort({ viewedAt: -1 })));
router.post('/history', getUserId, async (req, res) => {
    // Use updateOne with upsert to either create a new history item or update the timestamp of an existing one.
    // This prevents the history from being cluttered with duplicate entries for the same item.
    const item = { ...req.body, userId: req.userId };
    const updatedHistoryItem = await History.findOneAndUpdate(
        { userId: req.userId, id: item.id },
        { ...item, viewedAt: new Date() },
        { new: true, upsert: true }
    );
    res.status(201).json(updatedHistoryItem);
});
router.delete('/history', getUserId, async (req, res) => {
    await History.deleteMany({ userId: req.userId });
    res.status(204).send();
});


// --- Collections ---
// Create a new collection
router.post('/collections', getUserId, async (req, res) => {
    try {
        const { name, description, isPublic } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Collection name is required.' });
        }
        const newCollection = new Collection({
            userId: req.userId,
            name,
            description,
            isPublic,
            items: [],
        });
        await newCollection.save();
        res.status(201).json(newCollection);
    } catch (error) {
        res.status(500).json({ message: 'Server error creating collection.' });
    }
});

// Get all collections for the logged-in user
router.get('/collections/user', getUserId, async (req, res) => {
    try {
        const collections = await Collection.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(collections);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching collections.' });
    }
});

// Get a single collection's details
router.get('/collections/:id', async (req, res) => {
    try {
        const collection = await Collection.findById(req.params.id);
        if (!collection) {
            return res.status(404).json({ message: 'Collection not found.' });
        }
        // Allow access if it's public, or if a user is making the request and they are the owner
        const userId = req.headers['x-user-id'];
        if (collection.isPublic || (userId && collection.userId === userId)) {
            return res.json(collection);
        }
        return res.status(403).json({ message: 'This collection is private.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching collection details.' });
    }
});

// Update a collection
router.patch('/collections/:id', getUserId, async (req, res) => {
    try {
        const collection = await Collection.findById(req.params.id);
        if (!collection || collection.userId !== req.userId) {
            return res.status(404).json({ message: 'Collection not found or you do not have permission to edit it.' });
        }
        const { name, description, isPublic } = req.body;
        if (name) collection.name = name;
        if (description !== undefined) collection.description = description;
        if (isPublic !== undefined) collection.isPublic = isPublic;
        await collection.save();
        res.json(collection);
    } catch (error) {
        res.status(500).json({ message: 'Server error updating collection.' });
    }
});

// Delete a collection
router.delete('/collections/:id', getUserId, async (req, res) => {
    try {
        const collection = await Collection.findOne({ _id: req.params.id, userId: req.userId });
        if (!collection) {
             return res.status(404).json({ message: 'Collection not found or you do not have permission to delete it.' });
        }
        await Collection.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (error) {
         res.status(500).json({ message: 'Server error deleting collection.' });
    }
});

// Add an item to a collection
router.post('/collections/:id/items', getUserId, async (req, res) => {
    try {
        const collection = await Collection.findById(req.params.id);
        if (!collection || collection.userId !== req.userId) {
            return res.status(404).json({ message: 'Collection not found or you do not have permission to edit it.' });
        }
        
        const newItem = req.body;
        // Check if item already exists
        const itemExists = collection.items.some(item => item.id === newItem.id);
        if (itemExists) {
            return res.status(409).json({ message: 'This item is already in the collection.' });
        }
        
        collection.items.push(newItem);
        await collection.save();
        res.json(collection);
    } catch (error) {
        res.status(500).json({ message: 'Server error adding item to collection.' });
    }
});

// Remove an item from a collection
router.delete('/collections/:id/items/:tmdbId', getUserId, async (req, res) => {
    try {
        const collection = await Collection.findById(req.params.id);
        if (!collection || collection.userId !== req.userId) {
            return res.status(404).json({ message: 'Collection not found or you do not have permission to edit it.' });
        }
        
        collection.items = collection.items.filter(item => item.id !== parseInt(req.params.tmdbId, 10));
        await collection.save();
        res.json(collection);
    } catch (error) {
        res.status(500).json({ message: 'Server error removing item from collection.' });
    }
});

module.exports = router;