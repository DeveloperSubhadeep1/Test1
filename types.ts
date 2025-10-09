
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

export type FavoriteItem = (MovieSummary | TVSummary) & { type: ContentType };

export interface DownloadLink {
  label: string;
  url: string;
}

export interface StoredMovie {
  _id: string;
  tmdb_id: number;
  type: ContentType;
  title: string;
  download_links: DownloadLink[];
}

export interface Metrics {
    totalLinks: number;
    totalDownloads: number;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface CreditsResponse {
  cast: CastMember[];
}

export interface PersonDetails {
    id: number;
    name:string;
    biography: string;
    profile_path: string | null;
    known_for_department: string;
}

export type PersonCredit = (MovieSummary | TVSummary) & { media_type: 'movie' | 'tv' };