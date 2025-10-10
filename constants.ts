// In a real application, API keys and sensitive URLs would be stored in environment variables for security.
// e.g., process.env.TMDB_API_KEY

export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
export const TMDB_IMAGE_BASE_URL_MEDIUM = 'https://image.tmdb.org/t/p/w342';
export const TMDB_IMAGE_BASE_URL_SMALL = 'https://image.tmdb.org/t/p/w185';
export const TMDB_API_KEY = 'c83a22a71ba60632da9d3a91cd5a9274';
export const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';

// --- Database API Configuration ---
// This now points to your local Node.js/Express backend server.
export const DB_BASE_URL = 'http://localhost:3001/api'; 
export const DB_API_KEY = ''; // No longer needed for this backend.
