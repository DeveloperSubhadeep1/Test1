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

// --- Local Storage Database Service ---

const STORED_MOVIES_KEY = 'cineStreamStoredMovies';
const SUPPORT_TICKETS_KEY = 'cineStreamSupportTickets';
const DOWNLOAD_COUNTS_KEY = 'cineStreamDownloadCounts';

const getFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Failed to parse ${key} from localStorage`, error);
        return defaultValue;
    }
};

const saveToStorage = <T,>(key: string, value: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Failed to save ${key} to localStorage`, error);
    }
};


export const getStoredMovie = async (tmdbId: number, type: ContentType): Promise<StoredMovie | null> => {
    const movies = getFromStorage<StoredMovie[]>(STORED_MOVIES_KEY, []);
    const foundMovie = movies.find(movie => movie.tmdb_id === tmdbId && movie.type === type) || null;
    return Promise.resolve(foundMovie);
};

export const getStoredMovies = async (): Promise<StoredMovie[]> => {
    return Promise.resolve(getFromStorage<StoredMovie[]>(STORED_MOVIES_KEY, []));
};

export const addStoredMovie = async (movie: Omit<StoredMovie, '_id'>): Promise<StoredMovie> => {
    const movies = getFromStorage<StoredMovie[]>(STORED_MOVIES_KEY, []);
    const newMovie: StoredMovie = {
        ...movie,
        _id: `${Date.now()}-${Math.random()}`,
    };
    movies.push(newMovie);
    saveToStorage(STORED_MOVIES_KEY, movies);
    return Promise.resolve(newMovie);
};

export const deleteStoredMovie = async (id: string): Promise<void> => {
    let movies = getFromStorage<StoredMovie[]>(STORED_MOVIES_KEY, []);
    movies = movies.filter(movie => movie._id !== id);
    saveToStorage(STORED_MOVIES_KEY, movies);
    return Promise.resolve();
};

export const getMetrics = async (): Promise<Metrics> => {
    const movies = getFromStorage<StoredMovie[]>(STORED_MOVIES_KEY, []);
    const tickets = getFromStorage<SupportTicket[]>(SUPPORT_TICKETS_KEY, []);
    const counts = getFromStorage<Record<string, number>>(DOWNLOAD_COUNTS_KEY, {});

    const totalLinks = movies.reduce((sum, movie) => sum + movie.download_links.length, 0);
    const totalDownloads = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const totalSupportTickets = tickets.length;

    return Promise.resolve({
        totalLinks,
        totalDownloads,
        totalSupportTickets,
    });
};

export const incrementDownloadCount = async (movieId: string): Promise<void> => {
    const counts = getFromStorage<Record<string, number>>(DOWNLOAD_COUNTS_KEY, {});
    counts[movieId] = (counts[movieId] || 0) + 1;
    saveToStorage(DOWNLOAD_COUNTS_KEY, counts);
    return Promise.resolve();
};

export const addSupportTicket = async (ticketData: Omit<SupportTicket, '_id' | 'timestamp'>): Promise<SupportTicket> => {
    const tickets = getFromStorage<SupportTicket[]>(SUPPORT_TICKETS_KEY, []);
    const newTicket: SupportTicket = {
        ...ticketData,
        _id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
    };
    tickets.push(newTicket);
    saveToStorage(SUPPORT_TICKETS_KEY, tickets);
    return Promise.resolve(newTicket);
};

export const getSupportTickets = async (): Promise<SupportTicket[]> => {
    return Promise.resolve(getFromStorage<SupportTicket[]>(SUPPORT_TICKETS_KEY, []));
};

export const deleteSupportTicket = async (id: string): Promise<void> => {
    let tickets = getFromStorage<SupportTicket[]>(SUPPORT_TICKETS_KEY, []);
    tickets = tickets.filter(ticket => ticket._id !== id);
    saveToStorage(SUPPORT_TICKETS_KEY, tickets);
    return Promise.resolve();
};