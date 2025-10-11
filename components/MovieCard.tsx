import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { MovieSummary, TVSummary } from '../types';
import { TMDB_IMAGE_BASE_URL_MEDIUM } from '../constants';
import { WatchlistContext } from '../context/WatchlistContext';
import { StarIcon, CalendarIcon, BookmarkIcon, FilmIcon, TvIcon } from './Icons';
import { generateSlug } from '../utils';

interface MovieCardProps {
  item: MovieSummary | TVSummary;
  type: 'movie' | 'tv';
}

const MovieCard: React.FC<MovieCardProps> = ({ item, type }) => {
  const { addToWatchlist, removeFromWatchlist, isOnWatchlist } = useContext(WatchlistContext);

  const title = 'title' in item ? item.title : item.name;
  const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : undefined;
  const rating = item.vote_average.toFixed(1);
  const slug = generateSlug(title, year);
  const linkTo = `/${type}/${slug}`;
  const onWl = isOnWatchlist(item.id);

  const posterUrl = item.poster_path
    ? `${TMDB_IMAGE_BASE_URL_MEDIUM}${item.poster_path}`
    : 'https://picsum.photos/500/750';

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const watchlistItem = { ...item, type };
    if (onWl) {
      removeFromWatchlist(item.id);
    } else {
      addToWatchlist(watchlistItem);
    }
  };

  return (
    <Link to={linkTo} className="group bg-light-secondary dark:bg-secondary rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 block">
      <div className="relative">
        <img src={posterUrl} alt={title} className="w-full h-auto object-cover aspect-[2/3]" loading="lazy"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div 
          className="absolute top-2 left-2 z-10 p-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white"
          title={type === 'movie' ? 'Movie' : 'TV Show'}
        >
          {type === 'movie' ? (
            <FilmIcon className="h-4 w-4" />
          ) : (
            <TvIcon className="h-4 w-4" />
          )}
        </div>
        <button
          onClick={handleWatchlistToggle}
          className="absolute top-2 right-2 z-10 p-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white transition-all duration-300 hover:bg-light-accent/80 dark:hover:bg-accent/80"
          title={onWl ? 'Remove from watchlist' : 'Add to watchlist'}
          aria-label="Toggle Watchlist"
        >
          <BookmarkIcon className={`h-5 w-5 ${onWl ? 'fill-accent stroke-accent' : ''}`} />
        </button>
        <div className="absolute bottom-0 left-0 p-4">
          <h3 className="text-white font-bold text-lg group-hover:text-accent transition-colors">{title}</h3>
          <div className="flex items-center text-gray-300 dark:text-muted text-sm mt-1 space-x-4">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1"/>
              <span>{year || 'N/A'}</span>
            </div>
            <div className="flex items-center">
              <StarIcon className="h-4 w-4 mr-1 text-yellow-400"/>
              <span>{rating}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;