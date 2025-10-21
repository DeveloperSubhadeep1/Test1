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
  TMDBSearchResult,
  Genre,
  UserProfile,
  HistoryItem,
  ContentItem,
  DownloadLink,
  AdminUserView,
  Notification,
  Collection,
  CollectionItem,
  FavoriteItem,
  WatchlistItem,
  DbStats,
  VideosResponse,
} from '../types';
import { TMDB_API_KEY, TMDB_API_BASE_URL, DB_BASE_URL } from '../constants';

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

export const searchTMDB = async (query: string): Promise<{ results: TMDBSearchResult[] }> => {
    const data = await tmdbFetch('/search/multi', { query });
    // Filter out people and items without posters for a cleaner UI
    const filteredResults = data.results.filter(
        (item: any) => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path
    );
    return { results: filteredResults };
};

export const searchContentByType = async (query: string, type: ContentType): Promise<{ results: (MovieSummary | TVSummary)[] }> => {
    const data = await tmdbFetch(`/search/${type}`, { query });
    // Filter out items without posters for a cleaner UI
    return { results: data.results.filter((item: any) => item.poster_path) };
};

export const findIdBySlug = async (type: ContentType, slug: string): Promise<number | null> => {
    const slugRegex = /^(.*)-(\d{4})$/;
    const match = slug.match(slugRegex);
    let query: string;
    let year: string | undefined;

    if (match && match[1] && match[2]) {
        query = match[1].replace(/-/g, ' ');
        year = match[2];
    } else {
        query = slug.replace(/-/g, ' ');
        year = undefined;
    }

    const searchParams: Record<string, string> = { query };
    if (year) {
        searchParams[type === 'movie' ? 'primary_release_year' : 'first_air_date_year'] = year;
    }

    const data = await tmdbFetch(`/search/${type}`, searchParams);
    
    if (data.results && data.results.length > 0) return data.results[0].id;
    
    if (year) {
        const fallbackData = await tmdbFetch(`/search/${type}`, { query });
        if (fallbackData.results && fallbackData.results.length > 0) return fallbackData.results[0].id;
    }

    return null;
}

export const findPersonIdBySlug = async (slug: string): Promise<number | null> => {
    const query = slug.replace(/-/g, ' ');
    const data = await tmdbFetch('/search/person', { query });
    if (data.results && data.results.length > 0) return data.results[0].id;
    return null;
}

export const getDiscover = async (
    type: ContentType, page: number = 1, sortBy: string = 'popularity.desc', genreId?: string
): Promise<{ results: any[] }> => {
    const params: Record<string, string> = { page: page.toString(), sort_by: sortBy };
    if (genreId) params['with_genres'] = genreId;
    if (sortBy === 'vote_average.desc') params['vote_count.gte'] = '300';
    return tmdbFetch(`/discover/${type}`, params);
};


export const getDetails = async (type: ContentType, id: number): Promise<MovieDetail | TVDetail> => tmdbFetch(`/${type}/${id}`);
export const getCredits = async (type: ContentType, id: number): Promise<CreditsResponse> => tmdbFetch(`/${type}/${id}/credits`);
export const getVideos = async (type: ContentType, id: number): Promise<VideosResponse> => tmdbFetch(`/${type}/${id}/videos`, { language: 'en-US' });
export const getPersonDetails = async (id: number): Promise<PersonDetails> => tmdbFetch(`/person/${id}`);
export const getPersonCredits = async (id: number): Promise<{ cast: PersonCredit[] }> => {
    const data = await tmdbFetch(`/person/${id}/combined_credits`);
    return { 
        cast: data.cast.filter((item: any) => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path)
                         .sort((a: any, b: any) => b.popularity - a.popularity)
    };
};

let allGenresCache: Genre[] | null = null;
export const getAllGenres = async (): Promise<Genre[]> => {
    if (allGenresCache) return allGenresCache;
    try {
        const [movieGenresRes, tvGenresRes] = await Promise.all([
            tmdbFetch('/genre/movie/list'), tmdbFetch('/genre/tv/list'),
        ]);
        const allGenresMap = new Map<number, string>();
        [...movieGenresRes.genres, ...tvGenresRes.genres].forEach((g: Genre) => allGenresMap.set(g.id, g.name));
        const combined = Array.from(allGenresMap, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
        allGenresCache = combined;
        return combined;
    } catch (error) {
        console.error("Failed to fetch genres", error);
        return [];
    }
};

// --- Server-Side Database Service ---
const dbFetch = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${DB_BASE_URL}${endpoint}`;
    
    const userJson = localStorage.getItem('cineStreamUser');
    const user = userJson ? JSON.parse(userJson) : null;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers ? Object.fromEntries(new Headers(options.headers)) : {}),
    };
    
    if (user && user._id) {
        headers['x-user-id'] = user._id;
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        
        // When the server returns a 404 for a user that doesn't exist, it means the client's session is invalid.
        // Dispatch a global event so the AuthContext can catch it and log the user out automatically.
        if (response.status === 404 && errorData.message?.includes('User not found')) {
            window.dispatchEvent(new CustomEvent('invalid-session'));
        }

        throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }
    
    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
        return null;
    }
    return response.json();
};

// --- Utils ---
export const apiParseUrl = (url: string): Promise<{
    movieName: string;
    year: number | null;
    languages: string[];
    quality: string | null;
    size: string | null;
    season: number | null;
    episode: number | null;
}> => dbFetch('/utils/parse-url', { method: 'POST', body: JSON.stringify({ url }) });


// --- Notifications ---
export const getNotifications = async (): Promise<Notification[]> => {
    const data = await dbFetch('/notifications');
    return data || [];
};

// --- Auth & User Profile ---
export const apiLogin = (username: string, pass: string, turnstileToken: string): Promise<UserProfile> => dbFetch('/auth/login', { method: 'POST', body: JSON.stringify({ username, password: pass, turnstileToken }) });

export const apiSendOtp = (username: string, email: string, pass: string, turnstileToken: string): Promise<{ message: string }> => 
    dbFetch('/auth/send-otp', { method: 'POST', body: JSON.stringify({ username, email, password: pass, turnstileToken }) });

export const apiSignup = (username: string, otp: string): Promise<UserProfile> => 
    dbFetch('/auth/signup', { method: 'POST', body: JSON.stringify({ username, otp }) });

export const apiSendResetOtp = (email: string, turnstileToken: string): Promise<{ message: string }> => 
    dbFetch('/auth/send-reset-otp', { method: 'POST', body: JSON.stringify({ email, turnstileToken }) });

export const apiResetPassword = (email: string, otp: string, newPassword: string): Promise<{ message: string }> => 
    dbFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, otp, newPassword }) });

export const apiUpdateUserProfile = (details: Partial<Omit<UserProfile, 'customAvatar'>>): Promise<UserProfile> =>
    dbFetch('/users/profile', { method: 'PATCH', body: JSON.stringify(details) });

// --- Admin ---
export const getStoredMovie = async (tmdbId: number, type: ContentType): Promise<StoredMovie | null> => {
    const results = await dbFetch(`/stored-movies/find?tmdbId=${tmdbId}&type=${type}`);
    return results;
};
export const getStoredMovies = async (): Promise<StoredMovie[]> => {
    const data = await dbFetch('/stored-movies');
    return data || [];
};
export const addStoredMovie = (movie: Omit<StoredMovie, '_id'>): Promise<StoredMovie> => dbFetch('/stored-movies', { method: 'POST', body: JSON.stringify(movie) });
export const updateStoredMovie = (id: string, movieData: { download_links: DownloadLink[] }): Promise<StoredMovie> => 
    dbFetch(`/stored-movies/${id}`, { method: 'PATCH', body: JSON.stringify(movieData) });
export const deleteStoredMovie = (id: string): Promise<void> => dbFetch(`/stored-movies/${id}`, { method: 'DELETE' });
export const getSupportTickets = async (): Promise<SupportTicket[]> => {
    const data = await dbFetch('/support-tickets');
    return data || [];
};
export const deleteSupportTicket = (id: string): Promise<void> => dbFetch(`/support-tickets/${id}`, { method: 'DELETE' });
export const addSupportTicket = (ticketData: Omit<SupportTicket, '_id' | 'timestamp'>, turnstileToken: string): Promise<SupportTicket> => dbFetch('/support-tickets', { method: 'POST', body: JSON.stringify({ ...ticketData, turnstileToken }) });
export const getMetrics = (): Promise<Metrics> => dbFetch('/metrics');
export const getDbStats = (): Promise<DbStats> => dbFetch('/db-stats');
export const incrementDownloadCount = (movieId: string): Promise<void> => dbFetch(`/stored-movies/${movieId}/increment`, { method: 'PATCH' });
export const getUsers = async (): Promise<AdminUserView[]> => {
    const data = await dbFetch('/users');
    return data || [];
};
export const apiTestEmail = (): Promise<{ success: boolean; message: string }> => dbFetch('/admin/test-email', { method: 'POST' });

// --- User Lists (Favorites, Watchlist, History) ---
// Favorites
export const getFavorites = async (): Promise<FavoriteItem[]> => {
    const data = await dbFetch('/favorites');
    return data || [];
};
export const addFavorite = (item: ContentItem): Promise<FavoriteItem> => dbFetch('/favorites', { method: 'POST', body: JSON.stringify(item) });
export const removeFavorite = (tmdbId: number): Promise<void> => dbFetch(`/favorites/${tmdbId}`, { method: 'DELETE' });

// Watchlist
export const getWatchlist = async (): Promise<WatchlistItem[]> => {
    const data = await dbFetch('/watchlist');
    return data || [];
};
export const addToWatchlist = (item: ContentItem): Promise<WatchlistItem> => dbFetch('/watchlist', { method: 'POST', body: JSON.stringify(item) });
export const removeFromWatchlist = (tmdbId: number): Promise<void> => dbFetch(`/watchlist/${tmdbId}`, { method: 'DELETE' });


// History
export const getHistory = async (): Promise<HistoryItem[]> => {
    const data = await dbFetch('/history');
    return data || [];
};
export const addToHistory = (item: ContentItem): Promise<HistoryItem> => dbFetch('/history', { method: 'POST', body: JSON.stringify(item) });
export const clearHistory = (): Promise<void> => dbFetch('/history', { method: 'DELETE' });

// --- Collections ---
export const getMyCollections = async (): Promise<Collection[]> => {
    const data = await dbFetch('/collections/user');
    return data || [];
};
export const getCollectionDetails = (id: string): Promise<Collection> => dbFetch(`/collections/${id}`);
export const createCollection = (data: { name: string; description?: string; isPublic: boolean }): Promise<Collection> => dbFetch('/collections', { method: 'POST', body: JSON.stringify(data) });
export const updateCollection = (id: string, data: { name?: string; description?: string; isPublic?: boolean }): Promise<Collection> => dbFetch(`/collections/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteCollection = (id: string): Promise<void> => dbFetch(`/collections/${id}`, { method: 'DELETE' });
export const addItemToCollection = (collectionId: string, item: CollectionItem): Promise<Collection> => dbFetch(`/collections/${collectionId}/items`, { method: 'POST', body: JSON.stringify(item) });
export const removeItemFromCollection = (collectionId: string, tmdbId: number): Promise<Collection> => dbFetch(`/collections/${collectionId}/items/${tmdbId}`, { method: 'DELETE' });