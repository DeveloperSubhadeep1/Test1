const mongoose = require('mongoose');

const DownloadLinkSchema = new mongoose.Schema({
  label: String,
  url: String,
  suggestedBy: {
    type: String,
    required: false
  },
});

const StoredMovieSchema = new mongoose.Schema({
  tmdb_id: {
    type: Number,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['movie', 'tv'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  download_links: [DownloadLinkSchema],
  download_count: {
    type: Number,
    default: 0,
  },
});

// Create a compound index to ensure a tmdb_id/type combination is unique
StoredMovieSchema.index({ tmdb_id: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('StoredMovie', StoredMovieSchema);