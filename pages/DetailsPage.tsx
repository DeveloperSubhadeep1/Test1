import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { getDetails, getStoredMovie, incrementDownloadCount, getCredits } from '../services/api';
import { ContentType, MovieDetail, StoredMovie, TVDetail, MovieSummary, TVSummary, CastMember } from '../types';
import { TMDB_IMAGE_BASE_URL } from '../constants';
import { FavoritesContext } from '../context/FavoritesContext';
import Spinner from '../components/Spinner';
import AdPlaceholder from '../components/AdPlaceholder';
import CastCard from '../components/CastCard';
import { StarIcon, CalendarIcon, ClockIcon, DownloadIcon, HeartIcon } from '../components/Icons';

interface DetailsPageProps {
  type: ContentType;
}

const DetailsPage: React.FC<DetailsPageProps> = ({ type }) => {
  const { id } = useParams<{ id: string }>();
  const [details, setDetails] = useState<MovieDetail | TVDetail | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [storedMovie, setStoredMovie] = useState<StoredMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const { addFavorite, removeFavorite, isFavorite } = useContext(FavoritesContext);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const tmdbId = parseInt(id, 10);
        const [detailsData, storedData, creditsData] = await Promise.all([
          getDetails(type, tmdbId),
          getStoredMovie(tmdbId, type),
          getCredits(type, tmdbId)
        ]);
        setDetails(detailsData);
        setStoredMovie(storedData);
        setCast(creditsData.cast.slice(0, 18)); // Get top 18 cast members for the grid
      } catch (error) {
        console.error('Failed to fetch details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, type]);

  const handleDownloadClick = async (url: string) => {
    if (storedMovie) {
      await incrementDownloadCount(storedMovie._id);
      window.open(url, '_blank');
    }
  };

  const handleFavoriteToggle = () => {
    if (!details) return;

    const favoriteItem = { ...details, type: type } as (MovieSummary | TVSummary) & {type: ContentType};
    
    if (isFavorite(details.id)) {
      removeFavorite(details.id);
    } else {
      addFavorite(favoriteItem);
    }
  };

  if (loading) return <Spinner />;
  if (!details) return <p>Content not found.</p>;
  
  const isFav = isFavorite(details.id);
  const title = 'title' in details ? details.title : details.name;
  const releaseDate = 'release_date' in details ? details.release_date : details.first_air_date;
  const runtime = 'runtime' in details ? details.runtime : (details.episode_run_time?.[0] || 0);

  const posterUrl = details.poster_path
    ? `${TMDB_IMAGE_BASE_URL}${details.poster_path}`
    : 'https://picsum.photos/500/750';

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="md:w-1/3 flex-shrink-0">
        <img src={posterUrl} alt={title} className="rounded-lg shadow-2xl w-full" />
      </div>
      <div className="md:w-2/3">
        <div className="flex items-start justify-between">
            <h1 className="text-4xl font-bold text-white">{title}</h1>
            <button
              onClick={handleFavoriteToggle}
              title={isFav ? 'Remove from favorites' : 'Add to favorites'}
              className="p-2 bg-secondary rounded-full hover:bg-gray-700 transition-colors"
              aria-label="Toggle Favorite"
            >
              <HeartIcon className={`h-6 w-6 transition-all ${isFav ? 'fill-red-500 stroke-red-500' : 'text-muted'}`} />
            </button>
        </div>

        {details.tagline && <p className="text-muted italic mt-1">"{details.tagline}"</p>}
        <div className="flex items-center space-x-4 my-4 text-muted">
          <div className="flex items-center">
            <StarIcon className="h-5 w-5 mr-1 text-yellow-400" />
            <span className="font-bold text-white">{details.vote_average.toFixed(1)}</span> / 10
          </div>
          <div className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-1" />
            <span>{new Date(releaseDate).getFullYear()}</span>
          </div>
          {runtime > 0 && (
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 mr-1" />
              <span>{runtime} min{type === 'tv' && ' / episode'}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 my-4">
          {details.genres.map(genre => (
            <span key={genre.id} className="bg-secondary px-3 py-1 text-xs font-semibold rounded-full">{genre.name}</span>
          ))}
        </div>
        <h2 className="text-xl font-semibold mt-6 mb-2">Overview</h2>
        <p className="text-gray-300 leading-relaxed">{details.overview}</p>

        {cast.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Cast</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {cast.map(person => (
                <CastCard key={person.id} person={person} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <AdPlaceholder width="w-full" height="h-24" label="In-article Ad" />
        </div>

        <div className="mt-8 bg-secondary p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Download Links</h2>
          {storedMovie && storedMovie.download_links.length > 0 ? (
            <div className="space-y-3">
              {storedMovie.download_links.map((link, index) => (
                <button
                  key={index}
                  onClick={() => handleDownloadClick(link.url)}
                  className="w-full flex items-center justify-between bg-highlight text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors duration-300"
                >
                  <span>{link.label}</span>
                  <DownloadIcon className="h-6 w-6" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-muted">No download links available yet. Please check back later.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailsPage;