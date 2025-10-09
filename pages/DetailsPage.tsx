import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { getDetails, getStoredMovie, incrementDownloadCount, getCredits, findIdBySlug } from '../services/api';
import { ContentType, MovieDetail, StoredMovie, TVDetail, CastMember, ContentItem } from '../types';
import { TMDB_IMAGE_BASE_URL } from '../constants';
import { FavoritesContext } from '../context/FavoritesContext';
import { WatchlistContext } from '../context/WatchlistContext';
import { useToast } from '../hooks/useToast';
import { usePageMetadata } from '../hooks/usePageMetadata';
import Spinner from '../components/Spinner';
import TelegramAd from '../components/TelegramAd';
import CastCard from '../components/CastCard';
import { StarIcon, CalendarIcon, ClockIcon, DownloadIcon, HeartIcon, BookmarkIcon } from '../components/Icons';

interface DetailsPageProps {
  type: ContentType;
}

const DetailsPage: React.FC<DetailsPageProps> = ({ type }) => {
  const { slug } = useParams<{ slug: string }>();
  const [details, setDetails] = useState<MovieDetail | TVDetail | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [storedMovie, setStoredMovie] = useState<StoredMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const { addFavorite, removeFavorite, isFavorite } = useContext(FavoritesContext);
  const { addToWatchlist, removeFromWatchlist, isOnWatchlist } = useContext(WatchlistContext);
  const { addToast } = useToast();
  
  const title = details ? ('title' in details ? details.title : details.name) : '';
  const posterPath = details?.poster_path ? `${TMDB_IMAGE_BASE_URL}${details.poster_path}` : undefined;

  usePageMetadata({
    title: title || 'Loading...',
    description: details?.overview || '',
    path: `/${type}/${slug}`,
    imageUrl: posterPath,
  });

  useEffect(() => {
    const fetchDetails = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        const tmdbId = await findIdBySlug(type, slug);

        if (!tmdbId) {
          addToast('Content not found.', 'error');
          setDetails(null);
          setLoading(false);
          return;
        }
        
        const [detailsData, storedData, creditsData] = await Promise.all([
          getDetails(type, tmdbId),
          getStoredMovie(tmdbId, type),
          getCredits(type, tmdbId)
        ]);
        setDetails(detailsData);
        setStoredMovie(storedData);
        setCast(creditsData.cast.slice(0, 18));
      } catch (error) {
        console.error('Failed to fetch details:', error);
        addToast('Failed to load details. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [slug, type, addToast]);
  
  // Effect for JSON-LD structured data
  useEffect(() => {
    if (details) {
      const title = 'title' in details ? details.title : details.name;
      const releaseDate = 'release_date' in details ? details.release_date : details.first_air_date;
      const posterUrl = details.poster_path ? `${TMDB_IMAGE_BASE_URL}${details.poster_path}` : '';

      const schema = {
        "@context": "https://schema.org",
        "@type": type === 'movie' ? "Movie" : "TVSeries",
        "name": title,
        "description": details.overview,
        "image": posterUrl,
        "datePublished": releaseDate,
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": details.vote_average.toFixed(1),
          "bestRating": "10",
          "ratingCount": details.vote_count
        }
      };

      // FIX: Correctly type the script element to avoid type errors when setting `type`.
      let script = document.getElementById('json-ld-schema') as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = 'json-ld-schema';
        document.head.appendChild(script);
      }
      script.type = 'application/ld+json';
      script.innerHTML = JSON.stringify(schema);
    }
    
    return () => {
      const script = document.getElementById('json-ld-schema');
      if(script) {
          script.remove();
      }
    }
  }, [details, type]);

  const handleDownloadClick = async (url: string) => {
    if (storedMovie) {
      try {
        await incrementDownloadCount(storedMovie._id);
      } catch (error) {
        console.error("Failed to increment download count", error);
        addToast('Could not track download click.', 'info');
      }
      window.open(url, '_blank');
    }
  };

  const handleFavoriteToggle = () => {
    if (!details) return;
    const favoriteItem: ContentItem = { ...details, type: type };
    if (isFavorite(details.id)) {
      removeFavorite(details.id);
    } else {
      addFavorite(favoriteItem);
    }
  };

  const handleWatchlistToggle = () => {
    if (!details) return;
    const watchlistItem: ContentItem = { ...details, type: type };
    if (isOnWatchlist(details.id)) {
      removeFromWatchlist(details.id);
    } else {
      addToWatchlist(watchlistItem);
    }
  };

  if (loading) return <Spinner />;
  if (!details) return <p>Content not found.</p>;
  
  const isFav = isFavorite(details.id);
  const onWl = isOnWatchlist(details.id);
  const releaseDate = 'release_date' in details ? details.release_date : details.first_air_date;
  const runtime = 'runtime' in details ? details.runtime : (details.episode_run_time?.[0] || 0);

  const posterUrl = details.poster_path
    ? `${TMDB_IMAGE_BASE_URL}${details.poster_path}`
    : 'https://picsum.photos/500/750';

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="md:w-1/3 flex-shrink-0">
        <img src={posterUrl} alt={title} className="rounded-lg shadow-2xl w-full object-cover aspect-[2/3]" />
      </div>
      <div className="md:w-2/3">
        <div className="flex items-start justify-between gap-4">
            <h1 className="text-4xl font-bold text-light-text dark:text-white">{title}</h1>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleWatchlistToggle}
                title={onWl ? 'Remove from watchlist' : 'Add to watchlist'}
                className="p-2 bg-light-secondary dark:bg-secondary rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle Watchlist"
              >
                <BookmarkIcon className={`h-6 w-6 transition-all ${onWl ? 'fill-accent stroke-accent' : 'text-light-muted dark:text-muted'}`} />
              </button>
              <button
                onClick={handleFavoriteToggle}
                title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                className="p-2 bg-light-secondary dark:bg-secondary rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle Favorite"
              >
                <HeartIcon className={`h-6 w-6 transition-all ${isFav ? 'fill-red-500 stroke-red-500' : 'text-light-muted dark:text-muted'}`} />
              </button>
            </div>
        </div>

        {details.tagline && <p className="text-light-muted dark:text-muted italic mt-1">"{details.tagline}"</p>}
        <div className="flex items-center space-x-4 my-4 text-light-muted dark:text-muted">
          <div className="flex items-center">
            <StarIcon className="h-5 w-5 mr-1 text-yellow-400" />
            <span className="font-bold text-light-text dark:text-white">{details.vote_average.toFixed(1)}</span> / 10
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
            <span key={genre.id} className="bg-light-secondary dark:bg-secondary text-light-text dark:text-gray-200 px-3 py-1 text-xs font-semibold rounded-full">{genre.name}</span>
          ))}
        </div>
        <h2 className="text-xl font-semibold mt-6 mb-2">Overview</h2>
        <p className="text-light-text dark:text-gray-300 leading-relaxed">{details.overview}</p>

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
          <TelegramAd />
        </div>

        <div className="mt-8 bg-light-secondary dark:bg-secondary p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Download Links</h2>
          {storedMovie && storedMovie.download_links.length > 0 ? (
            <div className="space-y-3">
              {storedMovie.download_links.map((link, index) => (
                <button
                  key={index}
                  onClick={() => handleDownloadClick(link.url)}
                  className="w-full flex items-center justify-between bg-light-highlight dark:bg-highlight text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors duration-300"
                >
                  <span>{link.label}</span>
                  <DownloadIcon className="h-6 w-6" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-light-muted dark:text-muted">No download links available yet. Please check back later.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailsPage;