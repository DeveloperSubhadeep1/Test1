import { Blob } from "@google/genai";

export interface MovieSummary {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
}

export interface TVSummary {
    id: number;
    name: string;
    poster_path: string | null;
    first_air_date: string;
    vote_average: number;
    overview: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface MovieDetail extends MovieSummary {
  genres: Genre[];
  runtime: number;
  tagline: string;
  vote_count: number;
}

export interface TVDetail extends TVSummary {
    genres: Genre[];
    episode_run_time: number[];
    tagline: string;
    vote_count: number;
}

export type ContentType = 'movie' | 'tv';

// FIX: Corrected ContentItem to be a proper discriminated union.
// This allows TypeScript to correctly infer whether an item is a movie or TV show
// based on the 'type' property, which resolves type errors in other components.
export type ContentItem = (MovieSummary & { type: 'movie' }) | (TVSummary & { type: 'tv' });

export type FavoriteItem = ContentItem & { _id?: string; dateAdded: number; };

export type WatchlistItem = ContentItem & { _id?: string; dateAdded: number; };

export type HistoryItem = ContentItem & { _id?: string; viewedAt: string; };

export type CollectionItem = Omit<ContentItem, 'overview'>;

export interface Collection {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  items: CollectionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DownloadLink {
  label: string;
  url: string;
  suggestedBy?: string;
}

export interface StoredMovie {
  _id: string;
  tmdb_id: number;
  type: ContentType;
  title: string;
  download_links: DownloadLink[];
  download_count: number;
}

export interface SupportTicket {
  _id: string;
  userId?: string;
  username?: string;
  subject: string;
  contentTitle?: string;
  message: string;
  timestamp: string; // ISO Date String
}

export interface Metrics {
    totalLinks: number;
    totalDownloads: number;
    totalSupportTickets: number;
    totalUsers: number;
    totalCollections: number;
}

export interface DbStats {
    usedBytes: number;
    totalBytes: number;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
}

export interface CreditsResponse {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface PersonDetails {
    id: number;
    name:string;
    biography: string;
    profile_path: string | null;
    known_for_department: string;
}

export type PersonCredit = (MovieSummary | TVSummary) & { media_type: 'movie' | 'tv' };

export type TMDBSearchResult = (MovieSummary & { media_type: 'movie' }) | (TVSummary & { media_type: 'tv' });

export interface UserProfile {
  _id: string;
  username: string;
  email?: string;
  avatar: string; // Avatar ID from DB
  customName?: string;
  dob?: string; // Stored as ISO string
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say' | '';
  createdAt?: string;
}

export interface AdminUserView extends UserProfile {
  favoritesCount: number;
  watchlistCount: number;
}

export interface Notification {
  _id: string;
  title: string;
  type: ContentType;
  tmdb_id: number;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface VideosResponse {
  results: Video[];
}