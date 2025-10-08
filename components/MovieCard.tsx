
import React from 'react';
import { Link } from 'react-router-dom';
import { MovieSummary, TVSummary } from '../types';
import { TMDB_IMAGE_BASE_URL } from '../constants';
import { StarIcon, CalendarIcon } from './Icons';

interface MovieCardProps {
  item: MovieSummary | TVSummary;
  type: 'movie' | 'tv';
}

const MovieCard: React.FC<MovieCardProps> = ({ item, type }) => {
  const title = 'title' in item ? item.title : item.name;
  const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
  const rating = item.vote_average.toFixed(1);
  const linkTo = `/${type}/${item.id}`;

  const posterUrl = item.poster_path
    ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}`
    : 'https://picsum.photos/500/750';

  return (
    <Link to={linkTo} className="group bg-secondary rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 block">
      <div className="relative">
        <img src={posterUrl} alt={title} className="w-full h-auto object-cover aspect-[2/3]" loading="lazy"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-4">
          <h3 className="text-white font-bold text-lg group-hover:text-accent transition-colors">{title}</h3>
          <div className="flex items-center text-muted text-sm mt-1 space-x-4">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1"/>
              <span>{year}</span>
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
