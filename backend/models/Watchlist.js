const mongoose = require('mongoose');

const WatchlistSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  // TMDB ID
  id: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['movie', 'tv'],
    required: true,
  },
  title: String,
  name: String,
  poster_path: String,
  release_date: String,
  first_air_date: String,
  vote_average: Number,
  overview: String,
  dateAdded: {
    type: Date,
    default: Date.now,
  },
});

// Prevent a user from adding the same item to their watchlist twice
WatchlistSchema.index({ userId: 1, id: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', WatchlistSchema);