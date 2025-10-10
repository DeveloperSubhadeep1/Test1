import {
  MovieSummary,
  TVSummary,
  MovieDetail,
  TVDetail,
  ContentType,
  StoredMovie,
  SupportTicket,
  Metrics,
  CreditsResponse,
  PersonDetails,
  PersonCredit,
  Genre
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

export const findIdBySlug = async (type: ContentType, slug: string): Promise<number | null> => {
    // Regex to find a 4-digit year at the end of the slug
    const slugRegex = /^(.*)-(\d{4})$/;
    const match = slug.match(slugRegex);

    let query: string;
    let year: string | undefined;

    if (match && match[1] && match[2]) {
        // We have a title and a year
        query = match[1].replace(/-/g, ' ');
        year = match[2];
    } else {
        // Fallback for old slugs or slugs without a year
        query = slug.replace(/-/g, ' ');
        year = undefined;
    }

    const searchParams: Record<string, string> = { query };
    if (year) {
        if (type === 'movie') {
            searchParams.primary_release_year = year;
        } else { // tv
            searchParams.first_air_date_year = year;
        }
    }

    const data = await tmdbFetch(`/search/${type}`, searchParams);
    
    if (data.results && data.results.length > 0) {
        // If we have a year, the first result with that year is likely the correct one.
        // TMDB's search with year filter is quite effective.
        // If no year, the first result is the best guess.
        return data.results[0].id;
    }
    
    // If search with year yielded no results, try searching without the year as a fallback
    // This helps if the year in the slug is slightly off from TMDB's data
    if (year) {
        const fallbackData = await tmdbFetch(`/search/${type}`, { query });
        if (fallbackData.results && fallbackData.results.length > 0) {
            return fallbackData.results[0].id;
        }
    }

    return null;
}

export const findPersonIdBySlug = async (slug: string): Promise<number | null> => {
    const query = slug.replace(/-/g, ' ');
    const data = await tmdbFetch('/search/person', { query });
    if (data.results && data.results.length > 0) {
        // Assume the first result is the best match
        return data.results[0].id;
    }
    return null;
}

export const getTrending = async (type: ContentType, page: number = 1): Promise<{ results: any[] }> => {
    return tmdbFetch(`/trending/${type}/week`, { page: page.toString() });
};

export const getDiscover = async (
    type: ContentType,
    page: number = 1,
    sortBy: string = 'popularity.desc',
    genreId?: string,
    year?: string,
    ratingGte?: number
): Promise<{ results: any[] }> => {
    const params: Record<string, string> = {
        page: page.toString(),
        sort_by: sortBy,
    };

    if (genreId) {
        params['with_genres'] = genreId;
    }

    if (year) {
        if (type === 'movie') {
            params['primary_release_year'] = year;
        } else {
            params['first_air_date_year'] = year;
        }
    }

    if (ratingGte && ratingGte > 0) {
        params['vote_average.gte'] = ratingGte.toString();
    }

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

let movieGenresCache: Genre[] | null = null;
const getMovieGenres = async (): Promise<Genre[]> => {
    if (movieGenresCache) {
        return movieGenresCache;
    }
    const data = await tmdbFetch('/genre/movie/list');
    if (data && data.genres) {
        movieGenresCache = data.genres;
        return data.genres;
    }
    return [];
};

let tvGenresCache: Genre[] | null = null;
const getTVGenres = async (): Promise<Genre[]> => {
    if (tvGenresCache) {
        return tvGenresCache;
    }
    const data = await tmdbFetch('/genre/tv/list');
    if (data && data.genres) {
        tvGenresCache = data.genres;
        return data.genres;
    }
    return [];
}

let allGenresCache: Genre[] | null = null;
export const getAllGenres = async (): Promise<Genre[]> => {
    if (allGenresCache) {
        return allGenresCache;
    }

    try {
        const [movieGenres, tvGenres] = await Promise.all([
            getMovieGenres(),
            getTVGenres(),
        ]);

        const allGenresMap = new Map<number, string>();
        movieGenres.forEach(genre => allGenresMap.set(genre.id, genre.name));
        tvGenres.forEach(genre => allGenresMap.set(genre.id, genre.name));

        const combinedGenres: Genre[] = Array.from(allGenresMap, ([id, name]) => ({ id, name }));

        combinedGenres.sort((a, b) => a.name.localeCompare(b.name));

        allGenresCache = combinedGenres;
        return combinedGenres;
    } catch (error) {
        console.error("Failed to fetch and combine genres", error);
        return [];
    }
};

// --- Simulated Server-Side Database Service (for Admin Data) ---

// #region INSTRUCTIONS FOR SETTING UP YOUR OWN BACKEND
// IMPORTANT: To enable cross-device data syncing for the admin panel, you need a free JSONBin.io account.
// This service will act as a simple cloud database.
//
// 1. Go to https://jsonbin.io/ and create a free account.
//
// 2. On your dashboard, find your "API Access Keys" section and copy your master API key.
//    Paste it below to replace the placeholder 'YOUR_API_KEY_HERE'.
//
// 3. Go to the "Bins" section and create a new, private bin.
//
// 4. Paste the following JSON structure into your new bin and save it:
//    {
//      "storedMovies": [],
//      "supportTickets": [],
//      "downloadCounts": {}
//    }
//
// 5. After saving, copy the Bin ID from the URL (it's the part after '.../b/').
//    Paste it below to replace the placeholder 'YOUR_BIN_ID_HERE'.
//
// That's it! Your admin data will now be stored and synced in the cloud.
// For a real production app, use a secure, managed database and a proper backend API.
// #endregion
const JSONBIN_API_KEY = 'YOUR_API_KEY_HERE';
const JSONBIN_BIN_ID = 'YOUR_BIN_ID_HERE';
const JSONBIN_BASE_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

interface CineStreamDB {
    storedMovies: StoredMovie[];
    supportTickets: SupportTicket[];
    downloadCounts: Record<string, number>;
}

// Fetches the entire database from JSONBin
const getDb = async (): Promise<CineStreamDB> => {
    if (JSONBIN_API_KEY === 'YOUR_API_KEY_HERE' || JSONBIN_BIN_ID === 'YOUR_BIN_ID_HERE') {
        console.warn("JSONBin.io is not configured. Admin data will not be saved. See instructions in services/api.ts.");
        // Return a default, empty DB structure to prevent the app from crashing.
        return { storedMovies: [], supportTickets: [], downloadCounts: {} };
    }
    const response = await fetch(`${JSONBIN_BASE_URL}/latest`, {
        headers: { 'X-Master-Key': JSONBIN_API_KEY }
    });
    if (!response.ok) throw new Error('Failed to fetch from DB. Check your JSONBin credentials and Bin ID.');
    const data = await response.json();
    return data.record;
};

// Updates the entire database on JSONBin
const updateDb = async (db: CineStreamDB): Promise<void> => {
    if (JSONBIN_API_KEY === 'YOUR_API_KEY_HERE' || JSONBIN_BIN_ID === 'YOUR_BIN_ID_HERE') {
        return; // Do not attempt to save if not configured
    }
    const response = await fetch(JSONBIN_BASE_URL, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': JSONBIN_API_KEY,
        },
        body: JSON.stringify(db),
    });
    if (!response.ok) throw new Error('Failed to update DB.');
};

export const getStoredMovie = async (tmdbId: number, type: ContentType): Promise<StoredMovie | null> => {
    const db = await getDb();
    return db.storedMovies.find(movie => movie.tmdb_id === tmdbId && movie.type === type) || null;
};

export const getStoredMovies = async (): Promise<StoredMovie[]> => {
    const db = await getDb();
    return db.storedMovies;
};

export const addStoredMovie = async (movie: Omit<StoredMovie, '_id'>): Promise<StoredMovie> => {
    const db = await getDb();
    const newMovie: StoredMovie = {
        ...movie,
        _id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    db.storedMovies.push(newMovie);
    await updateDb(db);
    return newMovie;
};

export const deleteStoredMovie = async (id: string): Promise<void> => {
    const db = await getDb();
    db.storedMovies = db.storedMovies.filter(movie => movie._id !== id);
    await updateDb(db);
};

export const getMetrics = async (): Promise<Metrics> => {
    const db = await getDb();
    const totalLinks = db.storedMovies.reduce((sum, movie) => sum + movie.download_links.length, 0);
    const totalDownloads = Object.values(db.downloadCounts).reduce((sum, count) => sum + count, 0);
    const totalSupportTickets = db.supportTickets.length;
    return { totalLinks, totalDownloads, totalSupportTickets };
};

export const incrementDownloadCount = async (movieId: string): Promise<void> => {
    const db = await getDb();
    db.downloadCounts[movieId] = (db.downloadCounts[movieId] || 0) + 1;
    await updateDb(db);
};

export const addSupportTicket = async (ticketData: Omit<SupportTicket, '_id' | 'timestamp'>): Promise<SupportTicket> => {
    const db = await getDb();
    const newTicket: SupportTicket = {
        ...ticketData,
        _id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
    };
    db.supportTickets.push(newTicket);
    await updateDb(db);
    return newTicket;
};

export const getSupportTickets = async (): Promise<SupportTicket[]> => {
    const db = await getDb();
    return db.supportTickets;
};

export const deleteSupportTicket = async (id: string): Promise<void> => {
    const db = await getDb();
    db.supportTickets = db.supportTickets.filter(ticket => ticket._id !== id);
    await updateDb(db);
};
