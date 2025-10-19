const mongoose = require('mongoose');

// A simplified schema for content items stored within a collection.
// This prevents duplicating large, unnecessary data like overviews.
const CollectionItemSchema = new mongoose.Schema({
  id: { type: Number, required: true }, // TMDB ID
  type: { type: String, enum: ['movie', 'tv'], required: true },
  title: String, // For movies
  name: String, // For TV shows
  poster_path: String,
  release_date: String,
  first_air_date: String,
  vote_average: Number,
}, { _id: false });

const CollectionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  items: [CollectionItemSchema],
}, { timestamps: true });

module.exports = mongoose.model('Collection', CollectionSchema);