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
  Genre,
  UserProfile,
  FavoriteItem,
  WatchlistItem,
  ContentItem,
  DownloadLink,
  AdminUserView,
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

export const searchTMDB = async (query: string): Promise<{ results: (MovieSummary | TVSummary)[] }> => {
    const data = await tmdbFetch('/search/multi', { query });
    // Filter out people and items without posters for a cleaner UI
    const filteredResults = data.results.filter(
        (item: any) => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path
    );
    return { results: filteredResults };
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
    
    const sessionUser = sessionStorage.getItem('cineStreamSession');
    const user = sessionUser ? JSON.parse(sessionUser) : null;

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
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }
    
    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
        return null;
    }
    return response.json();
};

// --- Auth ---
export const apiLogin = (username: string, pass: string): Promise<UserProfile> => dbFetch('/auth/login', { method: 'POST', body: JSON.stringify({ username, password: pass }) });

export const apiSendOtp = (username: string, email: string, pass: string): Promise<{ message: string }> => 
    dbFetch('/auth/send-otp', { method: 'POST', body: JSON.stringify({ username, email, password: pass }) });

export const apiSignup = (username: string, otp: string): Promise<UserProfile> => 
    dbFetch('/auth/signup', { method: 'POST', body: JSON.stringify({ username, otp }) });

export const apiUpdateProfile = (userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> => dbFetch(`/users/${userId}`, { method: 'PATCH', body: JSON.stringify(profileData) });

// --- Admin ---
export const getStoredMovie = async (tmdbId: number, type: ContentType): Promise<StoredMovie | null> => {
    const results = await dbFetch(`/stored-movies/find?tmdbId=${tmdbId}&type=${type}`);
    return results;
};
export const getStoredMovies = (): Promise<StoredMovie[]> => dbFetch('/stored-movies');
export const addStoredMovie = (movie: Omit<StoredMovie, '_id'>): Promise<StoredMovie> => dbFetch('/stored-movies', { method: 'POST', body: JSON.stringify(movie) });
export const updateStoredMovie = (id: string, movieData: { download_links: DownloadLink[] }): Promise<StoredMovie> => 
    dbFetch(`/stored-movies/${id}`, { method: 'PATCH', body: JSON.stringify(movieData) });
export const deleteStoredMovie = (id: string): Promise<void> => dbFetch(`/stored-movies/${id}`, { method: 'DELETE' });
export const getSupportTickets = (): Promise<SupportTicket[]> => dbFetch('/support-tickets');
export const deleteSupportTicket = (id: string): Promise<void> => dbFetch(`/support-tickets/${id}`, { method: 'DELETE' });
export const addSupportTicket = (ticketData: Omit<SupportTicket, '_id' | 'timestamp'>): Promise<SupportTicket> => dbFetch('/support-tickets', { method: 'POST', body: JSON.stringify(ticketData) });
export const getMetrics = (): Promise<Metrics> => dbFetch('/metrics');
export const incrementDownloadCount = (movieId: string): Promise<void> => dbFetch(`/stored-movies/${movieId}/increment`, { method: 'PATCH' });
export const getUsers = (): Promise<AdminUserView[]> => dbFetch('/users');
export const apiTestEmail = (): Promise<{ success: boolean; message: string }> => dbFetch('/admin/test-email', { method: 'POST' });

// --- User Lists (Favorites & Watchlist) ---
export const getFavorites = (): Promise<FavoriteItem[]> => dbFetch('/favorites');
export const addFavorite = (item: ContentItem): Promise<FavoriteItem> => dbFetch('/favorites', { method: 'POST', body: JSON.stringify(item) });
export const removeFavorite = (id: string): Promise<void> => dbFetch(`/favorites/${id}`, { method: 'DELETE' });

export const getWatchlist = (): Promise<WatchlistItem[]> => dbFetch('/watchlist');
export const addToWatchlist = (item: ContentItem): Promise<WatchlistItem> => dbFetch('/watchlist', { method: 'POST', body: JSON.stringify(item) });
export const removeFromWatchlist = (id: string): Promise<void> => dbFetch(`/watchlist/${id}`, { method: 'DELETE' });