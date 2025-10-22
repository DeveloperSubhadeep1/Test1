const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const fetch = require('node-fetch');

// Import Mongoose Models
const User = require('../models/User');
const StoredMovie = require('../models/StoredMovie');
const SupportTicket = require('../models/SupportTicket');
const Collection = require('../models/Collection');
const History = require('../models/History');
const Favorite = require('../models/Favorite');
const Watchlist = require('../models/Watchlist');

const TMDB_API_KEY = 'c83a22a71ba60632da9d3a91cd5a9274';


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

// --- Cloudflare Turnstile CAPTCHA Verification Middleware ---
const verifyTurnstile = async (req, res, next) => {
    const token = req.body.turnstileToken;
    const ip = req.ip;

    // Special case for post-OTP login, where captcha is not needed.
    if (token === 'verified_by_otp') {
        delete req.body.turnstileToken;
        return next();
    }

    if (!token) {
        return res.status(400).json({ message: 'CAPTCHA token is missing. Please complete the check.' });
    }
    
    // Use the test secret key for development, or a real key from environment variables in production.
    const secretKey = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';
    
    try {
        // Construct the form data in an object.
        // The `remoteip` property will be undefined if `ip` is falsy.
        const formData = {
            secret: secretKey,
            response: token,
            remoteip: ip
        };

        // When URLSearchParams is constructed from an object, it automatically
        // omits keys with `undefined` or `null` values, providing a clean and robust way
        // to handle the optional `remoteip` parameter.
        const body = new URLSearchParams(formData);

        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: body, // node-fetch will correctly set Content-Type header
        });

        const data = await response.json();

        if (data.success) {
            delete req.body.turnstileToken;
            next();
        } else {
            console.warn('Turnstile verification failed:', data['error-codes']);
            res.status(401).json({ message: 'CAPTCHA verification failed. Please try again.' });
        }
    } catch (error) {
        console.error('Error verifying Turnstile token:', error);
        res.status(500).json({ message: 'Server error while verifying CAPTCHA.' });
    }
};

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

// --- Helper Functions ---
function formatBytes(bytes, decimals = 2) {
    if (!+bytes || bytes === 0) return null;
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const RAW_CHANNEL_NAMES = [
    'ClipmateMovies', 'CineMateHD', 'MovieMateZone', 'StreamMateFilms', 'ReelMateMovies', 'FlixMateOfficial', 'CineStreamHD', 'MovieVerseHQ', 'FilmVerseHD', 'CineVaultMovies', 'MovieWorldHub', 'CineScopeHD', 'MovieFlixZone', 'CineBoxHD', 'FlixArenaMovies', 'CineKingHD', 'StreamWorldMovies', 'MovieNovaHQ', 'CinePlanetHD', 'ReelTimeMovies', 'CineVerseOfficial', 'MoviePortHD', 'CineVaultHub', 'FlixKingMovies', 'MovieLoungeHD', 'CineGalaxyHub', 'BollywoodMateHD', 'SouthHindiMovies', 'SouthFlixMovies', 'HindiDubbedVerse', 'SouthDubHD', 'MovieHubSouth', 'BollywoodCinemaHD', 'SouthBlockbusters', 'TamilTeluguMovies', 'SouthMovieWorld', 'BollywoodFlixHQ', 'HindiMoviesZone', 'DesiCineHub', 'SouthHindiDubbed', 'BollywoodVerseHD', 'SouthActionMovies', 'HindiMoviezMate', 'CineSouthOfficial', 'DesiMovieWorld', 'SouthPlusMovies', 'IndianCinemaVerse', 'BollywoodStreamHD', 'SouthCinemaX', 'MovieHubIndia', 'HindiCineMate', 'FlixMateZone', 'CineXverse', 'MovieCrateHD', 'StreamifyMovies', 'CinePlayHub', 'WatchMateHD', 'FlixPointMovies', 'MovieXpressHD', 'CineDropHub', 'MovieFlowHQ', 'CineCoreMovies', 'ReelStreamHD', 'CineBuzzMovies', 'MovieCloudHub', 'CinePrimeHD', 'StreamZoneMovies', 'CineKingVerse', 'MovieSkyHD', 'FlixStreamOfficial', 'CineBoxOfficeHD', 'CineTimeMovies', 'MovieBytesHD', 'StreamMateOfficial', 'MovieRealmHD', 'CinePortMovies', 'CineSpotHD', 'MovieVersePlus', 'CineNovaMovies', 'StreamMateX', 'CineFlowMovies', 'MovieManiaHD', 'BollywoodPrimeHD', 'SouthHitMovies', 'CineKingPro', 'MovieVaultHD', 'CineZoneOfficial', 'FlixMateIndia', 'MoviePortX', 'CineStreamPro', 'MovieMantraHD', 'SouthCineWorld', 'HindiAddaMovies', 'CinePlanetIndia', 'MovieWorldX', 'FlixverseHD', 'MovieDockHub', 'CineBaseMovies', 'SouthTrendzHD', 'MoviePointHQ', 'CineNationHD', 'MovieStopOfficial', 'StreamLineMovies', 'BollywoodPrimeZone', 'CineMasterHD', 'MovieTimeX', 'SouthHQMovies', 'MovieMatePlus', 'CineFlixIndia', 'MovieCrushHD', 'CineFileMovies', 'MovieSagaHD', 'FlixTownMovies', 'MovieGalaxyHD', 'CineRushMovies', 'SouthFlicksHD', 'MovieEpicHub', 'CineFreakMovies', 'MoviePrimeHub', 'CineDriveMovies', 'MovieDuniyaHD', 'CineBaseIndia', 'MovieArenaHD', 'CineStarMovies', 'MovieScreenHD', 'CineVisionMovies', 'MoviePointZone', 'CineWorldPrime', 'MovieManorHD', 'CineCastMovies', 'MovieBuzzHD', 'CineLoversHub', 'MovieReelHD', 'CineSpaceMovies', 'MovieMediaHD', 'CineWavesHub', 'MoviePortalHD', 'CineXMovies', 'MovieEmpireHD', 'CineEdgeMovies', 'MovieMagicHD', 'CineNextHub', 'MovieAddaHQ', 'CineGateMovies', 'MovieFusionHD', 'CinePrimeZone', 'MovieNationHD', 'CineRoomMovies', 'MovieWorldsHD', 'CineLinkMovies', 'MoviePlayHQ', 'CineShowMovies', 'MovieFinderHD', 'CineCastleMovies', 'MovieVibesHD', 'CinePrimeIndia', 'MovieCornerHD', 'CineCrewMovies', 'MovieMateX', 'CineFlickHub', 'MovieStreamHD', 'CineStarHD', 'MovieMatrixHD', 'CineTuneMovies', 'MovieStoreHD', 'CinePortX', 'MovieCatchHD', 'CineViewMovies', 'MovieBaseHD', 'CineStreamZone', 'MovieBayHD', 'CineLightMovies', 'MovieStageHD', 'CineXtraMovies', 'MovieRoomHQ', 'CineCloudHD', 'MovieTimeIndia', 'CineFeedMovies', 'MovieStationHD', 'CinePostMovies', 'MoviePrimeOfficial', 'CineStreetMovies', 'MovieSyncHD', 'CineChannelMovies', 'MovieMateOfficial', 'CineVaultPro', 'MovieDeckHD', 'CineNovaHD', 'MovieBoxHD', 'CineFlicksOfficial', 'MovieKingHD', 'CineCrewHD', 'MovieBazarHD', 'CineStreamIndia', 'MovieLinkHD', 'CineClubMovies', 'MovieMotionHD', 'CineCityMovies', 'MovieFactoryHD', 'CineMovieZone', 'MovieNexusHD', 'CineSceneMovies', 'MovieWaveHD', 'CineWorldPlus', 'MovieVibeOfficial', 'CineWorldIndia', 'MovieBaseZone', 'CineSpotMovies', 'MovieLandHD', 'CineGoldMovies', 'MovieMateIndia', 'CineHubX', 'MovieArenaIndia', 'CineCoreHub', 'MoviePassHD', 'CineFlickMovies', 'MovieCentralHD', 'CineTuneHD', 'MovieSkyOfficial', 'CineClubHD', 'MovieDreamsHD', 'CinePortPro', 'MovieSpotOfficial', 'CinePlayIndia', 'MovieScreenPro', 'CineXpressMovies', 'MoviePulseHD', 'CineSpaceHD', 'MovieCastHD', 'CineWorldHQ', 'MovieMasterHD', 'CineShowHD', 'MoviePortOfficial', 'CineRealmHD', 'MovieZoneOfficial', 'CineWorldMoviesHD', 'MoviePlanetOfficial', 'CineCloudPro', 'MovieLinkZone', 'CineAddaMovies', 'MovieStreamWorld', 'CineMasterIndia', 'MoviePlanetX', 'CineTownMovies', 'MovieVaultPro', 'CineBuzzHD', 'MovieMoodHD', 'CinePrimeWorld', 'MovieDreamHD', 'CineCatchMovies', 'MovieAddaOfficial', 'CineVerseHD', 'MovieHitZone', 'CineCrownHD', 'MovieTimeOfficial', 'CineViewHD', 'MovieStreamIndia', 'CineSpotIndia', 'MovieSpotHD', 'CinePlayMovies', 'MovieWalaHD', 'CineSeriesHD', 'MovieWorldOfficial', 'CineTrendHD', 'MovieZoneIndia', 'CinePulseMovies', 'MovieJoyHD', 'CineWorldAdda', 'MovieDockHD', 'CineSpotPro', 'MovieMagicIndia', 'CineCineHD', 'MovieFlixHD', 'CineBaseOfficial', 'MovieStoreOfficial', 'CineUploadMovies', 'MovieBoxIndia', 'CinePackHD', 'MovieSeriesHD', 'CineFileHD', 'MovieStreamPro', 'CineVaultIndia', 'MovieVerseOfficial', 'CineAddaHD', 'MovieXpressOfficial', 'CineStreamOfficial', 'MovieWavesHD', 'CineBayMovies', 'MovieVerseIndia', 'CineWebHD', 'MovieWalaOfficial', 'CineManiaHD', 'MovieBuzzIndia', 'CineFlixHD', 'MovieNationPro', 'CineSouthMovies', 'MovieZoneXpress', 'CineIndiaHD', 'MovieFilesHD', 'CineViewPro', 'MoviePlanetPro', 'CineSpotHQ', 'MovieTimePlus', 'CineLinkHD', 'MovieSkyPro', 'CineStreamWorld', 'MovieManiaOfficial', 'CineTrendMovies', 'MovieVaultZone', 'CineBoxPro', 'MovieStreamPlus', 'CineWorldPro', 'MovieCineHub', 'CineAddictHD', 'MovieMaxHD', 'CineStarPro', 'MovieHubHQ', 'CinePointHD', 'MovieNationPlus', 'CineHDWorld', 'MovieWatchHD', 'CineStreamMax', 'MoviePlusHD', 'CineClubPro', 'MovieBoxPro', 'CineZonePro', 'MovieWorldPlus', 'CinePlayPro', 'MovieTimeWorld', 'CineFilmHD', 'MovieVaultWorld', 'CineWatchMovies', 'MoviePlusOfficial', 'CineMaxMovies', 'MovieCornerIndia', 'CineMateIndia', 'MovieSpotPlus', 'CineBuzzPro', 'MovieArenaPro', 'CineLineMovies', 'MovieVerseWorld', 'CineEdgeHD', 'MovieDreamWorld', 'CineKingMovies', 'MoviePortPro', 'CineStreamPlus', 'MovieClipsPro', 'CineFlixPro', 'MovieSpotWorld', 'CineSeriesPro', 'MovieMateWorld', 'CineWatchPro', 'MovieWorldHQ', 'CineZoneWorld', 'MovieCineWorld', 'CineSpotWorld', 'MovieMateUniverse', 'CineStreamUniverse', 'MovieWorldUniverse',
    '@ClipmateMovies', '@CineMateHD', '@MovieMateZone', '@StreamMateFilms', '@ReelMateMovies', '@FlixMateOfficial', '@CineStreamHD', '@MovieVerseHQ', '@FilmVerseHD', '@CineVaultMovies', '@MovieWorldHub', '@CineScopeHD', '@MovieFlixZone', '@CineBoxHD', '@FlixArenaMovies', '@CineKingHD', '@StreamWorldMovies', '@MovieNovaHQ', '@CinePlanetHD', '@ReelTimeMovies', '@CineVerseOfficial', '@MoviePortHD', '@CineVaultHub', '@FlixKingMovies', '@MovieLoungeHD', '@CineGalaxyHub', '@BollywoodMateHD', '@SouthHindiMovies', '@SouthFlixMovies', '@HindiDubbedVerse', '@SouthDubHD', '@MovieHubSouth', '@BollywoodCinemaHD', '@SouthBlockbusters', '@TamilTeluguMovies', '@SouthMovieWorld', '@BollywoodFlixHQ', '@HindiMoviesZone', '@DesiCineHub', '@SouthHindiDubbed', '@BollywoodVerseHD', '@SouthActionMovies', '@HindiMoviezMate', '@CineSouthOfficial', '@DesiMovieWorld', '@SouthPlusMovies', '@IndianCinemaVerse', '@BollywoodStreamHD', '@SouthCinemaX', '@MovieHubIndia', '@HindiCineMate', '@FlixMateZone', '@CineXverse', '@MovieCrateHD', '@StreamifyMovies', '@CinePlayHub', '@WatchMateHD', '@FlixPointMovies', '@MovieXpressHD', '@CineDropHub', '@MovieFlowHQ', '@CineCoreMovies', '@ReelStreamHD', '@CineBuzzMovies', '@MovieCloudHub', '@CinePrimeHD', '@StreamZoneMovies', '@CineKingVerse', '@MovieSkyHD', '@FlixStreamOfficial', '@CineBoxOfficeHD', '@CineTimeMovies', '@MovieBytesHD', '@StreamMateOfficial', '@MovieRealmHD', '@CinePortMovies', '@CineSpotHD', '@MovieVersePlus', '@CineNovaMovies', '@StreamMateX', '@CineFlowMovies', '@MovieManiaHD', '@BollywoodPrimeHD', '@SouthHitMovies', '@CineKingPro', '@MovieVaultHD', '@CineZoneOfficial', '@FlixMateIndia', '@MoviePortX', '@CineStreamPro', '@MovieMantraHD', '@SouthCineWorld', '@HindiAddaMovies', '@CinePlanetIndia', '@MovieWorldX', '@FlixverseHD', '@MovieDockHub', '@CineBaseMovies', '@SouthTrendzHD', '@MoviePointHQ', '@CineNationHD', '@MovieStopOfficial', '@StreamLineMovies', '@BollywoodPrimeZone', '@CineMasterHD', '@MovieTimeX', '@SouthHQMovies', '@MovieMatePlus', '@CineFlixIndia', '@MovieCrushHD', '@CineFileMovies', '@MovieSagaHD', '@FlixTownMovies', '@MovieGalaxyHD', '@CineRushMovies', '@SouthFlicksHD', '@MovieEpicHub', '@CineFreakMovies', '@MoviePrimeHub', '@CineDriveMovies', '@MovieDuniyaHD', '@CineBaseIndia', '@MovieArenaHD', '@CineStarMovies', '@MovieScreenHD', '@CineVisionMovies', '@MoviePointZone', '@CineWorldPrime', '@MovieManorHD', '@CineCastMovies', '@MovieBuzzHD', '@CineLoversHub', '@MovieReelHD', '@CineSpaceMovies', '@MovieMediaHD', '@CineWavesHub', '@MoviePortalHD', '@CineXMovies', '@MovieEmpireHD', '@CineEdgeMovies', '@MovieMagicHD', '@CineNextHub', '@MovieAddaHQ', '@CineGateMovies', '@MovieFusionHD', '@CinePrimeZone', '@MovieNationHD', '@CineRoomMovies', '@MovieWorldsHD', '@CineLinkMovies', '@MoviePlayHQ', '@CineShowMovies', '@MovieFinderHD', '@CineCastleMovies', '@MovieVibesHD', '@CinePrimeIndia', '@MovieCornerHD', '@CineCrewMovies', '@MovieMateX', '@CineFlickHub', '@MovieStreamHD', '@CineStarHD', '@MovieMatrixHD', '@CineTuneMovies', '@MovieStoreHD', '@CinePortX', '@MovieCatchHD', '@CineViewMovies', '@MovieBaseHD', '@CineStreamZone', '@MovieBayHD', '@CineLightMovies', '@MovieStageHD', '@CineXtraMovies', '@MovieRoomHQ', '@CineCloudHD', '@MovieTimeIndia', '@CineFeedMovies', '@MovieStationHD', '@CinePostMovies', '@MoviePrimeOfficial', '@CineStreetMovies', '@MovieSyncHD', '@CineChannelMovies', '@MovieMateOfficial', '@CineVaultPro', '@MovieDeckHD', '@CineNovaHD', '@MovieBoxHD', '@CineFlicksOfficial', '@MovieKingHD', '@CineCrewHD', '@MovieBazarHD', '@CineStreamIndia', '@MovieLinkHD', '@CineClubMovies', '@MovieMotionHD', '@CineCityMovies', '@MovieFactoryHD', '@CineMovieZone', '@MovieNexusHD', 'CineSceneMovies', '@MovieWaveHD', '@CineWorldPlus', '@MovieVibeOfficial', '@CineWorldIndia', '@MovieBaseZone', '@CineSpotMovies', '@MovieLandHD', '@CineGoldMovies', '@MovieMateIndia', '@CineHubX', '@MovieArenaIndia', '@CineCoreHub', '@MoviePassHD', '@CineFlickMovies', '@MovieCentralHD', '@CineTuneHD', '@MovieSkyOfficial', '@CineClubHD', '@MovieDreamsHD', '@CinePortPro', '@MovieSpotOfficial', '@CinePlayIndia', '@MovieScreenPro', '@CineXpressMovies', '@MoviePulseHD', '@CineSpaceHD', '@MovieCastHD', '@CineWorldHQ', '@MovieMasterHD', '@CineShowHD', '@MoviePortOfficial', '@CineRealmHD', '@MovieZoneOfficial', '@CineWorldMoviesHD', '@MoviePlanetOfficial', '@CineCloudPro', '@MovieLinkZone', '@CineAddaMovies', '@MovieStreamWorld', '@CineMasterIndia', '@MoviePlanetX', '@CineTownMovies', '@MovieVaultPro', '@CineBuzzHD', '@MovieMoodHD', '@CinePrimeWorld', '@MovieDreamHD', '@CineCatchMovies', '@MovieAddaOfficial', '@CineVerseHD', '@MovieHitZone', '@CineCrownHD', '@MovieTimeOfficial', '@CineViewHD', '@MovieStreamIndia', '@CineSpotIndia', '@MovieSpotHD', '@CinePlayMovies', '@MovieWalaHD', '@CineSeriesHD', '@MovieWorldOfficial', '@CineTrendHD', '@MovieZoneIndia', '@CinePulseMovies', '@MovieJoyHD', '@CineWorldAdda', '@MovieDockHD', '@CineSpotPro', '@MovieMagicIndia', '@CineCineHD', '@MovieFlixHD', '@CineBaseOfficial', '@MovieStoreOfficial', '@CineUploadMovies', '@MovieBoxIndia', '@CinePackHD', '@MovieSeriesHD', '@CineFileHD', '@MovieStreamPro', '@CineVaultIndia', '@MovieVerseOfficial', '@CineAddaHD', '@MovieXpressOfficial', '@CineStreamOfficial', '@MovieWavesHD', '@CineBayMovies', '@MovieVerseIndia', '@CineWebHD', '@MovieWalaOfficial', '@CineManiaHD', '@MovieBuzzIndia', '@CineFlixHD', '@MovieNationPro', '@CineSouthMovies', '@MovieZoneXpress', '@CineIndiaHD', '@MovieFilesHD', '@CineViewPro', '@MoviePlanetPro', '@CineSpotHQ', '@MovieTimePlus', '@CineLinkHD', '@MovieSkyPro', '@CineStreamWorld', '@MovieManiaOfficial', '@CineTrendMovies', '@MovieVaultZone', '@CineBoxPro', '@MovieStreamPlus', '@CineWorldPro', '@MovieCineHub', '@CineAddictHD', '@MovieMaxHD', '@CineStarPro', '@MovieHubHQ', '@CinePointHD', '@MovieNationPlus', '@CineHDWorld', '@MovieWatchHD', '@CineStreamMax', '@MoviePlusHD', '@CineClubPro', '@MovieBoxPro', '@CineZonePro', '@MovieWorldPlus', '@CinePlayPro', '@MovieTimeWorld', '@CineFilmHD', '@MovieVaultWorld', '@CineWatchMovies', '@MoviePlusOfficial', '@CineMaxMovies', '@MovieCornerIndia', '@CineMateIndia', '@MovieSpotPlus', '@CineBuzzPro', '@MovieArenaPro', '@CineLineMovies', '@MovieVerseWorld', '@CineEdgeHD', '@MovieDreamWorld', '@CineKingMovies', '@MoviePortPro', '@CineStreamPlus', '@MovieClipsPro', '@CineFlixPro', '@MovieSpotWorld', '@CineSeriesPro', '@MovieMateWorld', '@CineWatchPro', '@MovieWorldHQ', '@CineZoneWorld', '@MovieCineWorld', '@CineSpotWorld', '@MovieMateUniverse', '@CineStreamUniverse', '@MovieWorldUniverse'
];

// Create a single, powerful regex from the entire blocklist.
const CHANNEL_NAMES_FOR_REGEX = RAW_CHANNEL_NAMES.map(name => 
    name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') // Escape special regex characters
);
const FULL_BLOCKLIST_REGEX = new RegExp(`(${CHANNEL_NAMES_FOR_REGEX.join('|')})`, 'gi');


function parseFilename(filename) {
    // --- Step 1: Extract size BEFORE normalization, as normalization can break the format (e.g., "1.23 GB").
    let size = null;
    const sizeMatch = filename.match(/(\d+(\.\d+)?\s?(gb|mb))/i);
    if (sizeMatch) {
      size = sizeMatch[0].replace(/\s/g, '').toUpperCase();
    }

    // --- Step 2: Clean and normalize the string for title extraction.
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    
    // UPDATED: Clean the filename in multiple stages for robustness.
    let cleanedName = nameWithoutExt
        .replace(/\[.*?\]/g, '')              // Stage 1: Remove bracketed content like [TGx].
        .replace(FULL_BLOCKLIST_REGEX, '');   // Stage 2: Remove any known channel/group name from the comprehensive list.
      
    let normalized = cleanedName.replace(/[._()+-]/g, " ").replace(/\s+/g, ' ').trim();


    // --- Step 3: Parse metadata from the normalized string.
    let year = null;
    let season = null;
    let episode = null;
    let movieName = '';

    const matchIndices = [];

    // Find Year
    const yearMatch = normalized.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
        const potentialYear = parseInt(yearMatch[0], 10);
        if (potentialYear > 1900 && potentialYear < new Date().getFullYear() + 5) {
            year = yearMatch[0];
            matchIndices.push(normalized.indexOf(yearMatch[0]));
        }
    }

    // Find Season/Episode using comprehensive regex patterns
    // Pattern 1: Combined formats like S01E01, Season 01 Episode 01, S01x01
    let seMatch = normalized.match(/(?:Season|S|Series|Part)[\s._-]?(\d{1,2})(?:[\s._-x](?:E|Ep|Episode|EP)?[\s._-]?)(\d{1,3})\b/i);
    // Pattern 2: Fallback for formats like 1x02
    if (!seMatch) {
        seMatch = normalized.match(/\b(\d{1,2})x(\d{1,3})\b/i);
    }
    
    if (seMatch) {
        season = parseInt(seMatch[1], 10);
        episode = parseInt(seMatch[2], 10);
        matchIndices.push(normalized.indexOf(seMatch[0]));
    } else {
        // If no combined match, look for season and episode independently
        const seasonMatch = normalized.match(/(?:Season|S|Series|Part)[\s._-]?(\d{1,2})\b/i);
        if (seasonMatch) {
            season = parseInt(seasonMatch[1], 10);
            matchIndices.push(normalized.indexOf(seasonMatch[0]));
        }

        const episodeMatch = normalized.match(/(?:Episode|Ep|E|EP)[\s._-]?(\d{1,3})\b/i);
        if (episodeMatch) {
            episode = parseInt(episodeMatch[1], 10);
            matchIndices.push(normalized.indexOf(episodeMatch[0]));
        }
    }
    
    // Determine where the title ends. It's the first occurrence of any metadata.
    let titleEndIndex = -1;
    if (matchIndices.length > 0) {
        titleEndIndex = Math.min(...matchIndices);
    }

    if (titleEndIndex !== -1) {
        movieName = normalized.substring(0, titleEndIndex).trim();
    } else {
        // Fallback: If no metadata found, find where quality/language keywords start
        const parts = normalized.split(' ');
        const keywords = ['4k', '2160p', '1080p', '720p', '480p', 'web-dl', 'webdl', 'webrip', 'bluray', 'hdtv', 'hdrip', 'x264', 'hindi', 'english', 'eng', 'dual', 'audio'];
        let firstMetaIndex = -1;
        for (let i = 1; i < parts.length; i++) { // Start from 1 to avoid matching if title itself is a keyword
            if (keywords.includes(parts[i].toLowerCase())) {
                firstMetaIndex = i;
                break;
            }
        }
        if (firstMetaIndex !== -1) {
            movieName = parts.slice(0, firstMetaIndex).join(' ');
        } else {
            movieName = normalized; // Assume the whole thing is the title
        }
    }
    
    if (!movieName.trim()) {
      throw new Error("Could not extract a valid title from the filename. The name may only contain channel tags or release info.");
    }

    // --- Step 4: Parse quality and languages from the whole normalized string
    const lowerNormalized = normalized.toLowerCase();
    
    let quality = null;
    const qualityMatch = lowerNormalized.match(/\b(4k|2160p|1080p|720p|480p)\b/i);
    if (qualityMatch) {
      quality = qualityMatch[0].toUpperCase().replace('P', 'p');
    }
    
    const languages = [];
    const languageMap = {
        // Indic
        'hindi': 'Hindi', 'hin': 'Hindi', 'hn': 'Hindi', 'hi': 'Hindi', 'हिन्दी': 'Hindi',
        'english': 'English', 'eng': 'English', 'en': 'English', 'e': 'English',
        'tamil': 'Tamil', 'tam': 'Tamil', 'ta': 'Tamil',
        'telugu': 'Telugu', 'tel': 'Telugu', 'te': 'Telugu',
        'kannada': 'Kannada', 'kan': 'Kannada', 'kn': 'Kannada',
        'malayalam': 'Malayalam', 'mal': 'Malayalam', 'ml': 'Malayalam',
        'marathi': 'Marathi', 'mar': 'Marathi', 'mr': 'Marathi',
        'bengali': 'Bengali', 'ben': 'Bengali', 'bn': 'Bengali', 'be': 'Bengali',
        'gujarati': 'Gujarati', 'guj': 'Gujarati', 'gj': 'Gujarati', 'gu': 'Gujarati',
        'punjabi': 'Punjabi', 'pan': 'Punjabi', 'pa': 'Punjabi', 'pb': 'Punjabi',
        'odia': 'Odia', 'ori': 'Odia', 'or': 'Odia', 'od': 'Odia',
        'assamese': 'Assamese', 'asm': 'Assamese', 'as': 'Assamese',
        'urdu': 'Urdu', 'urd': 'Urdu', 'ur': 'Urdu',
        
        // Misc
        'dual': 'Dual Audio', 'audio': 'Dual Audio',

        // International
        'spanish': 'Spanish', 'spa': 'Spanish', 'sp': 'Spanish', 'es': 'Spanish',
        'french': 'French', 'fre': 'French', 'fr': 'French', 'f': 'French',
        'german': 'German', 'ger': 'German', 'de': 'German', 'ge': 'German',
        'italian': 'Italian', 'ita': 'Italian', 'it': 'Italian',
        'russian': 'Russian', 'rus': 'Russian', 'ru': 'Russian',
        'japanese': 'Japanese', 'jpn': 'Japanese', 'ja': 'Japanese', 'jp': 'Japanese',
        'korean': 'Korean', 'kor': 'Korean', 'ko': 'Korean', 'kr': 'Korean',
        'chinese': 'Chinese', 'chi': 'Chinese', 'zh': 'Chinese', 'cn': 'Chinese',
        'arabic': 'Arabic', 'ara': 'Arabic', 'ar': 'Arabic',
        'turkish': 'Turkish', 'tur': 'Turkish', 'tr': 'Turkish',
        'portuguese': 'Portuguese', 'por': 'Portuguese', 'pt': 'Portuguese', 'br': 'Portuguese',
        'thai': 'Thai', 'tha': 'Thai', 'th': 'Thai',
        'vietnamese': 'Vietnamese', 'vie': 'Vietnamese', 'vi': 'Vietnamese',
        'indonesian': 'Indonesian', 'ind': 'Indonesian', 'id': 'Indonesian',
        'filipino': 'Filipino', 'fil': 'Filipino', 'ph': 'Filipino',
        'dutch': 'Dutch', 'dut': 'Dutch', 'nl': 'Dutch',
        'polish': 'Polish', 'pol': 'Polish', 'pl': 'Polish',
        'ukrainian': 'Ukrainian', 'ukr': 'Ukrainian', 'ua': 'Ukrainian',
        'swedish': 'Swedish', 'swe': 'Swedish', 'se': 'Swedish',
        'norwegian': 'Norwegian', 'nor': 'Norwegian', 'no': 'Norwegian',
        'danish': 'Danish', 'dan': 'Danish', 'dk': 'Danish',
        'finnish': 'Finnish', 'fin': 'Finnish', 'fi': 'Finnish',
        'greek': 'Greek', 'gre': 'Greek', 'el': 'Greek', 'gr': 'Greek',
        'hebrew': 'Hebrew', 'heb': 'Hebrew', 'he': 'Hebrew', 'iw': 'Hebrew',
        'persian': 'Persian', 'per': 'Persian', 'fa': 'Persian',
        'burmese': 'Burmese', 'bur': 'Burmese', 'my': 'Burmese', 'mm': 'Burmese',
        'sinhala': 'Sinhala', 'sinh': 'Sinhala', 'si': 'Sinhala',
        'afrikaans': 'Afrikaans', 'afr': 'Afrikaans', 'af': 'Afrikaans',
        'latin': 'Latin', 'lat': 'Latin', 'la': 'Latin',
        'romanian': 'Romanian', 'rom': 'Romanian', 'ro': 'Romanian',
        'bulgarian': 'Bulgarian', 'bul': 'Bulgarian', 'bg': 'Bulgarian',
        'hungarian': 'Hungarian', 'hun': 'Hungarian', 'hu': 'Hungarian',
        'czech': 'Czech', 'cze': 'Czech', 'cs': 'Czech',
        'slovak': 'Slovak', 'slo': 'Slovak', 'sk': 'Slovak',
        'serbian': 'Serbian', 'srb': 'Serbian', 'sr': 'Serbian',
        'croatian': 'Croatian', 'cro': 'Croatian', 'hr': 'Croatian',
        'malay': 'Malay', 'maly': 'Malay', 'ms': 'Malay',
        'kazakh': 'Kazakh', 'kaz': 'Kazakh', 'kk': 'Kazakh',
        'mongolian': 'Mongolian', 'mon': 'Mongolian', 'mn': 'Mongolian',
        'armenian': 'Armenian', 'arm': 'Armenian', 'hy': 'Armenian',
        'georgian': 'Georgian', 'geo': 'Georgian', 'ka': 'Georgian',
        'tatar': 'Tatar', 'tat': 'Tatar', 'tt': 'Tatar',
    };
    
    const parts = normalized.split(' ');
    const lowerParts = parts.map(p => p.toLowerCase());

    for (let i = 0; i < lowerParts.length; i++) {
        const pKey = lowerParts[i];

        // Handle 'eng' to differentiate audio from subtitles
        if (pKey === 'eng' && (i + 1 < lowerParts.length) && (lowerParts[i + 1] === 'sub' || lowerParts[i + 1] === 'subs')) {
            i++; // Skip 'eng' and also skip 'sub(s)' on the next iteration
            continue;
        }
        
        // Handle 'esub(s)' which are clearly subtitles
        if (pKey === 'esub' || pKey === 'esubs') {
            continue;
        }

        const lang = languageMap[pKey];
        if (lang && !languages.includes(lang)) {
            languages.push(lang);
        }
    }

    return { movieName, year, languages, quality, size, season, episode };
}

// --- Util Routes ---
router.post('/utils/parse-url', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ message: 'URL is required.' });
        }

        const urlObj = new URL(url);
        const filenameWithExt = urlObj.pathname.split('/').pop();
        if (!filenameWithExt) {
            return res.status(400).json({ message: 'Could not extract filename from URL.' });
        }
        
        const decodedFilename = decodeURIComponent(filenameWithExt);
        let { movieName, year, languages, quality, size, season, episode } = parseFilename(decodedFilename);

        // If year is not found in filename, try to get it from TMDb, using the correct content type
        if (!year && movieName) {
            const searchType = (season !== null) ? 'tv' : 'movie';
            try {
                const searchParams = new URLSearchParams({
                    api_key: TMDB_API_KEY,
                    query: movieName,
                });
                const tmdbRes = await fetch(`https://api.themoviedb.org/3/search/${searchType}?${searchParams.toString()}`);
                if (tmdbRes.ok) {
                    const tmdbData = await tmdbRes.json();
                    if (tmdbData.results && tmdbData.results.length > 0) {
                        const releaseDate = searchType === 'movie' 
                            ? tmdbData.results[0].release_date 
                            : tmdbData.results[0].first_air_date;
                        if (releaseDate) {
                            year = new Date(releaseDate).getFullYear().toString();
                        }
                    }
                }
            } catch (tmdbError) {
                console.warn(`TMDb fallback search failed for "${movieName}":`, tmdbError.message);
            }
        }

        res.json({
            movieName,
            year: year ? parseInt(year, 10) : null,
            languages,
            quality,
            size,
            season,
            episode,
        });

    } catch (error) {
        console.error('Error parsing URL:', error);
        // FIX: Catch the specific error for empty titles and return a 400 Bad Request.
        if (error.message && error.message.includes("Could not extract a valid title")) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error while parsing URL.' });
    }
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
router.post('/auth/login', verifyTurnstile, async (req, res) => {
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
router.post('/auth/send-otp', rateLimiter, verifyTurnstile, async (req, res) => {
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
router.post('/auth/send-reset-otp', rateLimiter, verifyTurnstile, async (req, res) => {
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
                            <p style="font-size: 14px; color: #57606a;">This code is valid for 1 hour. Please use it soon.</p>
                        </div>
                        <div style="background-color: #161B22; color: #8B949E; padding: 16px; text-align: center; font-size: 12px;">
                            <p>If you did not request a password reset, you can safely ignore this email.</p>
                            <p>&copy; ${new Date().getFullYear()} CineStream. All Rights Reserved.</p>
                        </div>
                    </div>
                `,
            });
        }
        
        res.status(200).json({ message: 'If an account with that email exists, a reset code has been sent.' });

    } catch (error) {
        console.error('Error sending reset OTP:', error);
        // Do not reveal server-side errors to the user to prevent enumeration attacks.
        res.status(200).json({ message: 'If an account with that email exists, a reset code has been sent.' });
    }
});


// Step 2 of Password Reset - Verify and Update
router.post('/auth/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const storedData = otpStore[email];

        if (!storedData || storedData.type !== 'reset') {
            return res.status(400).json({ message: 'Invalid request. Please start the reset process again.' });
        }
        
        if (Date.now() > storedData.expiry) {
            delete otpStore[email];
            return res.status(400).json({ message: 'OTP has expired. Please try again.' });
        }

        if (otp !== storedData.otp) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
             return res.status(404).json({ message: 'User not found.' });
        }
        
        // In a real app, hash the password: user.password = await bcrypt.hash(newPassword, 10);
        user.password = newPassword;
        await user.save();
        
        delete otpStore[email];

        res.status(200).json({ message: 'Password has been reset successfully. You can now log in.' });

    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).json({ message: 'Server error during password reset.' });
    }
});


// --- User Profile ---
router.patch('/users/profile', getUserId, async (req, res) => {
    try {
        const { customName, dob, gender, avatar } = req.body;
        const updateData = {};
        
        if (customName !== undefined) updateData.customName = customName;
        if (dob !== undefined) updateData.dob = dob;
        if (gender !== undefined) updateData.gender = gender;
        if (avatar !== undefined) updateData.avatar = avatar;

        const updatedUser = await User.findByIdAndUpdate(req.userId, updateData, { new: true, runValidators: true });
        
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        const { password: _, ...userProfile } = updatedUser.toObject();
        res.json(userProfile);

    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ message: 'Server error while updating profile.' });
    }
});


// --- Favorites ---
router.get('/favorites', getUserId, async (req, res) => {
    try {
        const favorites = await Favorite.find({ userId: req.userId }).sort({ dateAdded: -1 });
        res.json(favorites);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching favorites.' });
    }
});
router.post('/favorites', getUserId, async (req, res) => {
    try {
        const newItem = new Favorite({ ...req.body, userId: req.userId });
        await newItem.save();
        res.status(201).json(newItem);
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: 'Item already in favorites.' });
        res.status(500).json({ message: 'Server error adding favorite.' });
    }
});
router.delete('/favorites/:tmdbId', getUserId, async (req, res) => {
    try {
        await Favorite.deleteOne({ userId: req.userId, id: req.params.tmdbId });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Server error removing favorite.' });
    }
});


// --- Watchlist ---
router.get('/watchlist', getUserId, async (req, res) => {
    try {
        const watchlist = await Watchlist.find({ userId: req.userId }).sort({ dateAdded: -1 });
        res.json(watchlist);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching watchlist.' });
    }
});
router.post('/watchlist', getUserId, async (req, res) => {
    try {
        const newItem = new Watchlist({ ...req.body, userId: req.userId });
        await newItem.save();
        res.status(201).json(newItem);
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: 'Item already in watchlist.' });
        res.status(500).json({ message: 'Server error adding to watchlist.' });
    }
});
router.delete('/watchlist/:tmdbId', getUserId, async (req, res) => {
    try {
        await Watchlist.deleteOne({ userId: req.userId, id: req.params.tmdbId });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Server error removing from watchlist.' });
    }
});


// --- History ---
router.get('/history', getUserId, async (req, res) => {
    try {
        const history = await History.find({ userId: req.userId }).sort({ viewedAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching history.' });
    }
});
router.post('/history', getUserId, async (req, res) => {
    try {
        // Use `findOneAndUpdate` with `upsert: true` to either update the timestamp of an existing item
        // or create a new one. This prevents duplicates and keeps the most recent view time.
        const newItem = await History.findOneAndUpdate(
            { userId: req.userId, id: req.body.id },
            { ...req.body, userId: req.userId, viewedAt: new Date() },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        res.status(201).json(newItem);
    } catch (error) {
        res.status(500).json({ message: 'Server error adding to history.' });
    }
});
router.delete('/history', getUserId, async (req, res) => {
    try {
        await History.deleteMany({ userId: req.userId });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Server error clearing history.' });
    }
});


// --- Collections ---
router.get('/collections/user', getUserId, async (req, res) => {
    try {
        const collections = await Collection.find({ userId: req.userId }).sort({ updatedAt: -1 });
        res.json(collections);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching collections.' });
    }
});
router.get('/collections/:id', async (req, res) => {
    try {
        const collection = await Collection.findById(req.params.id);
        if (!collection) return res.status(404).json({ message: 'Collection not found.' });

        if (collection.isPublic) {
            return res.json(collection);
        }
        
        // If private, check for ownership
        const userId = req.headers['x-user-id'];
        if (userId && userId === collection.userId) {
            return res.json(collection);
        }

        return res.status(403).json({ message: 'This collection is private.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching collection.' });
    }
});
router.post('/collections', getUserId, async (req, res) => {
    try {
        const { name, description, isPublic } = req.body;
        const newCollection = new Collection({ name, description, isPublic, userId: req.userId, items: [] });
        await newCollection.save();
        res.status(201).json(newCollection);
    } catch (error) {
        res.status(500).json({ message: 'Server error creating collection.' });
    }
});
router.patch('/collections/:id', getUserId, async (req, res) => {
    try {
        const { name, description, isPublic } = req.body;
        const collection = await Collection.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { name, description, isPublic },
            { new: true }
        );
        if (!collection) return res.status(404).json({ message: 'Collection not found or you do not have permission to edit it.' });
        res.json(collection);
    } catch (error) {
        res.status(500).json({ message: 'Server error updating collection.' });
    }
});
router.delete('/collections/:id', getUserId, async (req, res) => {
    try {
        const result = await Collection.deleteOne({ _id: req.params.id, userId: req.userId });
        if (result.deletedCount === 0) return res.status(404).json({ message: 'Collection not found or you do not have permission to delete it.' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting collection.' });
    }
});
router.post('/collections/:id/items', getUserId, async (req, res) => {
    try {
        const collection = await Collection.findOne({ _id: req.params.id, userId: req.userId });
        if (!collection) return res.status(404).json({ message: 'Collection not found or permission denied.' });
        
        // Check if item already exists
        if (collection.items.some(item => item.id === req.body.id)) {
            return res.status(409).json({ message: 'This item is already in the collection.' });
        }
        
        collection.items.push(req.body);
        await collection.save();
        res.json(collection);
    } catch (error) {
        res.status(500).json({ message: 'Server error adding item to collection.' });
    }
});
router.delete('/collections/:id/items/:tmdbId', getUserId, async (req, res) => {
    try {
        const collection = await Collection.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { $pull: { items: { id: req.params.tmdbId } } },
            { new: true }
        );
        if (!collection) return res.status(404).json({ message: 'Collection not found or permission denied.' });
        res.json(collection);
    } catch (error) {
        res.status(500).json({ message: 'Server error removing item from collection.' });
    }
});



// --- Stored Movies / Download Links ---
router.get('/stored-movies', async (req, res) => {
    try {
        const movies = await StoredMovie.find({});
        res.json(movies);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

router.get('/stored-movies/find', async (req, res) => {
    try {
        const { tmdbId, type } = req.query;
        if (!tmdbId || !type) {
            return res.status(400).json({ message: 'tmdbId and type are required.' });
        }
        const movie = await StoredMovie.findOne({ tmdb_id: tmdbId, type });
        res.json(movie);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

router.post('/stored-movies', getUserId, requireAdmin, async (req, res) => {
    try {
        const { tmdb_id, type, title, download_links } = req.body;
        const newMovie = new StoredMovie({ tmdb_id, type, title, download_links });
        await newMovie.save();
        res.status(201).json(newMovie);
    } catch (error) {
        if (error.code === 11000) { // Duplicate key error
            return res.status(409).json({ message: 'This movie/show already exists in the database.' });
        }
        res.status(500).json({ message: 'Server error while adding movie.' });
    }
});

router.patch('/stored-movies/:id', getUserId, requireAdmin, async (req, res) => {
    try {
        const { download_links } = req.body;
        const movie = await StoredMovie.findByIdAndUpdate(req.params.id, { download_links }, { new: true });
        if (!movie) return res.status(404).json({ message: 'Movie not found.' });
        res.json(movie);
    } catch (error) {
        res.status(500).json({ message: 'Server error while updating movie.' });
    }
});

router.delete('/stored-movies/:id', getUserId, requireAdmin, async (req, res) => {
    try {
        await StoredMovie.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Server error while deleting movie.' });
    }
});

router.patch('/stored-movies/:id/increment', async (req, res) => {
    try {
        await StoredMovie.findByIdAndUpdate(req.params.id, { $inc: { download_count: 1 } });
        res.status(204).send();
    } catch (error) {
        // Don't block the user's download if this fails, just log it.
        console.error("Failed to increment download count for movie ID:", req.params.id, error);
        res.status(204).send();
    }
});

// --- Support Tickets ---
router.get('/support-tickets', getUserId, requireAdmin, async (req, res) => {
    try {
        const tickets = await SupportTicket.find({}).sort({ timestamp: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

router.post('/support-tickets', verifyTurnstile, async (req, res) => {
    try {
        const { subject, contentTitle, message } = req.body;
        const userId = req.headers['x-user-id']; // Optional
        let username = 'Guest';

        if (userId) {
            const user = await User.findById(userId);
            if (user) {
                username = user.username;
            }
        }

        const newTicket = new SupportTicket({
            userId: userId || undefined,
            username,
            subject,
            contentTitle: contentTitle || undefined,
            message,
        });
        
        await newTicket.save();

        if (subject === 'Link Suggestion' && userId) {
            const user = await User.findById(userId);
            if (user) {
                const updatedLinks = [{ label: 'Pending Review', url: message, suggestedBy: user.username }];
                await StoredMovie.findOneAndUpdate(
                    { tmdb_id: req.body.tmdbId, type: req.body.type },
                    { $push: { download_links: { $each: updatedLinks } } },
                    { upsert: false } // Don't create if not found, admin must add movie first
                );
            }
        }
        
        res.status(201).json(newTicket);
    } catch (error) {
        console.error('Error submitting ticket:', error);
        res.status(500).json({ message: 'Server error while submitting feedback.' });
    }
});

router.delete('/support-tickets/:id', getUserId, requireAdmin, async (req, res) => {
    try {
        await SupportTicket.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Server error while deleting ticket.' });
    }
});


// --- Admin Dashboard & Metrics ---
router.get('/metrics', getUserId, requireAdmin, async (req, res) => {
    try {
        const totalLinks = await StoredMovie.aggregate([{ $project: { linkCount: { $size: "$download_links" } } }, { $group: { _id: null, total: { $sum: "$linkCount" } } }]);
        const totalDownloads = await StoredMovie.aggregate([{ $group: { _id: null, total: { $sum: "$download_count" } } }]);
        const totalSupportTickets = await SupportTicket.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalCollections = await Collection.countDocuments();

        res.json({
            totalLinks: totalLinks[0]?.total || 0,
            totalDownloads: totalDownloads[0]?.total || 0,
            totalSupportTickets,
            totalUsers,
            totalCollections,
        });
    } catch (error) {
        console.error("Error fetching metrics:", error);
        res.status(500).json({ message: 'Server error fetching metrics.' });
    }
});

router.get('/db-stats', getUserId, requireAdmin, async (req, res) => {
    try {
        const stats = await mongoose.connection.db.stats();
        const usedBytes = stats.storageSize;
        // For free tier MongoDB Atlas, total storage is 512MB. This is not available from db.stats().
        const totalBytes = 512 * 1024 * 1024; // 512 MB

        // Get connection info to display in the UI
        const dbName = mongoose.connection.name;
        // Safely parse the URL without exposing credentials in logs/errors
        const clientUrl = new URL(mongoose.connection.client.s.url);
        const clusterHost = clientUrl.hostname;

        res.json({ usedBytes, totalBytes, dbName, clusterHost });
    } catch (error) {
        console.error("Error fetching DB stats:", error);
        res.status(500).json({ message: 'Server error fetching DB stats.' });
    }
});

router.get('/users', getUserId, requireAdmin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        const userIds = users.map(u => u._id.toString());

        const favoritesCounts = await Favorite.aggregate([
            { $match: { userId: { $in: userIds } } },
            { $group: { _id: "$userId", count: { $sum: 1 } } }
        ]);

        const watchlistCounts = await Watchlist.aggregate([
            { $match: { userId: { $in: userIds } } },
            { $group: { _id: "$userId", count: { $sum: 1 } } }
        ]);

        const favoritesMap = new Map(favoritesCounts.map(item => [item._id, item.count]));
        const watchlistMap = new Map(watchlistCounts.map(item => [item._id, item.count]));

        const usersWithCounts = users.map(user => ({
            ...user.toObject(),
            favoritesCount: favoritesMap.get(user._id.toString()) || 0,
            watchlistCount: watchlistMap.get(user._id.toString()) || 0,
        }));

        res.json(usersWithCounts);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error fetching users.' });
    }
});

router.post('/admin/test-email', getUserId, requireAdmin, async (req, res) => {
    try {
        const info = await transporter.sendMail({
            from: `"CineStream Diagnostics" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: '✅ SMTP Connection Test Successful',
            html: `<p>This is a test email from your CineStream application's backend. If you received this, your Nodemailer configuration is working correctly.</p><p>Timestamp: ${new Date().toISOString()}</p>`,
        });

        res.json({ success: true, message: `Test email sent successfully to ${process.env.EMAIL_USER}. Message ID: ${info.messageId}` });
    } catch (error) {
        console.error('Email test failed:', error);

        let errorMessage = `Failed to send test email. Raw Error: ${error.message}\n\nTROUBLESHOOTING:\n`;
        
        if (error.code === 'EAUTH' || error.responseCode === 535) {
             errorMessage += `1. **Authentication Failed:** The \`EMAIL_USER\` or \`EMAIL_PASS\` environment variables are incorrect.\n2. **Check your password:** Ensure you are using a 16-character **Google App Password**, not your regular Gmail password.\n3. **Check for spaces:** Make sure there are no spaces in the password you pasted into your environment variables.`;
        } else if (error.code === 'ETIMEDOUT') {
             errorMessage += `1. **Connection Timed Out:** The server could not connect to the SMTP host (\`smtp.gmail.com\`).\n2. **Check for Security Alerts:** Sign in to the \`${process.env.EMAIL_USER}\` Gmail account and look for any "Security Alert" or "Sign-in attempt blocked" emails. You **MUST** approve the sign-in from your server's location.\n3. **Firewall Issues:** A firewall on your hosting provider (less likely on Render/Koyeb) might be blocking outbound connections on port 465.`;
        } else {
             errorMessage += `An unexpected error occurred. Please check the server logs for more details.`;
        }

        res.json({ success: false, message: errorMessage });
    }
});


module.exports = router;