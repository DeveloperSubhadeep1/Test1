const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
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
  viewedAt: {
    type: Date,
    default: Date.now,
  },
});

// To optimize queries for fetching user history
HistorySchema.index({ userId: 1, viewedAt: -1 });

module.exports = mongoose.model('History', HistorySchema);