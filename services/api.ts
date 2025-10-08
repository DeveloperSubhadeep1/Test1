import {
  MovieSummary,
  TVSummary,
  MovieDetail,
  TVDetail,
  ContentType,
  StoredMovie,
  Metrics,
} from '../types';
import { TMDB_API_KEY, TMDB_API_BASE_URL, MONGO_URI } from '../constants';

// --- Live TMDB API ---
const tmdbFetch = async (endpoint: string, params: Record<string, string> = {}) => {
    const urlParams = new URLSearchParams({
        api_key: TMDB_API_KEY,
        ...params,
    });
    const url = `${TMDB_API_BASE_URL}${endpoint}?${urlParams.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
        console.error(`TMDB API request failed for ${url}: ${response.statusText}`);
        throw new Error(`TMDB API request failed: ${response.statusText}`);
    }
    return response.json();
}

export const searchTMDB = async (query: string): Promise<{ results: (MovieSummary | TVSummary)[] }> => {
    const data = await tmdbFetch('/search/multi', { query });
    // Filter out people and items without posters for a cleaner UI
    const filteredResults = data.results.filter(
        (item: any) => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path
    );
    return { results: filteredResults };
};

export const getTrending = async (type: ContentType, page: number = 1): Promise<{ results: any[] }> => {
    return tmdbFetch(`/trending/${type}/week`, { page: page.toString() });
};

export const getDetails = async (type: ContentType, id: number): Promise<MovieDetail | TVDetail> => {
    return tmdbFetch(`/${type}/${id}`);
};


// --- Backend Database Simulation ---
// NOTE: In a production app, this client would be a real backend server (e.g., Node.js/Express)
// that securely connects to the MongoDB database using the MONGO_URI. The frontend would
// then make `fetch` calls to that server's API endpoints.

class MockDatabaseClient {
  private movies: StoredMovie[];
  private downloadCount: number;

  constructor(uri: string) {
    console.log(`Simulating connection to database with URI: ${uri}`);
    // Initialize with some default data
    this.movies = [
      {_id: '1', tmdb_id: 550, type: 'movie', title: 'Fight Club', download_links: [{label: '1080p BluRay', url: '#'}, {label: '720p WEB-DL', url: '#'}]},
      {_id: '2', tmdb_id: 1399, type: 'tv', title: 'Game of Thrones', download_links: [{label: 'S01-S08 Complete', url: '#'}]},
    ];
    this.downloadCount = 50;
    console.log("Mock Database Client connected and initialized.");
  }

  private simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

  async findMovieByTmdbId(tmdbId: number): Promise<StoredMovie | null> {
    await this.simulateDelay(100);
    return this.movies.find(m => m.tmdb_id === tmdbId) || null;
  }

  async getAllMovies(): Promise<StoredMovie[]> {
    await this.simulateDelay(400);
    return [...this.movies].sort((a,b) => a.title.localeCompare(b.title));
  }

  async saveMovie(movie: Omit<StoredMovie, '_id'>): Promise<StoredMovie> {
    await this.simulateDelay(500);
    const existing = this.movies.find(m => m.tmdb_id === movie.tmdb_id);
    if (existing) {
        // Update existing movie's links
        existing.download_links = movie.download_links;
        return existing;
    }
    const newMovie: StoredMovie = {
        _id: Date.now().toString(),
        ...movie,
    };
    this.movies.push(newMovie);
    return newMovie;
  }

  async deleteMovieById(id: string): Promise<void> {
    await this.simulateDelay(500);
    this.movies = this.movies.filter(m => m._id !== id);
  }

  async getMetrics(): Promise<Metrics> {
    await this.simulateDelay(200);
    return {
        totalLinks: this.movies.length,
        totalDownloads: this.downloadCount,
    };
  }
  
  incrementDownloads(movieId: string) {
    // This simulates a backend operation. No delay needed for this simple task.
    this.downloadCount++;
    console.log(`Download count incremented for movie ${movieId}. New total: ${this.downloadCount}`);
  }
}

// Initialize our mock database client with the URI from constants
const dbClient = new MockDatabaseClient(MONGO_URI);

// --- Exported API Functions ---
// These functions are what the rest of our frontend application uses.
// They call the methods on our `dbClient`, simulating calls to a backend API.

export const getStoredMovie = (tmdbId: number): Promise<StoredMovie | null> => {
    return dbClient.findMovieByTmdbId(tmdbId);
};

export const getStoredMovies = (): Promise<StoredMovie[]> => {
    return dbClient.getAllMovies();
};

export const addStoredMovie = (movie: Omit<StoredMovie, '_id'>): Promise<StoredMovie> => {
    return dbClient.saveMovie(movie);
};

export const deleteStoredMovie = (id: string): Promise<void> => {
    return dbClient.deleteMovieById(id);
};

export const getMetrics = (): Promise<Metrics> => {
    return dbClient.getMetrics();
};

export const incrementDownloadCount = (movieId: string) => {
    dbClient.incrementDownloads(movieId);
};
