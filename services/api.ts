
import {
  MovieSummary,
  TVSummary,
  MovieDetail,
  TVDetail,
  ContentType,
  StoredMovie,
  Metrics,
  CreditsResponse,
  PersonDetails,
  PersonCredit
} from '../types';
import { TMDB_API_KEY, TMDB_API_BASE_URL } from '../constants';

// --- Live TMDB API ---
const tmdbFetch = async (endpoint: string, params: Record<string, string> = {}) => {
    const urlParams = new URLSearchParams({
        api_key: TMDB_API_KEY,
        ...params,
    });
    const url = `${TMDB_API_BASE_URL}${endpoint}?${urlParams.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ status_message: response.statusText }));
        console.error(`TMDB API request failed for ${url}: ${errorData.status_message}`);
        throw new Error(errorData.status_message || `TMDB API request failed`);
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

export const getDiscover = async (type: ContentType, page: number = 1, sortBy: string = 'popularity.desc'): Promise<{ results: any[] }> => {
    const params: Record<string, string> = {
        page: page.toString(),
        sort_by: sortBy,
    };

    // Add a vote count threshold for top-rated queries to ensure quality
    if (sortBy === 'vote_average.desc') {
        params['vote_count.gte'] = '300';
    }

    return tmdbFetch(`/discover/${type}`, params);
};


export const getDetails = async (type: ContentType, id: number): Promise<MovieDetail | TVDetail> => {
    return tmdbFetch(`/${type}/${id}`);
};

export const getCredits = async (type: ContentType, id: number): Promise<CreditsResponse> => {
    return tmdbFetch(`/${type}/${id}/credits`);
};

export const getPersonDetails = async (id: number): Promise<PersonDetails> => {
    return tmdbFetch(`/person/${id}`);
};

export const getPersonCredits = async (id: number): Promise<{ cast: PersonCredit[] }> => {
    const data = await tmdbFetch(`/person/${id}/combined_credits`);
    // Filter out items without posters and sort by popularity for better "Known For" results
    const filteredCredits = data.cast.filter(
        (item: any) => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path
    ).sort((a: any, b: any) => b.popularity - a.popularity);
    return { cast: filteredCredits };
};


// --- Backend Database Service (using browser localStorage) ---

interface DbData {
    movies: StoredMovie[];
    downloadCount: number;
}

const LOCAL_DB_KEY = 'cineStreamLocalDb';

// Helper to update the entire database content in localStorage
const updateDbContent = async (data: DbData): Promise<void> => {
    try {
        localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Database write error (localStorage):", error);
        throw new Error('Failed to write to local database. Storage may be full.');
    }
};

// Helper to fetch the entire database content from localStorage
const getDbContent = async (): Promise<DbData> => {
    const defaultData: DbData = { movies: [], downloadCount: 0 };
    try {
        const storedData = localStorage.getItem(LOCAL_DB_KEY);
        if (storedData) {
            const data = JSON.parse(storedData);
            if (data && Array.isArray(data.movies) && typeof data.downloadCount === 'number') {
                 return data;
            }
        }
        return defaultData;
    } catch (error) {
        console.error("Database read error (localStorage):", error);
        throw new Error("Failed to read local database. It might be corrupted.");
    }
};

// --- Exported API Functions ---

export const getStoredMovie = async (tmdbId: number, type: ContentType): Promise<StoredMovie | null> => {
    const { movies } = await getDbContent();
    return movies.find(m => m.tmdb_id === tmdbId && m.type === type) || null;
};

export const getStoredMovies = async (): Promise<StoredMovie[]> => {
    const { movies } = await getDbContent();
    return [...movies].sort((a,b) => a.title.localeCompare(b.title));
};

export const addStoredMovie = async (movie: Omit<StoredMovie, '_id'>): Promise<StoredMovie> => {
    const db = await getDbContent();
    const existingIndex = db.movies.findIndex(m => m.tmdb_id === movie.tmdb_id && m.type === movie.type);
    
    let savedMovie: StoredMovie;

    if (existingIndex > -1) {
        db.movies[existingIndex].download_links = movie.download_links;
        savedMovie = db.movies[existingIndex];
    } else {
        const newMovie: StoredMovie = { _id: Date.now().toString(), ...movie };
        db.movies.push(newMovie);
        savedMovie = newMovie;
    }
    
    await updateDbContent(db);
    return savedMovie;
};

export const deleteStoredMovie = async (id: string): Promise<void> => {
    const db = await getDbContent();
    const initialLength = db.movies.length;
    db.movies = db.movies.filter(m => m._id !== id);
    if (db.movies.length === initialLength) {
        throw new Error("Could not find the movie to delete.");
    }
    await updateDbContent(db);
};

export const getMetrics = async (): Promise<Metrics> => {
    const db = await getDbContent();
    return {
        totalLinks: db.movies.length,
        totalDownloads: db.downloadCount,
    };
};

export const incrementDownloadCount = async (movieId: string): Promise<void> => {
    const db = await getDbContent();
    db.downloadCount++;
    await updateDbContent(db);
};
