const express = require('express');
const router = express.Router();

// Import Mongoose Models
const User = require('../models/User');
const StoredMovie = require('../models/StoredMovie');
const SupportTicket = require('../models/SupportTicket');
const Favorite = require('../models/Favorite');
const Watchlist = require('../models/Watchlist');

// --- Helper Middleware to get User ID ---
// This makes sure user-specific requests have the necessary ID from the header.
const getUserId = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ message: 'User ID is required for this action.' });
    }
    req.userId = userId;
    next();
};

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

router.post('/auth/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists.' });
        }
        
        // In a real app, hash the password: const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password /*: hashedPassword*/, avatarId: 'avatar1' });
        await newUser.save();

        const { password: _, ...userProfile } = newUser.toObject();
        res.status(201).json(userProfile);
    } catch (error) {
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


// --- Admin / Stored Content Routes ---
router.get('/stored-movies', async (req, res) => res.json(await StoredMovie.find({})));
router.get('/stored-movies/find', async (req, res) => {
    const { tmdbId, type } = req.query;
    res.json(await StoredMovie.findOne({ tmdb_id: tmdbId, type: type }));
});
router.post('/stored-movies', async (req, res) => {
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
router.patch('/stored-movies/:id', async (req, res) => {
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
router.delete('/stored-movies/:id', async (req, res) => {
    await StoredMovie.findByIdAndDelete(req.params.id);
    res.status(204).send();
});
router.patch('/stored-movies/:id/increment', async (req, res) => {
    await StoredMovie.findByIdAndUpdate(req.params.id, { $inc: { download_count: 1 } });
    res.status(204).send();
});


// --- Support Tickets ---
router.get('/support-tickets', async (req, res) => res.json(await SupportTicket.find({}).sort({ timestamp: -1 })));
router.post('/support-tickets', async (req, res) => {
    const newTicket = new SupportTicket({ ...req.body, timestamp: new Date() });
    await newTicket.save();
    res.status(201).json(newTicket);
});
router.delete('/support-tickets/:id', async (req, res) => {
    await SupportTicket.findByIdAndDelete(req.params.id);
    res.status(204).send();
});


// --- Metrics ---
router.get('/metrics', async (req, res) => {
    const movies = await StoredMovie.find({});
    const ticketsCount = await SupportTicket.countDocuments();
    const totalLinks = movies.reduce((sum, movie) => sum + movie.download_links.length, 0);
    const totalDownloads = movies.reduce((sum, movie) => sum + movie.download_count, 0);
    res.json({ totalLinks, totalDownloads, totalSupportTickets: ticketsCount });
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