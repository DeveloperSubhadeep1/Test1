
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
}

export interface TVDetail extends TVSummary {
    genres: Genre[];
    episode_run_time: number[];
    tagline: string;
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
