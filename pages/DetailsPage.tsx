import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { getDetails, getStoredMovie, incrementDownloadCount, getCredits, findIdBySlug, getVideos, addSupportTicket } from '../services/api';
import { ContentType, MovieDetail, StoredMovie, TVDetail, CastMember, ContentItem, Genre, Video, SupportTicket } from '../types';
import { TMDB_IMAGE_BASE_URL } from '../constants';
import { FavoritesContext } from '../context/FavoritesContext';
import { WatchlistContext } from '../context/WatchlistContext';
import { HistoryContext } from '../context/HistoryContext';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { usePageMetadata } from '../hooks/usePageMetadata';
import Spinner from '../components/Spinner';
import TelegramAd from '../components/TelegramAd';
import CastCard from '../components/CastCard';
import { StarIcon, CalendarIcon, ClockIcon, DownloadIcon, HeartIcon, BookmarkIcon, ShareIcon, SpinnerIcon, PlusCircleIcon } from '../components/Icons';
import ExpandableText from '../components/ExpandableText';
import AddToCollectionModal from '../components/AddToCollectionModal';
import Turnstile from '../components/Turnstile';

interface DetailsPageProps {
  type: ContentType;
}

const DetailsPage: React.FC<DetailsPageProps> = ({ type }) => {
  const { slug } = useParams<{ slug: string }>();
  const [details, setDetails] = useState<MovieDetail | TVDetail | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [storedMovie, setStoredMovie] = useState<StoredMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const { addFavorite, removeFavorite, isFavorite } = useContext(FavoritesContext);
  const { addToWatchlist, removeFromWatchlist, isOnWatchlist } = useContext(WatchlistContext);
  const { addToHistory } = useContext(HistoryContext);
  const { isAuthenticated } = useContext(AuthContext);
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  // States for download countdown
  const [isPreparing, setIsPreparing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showLinks, setShowLinks] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  
  // States for link suggestion
  const [suggestionLabel, setSuggestionLabel] = useState('');
  const [suggestionUrl, setSuggestionUrl] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  const title = details ? ('title' in details ? details.title : details.name) : '';
  const posterPath = details?.poster_path ? `${TMDB_IMAGE_BASE_URL}${details.poster_path}` : undefined;

  usePageMetadata({
    title: title || 'Loading...',
    description: details?.overview || '',
    path: details ? `/${type}/${slug}?id=${details.id}` : `/${type}/${slug}`,
    imageUrl: posterPath,
  });

  useEffect(() => {
    const fetchDetails = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        
        let tmdbId: number | null = null;
        const idMatch = slug.match(/^(\d+)/);

        if (idMatch) {
          tmdbId = parseInt(idMatch[1], 10);
        } else {
          // Fallback for old URLs that don't have an ID
          tmdbId = await findIdBySlug(type, slug);
        }

        if (!tmdbId) {
          addToast('Content not found.', 'error');
          setDetails(null);
          setLoading(false);
          return;
        }
        
        const [detailsData, storedData, creditsData, videosData] = await Promise.all([
          getDetails(type, tmdbId),
          getStoredMovie(tmdbId, type),
          getCredits(type, tmdbId),
          getVideos(type, tmdbId),
        ]);
        setDetails(detailsData);
        setStoredMovie(storedData);
        setCast(creditsData.cast.slice(0, 18));

        // Find the official YouTube trailer
        const officialTrailer = videosData.results.find(
          (vid: Video) => vid.site === 'YouTube' && vid.type === 'Trailer'
        );
        setTrailerKey(officialTrailer ? officialTrailer.key : null);

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
  
  // Effect for countdown timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isPreparing && countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsPreparing(false);
      setShowLinks(true);
      setCountdown(null);
    }
    return () => clearTimeout(timer);
  }, [isPreparing, countdown]);

  const handlePrepareDownloads = () => {
    if (isPreparing) return;
    setIsPreparing(true);
    setCountdown(10);
  };

  const handleDownloadClick = async (url: string) => {
    if (storedMovie && details) {
      // Add to viewing history
      // FIX: Cast to ContentItem to resolve discriminated union issue.
      addToHistory({ ...details, type } as ContentItem);
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
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (!details) return;
    // FIX: Cast to ContentItem to resolve discriminated union issue.
    const favoriteItem = { ...details, type } as ContentItem;
    if (isFavorite(details.id)) {
      removeFavorite(details.id);
    } else {
      addFavorite(favoriteItem);
    }
  };

  const handleWatchlistToggle = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (!details) return;
    // FIX: Cast to ContentItem to resolve discriminated union issue.
    const watchlistItem = { ...details, type } as ContentItem;
    if (isOnWatchlist(details.id)) {
      removeFromWatchlist(details.id);
    } else {
      addToWatchlist(watchlistItem);
    }
  };

  const handleOpenCollectionModal = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location }});
      return;
    }
    setIsCollectionModalOpen(true);
  };
  
  const handleShare = async () => {
    if (!details) return;

    // Manually construct the URL to ensure it's absolute and well-formed for the Web Share API.
    // This avoids issues where window.location.href might be ambiguous or invalid.
    const path = `/${type}/${slug}?id=${details.id}`;
    const cleanPathname = window.location.pathname.replace(/index\.html$/, '');
    const shareUrl = `${window.location.origin}${cleanPathname}#${path}`;

    const shareTitle = title;
    const shareText = `Check out ${title} on CineStream! Find download links and more.`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: shareTitle,
                text: shareText,
                url: shareUrl,
            });
        } catch (error) {
            // Don't show an error if the user cancels the share action
            if ((error as DOMException).name !== 'AbortError') {
                 console.error('Error sharing:', error);
                 addToast('Could not share content.', 'error');
            }
        }
    } else {
        // Fallback for browsers that don't support the Web Share API
        try {
            await navigator.clipboard.writeText(shareUrl);
            addToast('Link copied to clipboard!', 'info');
        } catch (error) {
            console.error('Failed to copy link:', error);
            addToast('Could not copy link to clipboard.', 'error');
        }
    }
  };

  const handleSuggestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionUrl.trim() || !suggestionLabel.trim()) {
        addToast('Please provide both a label and a URL.', 'error');
        return;
    }
    if (!turnstileToken) {
        addToast('Please complete the CAPTCHA.', 'error');
        return;
    }
    
    setIsSuggesting(true);
    try {
        const message = `Label: ${suggestionLabel}\nURL: ${suggestionUrl}`;
        await addSupportTicket({
            subject: 'Link Suggestion',
            contentTitle: title,
            message: message,
        }, turnstileToken);
        addToast('Suggestion submitted for review. Thank you!', 'success');
        setSuggestionLabel('');
        setSuggestionUrl('');
        if (window.turnstile) {
            window.turnstile.reset();
        }
        setTurnstileToken('');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        addToast(`Failed to submit suggestion: ${errorMessage}`, 'error');
        if (window.turnstile) {
            window.turnstile.reset();
        }
        setTurnstileToken('');
    } finally {
        setIsSuggesting(false);
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
    
  // FIX: Cast to ContentItem to resolve discriminated union issue.
  const contentItemForCollection: ContentItem | null = details ? { ...details, type } as ContentItem : null;

  return (
    <>
      {isCollectionModalOpen && contentItemForCollection && (
        <AddToCollectionModal 
          item={contentItemForCollection}
          onClose={() => setIsCollectionModalOpen(false)}
        />
      )}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3 flex-shrink-0">
          <img src={posterUrl} alt={title} className="rounded-lg shadow-2xl w-full object-cover aspect-[2/3]" />
        </div>
        <div className="md:w-2/3">
          <div className="flex items-start justify-between gap-4">
              <h1 className="text-4xl font-bold text-light-text dark:text-white">{title}</h1>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleOpenCollectionModal}
                  title="Add to collection"
                  className="p-2 bg-light-secondary dark:bg-secondary rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Add to collection"
                >
                  <PlusCircleIcon className="h-6 w-6 text-light-muted dark:text-muted" />
                </button>
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
                <button
                  onClick={handleShare}
                  title="Share"
                  className="p-2 bg-light-secondary dark:bg-secondary rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Share this content"
                >
                  <ShareIcon className="h-6 w-6 text-light-muted dark:text-muted" />
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
          <ExpandableText text={details.overview} />

          {trailerKey && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Trailer</h2>
              <div className="aspect-[16/9] bg-black rounded-lg overflow-hidden shadow-lg">
                <iframe
                  src={`https://www.youtube.com/embed/${trailerKey}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>
          )}

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
              <>
                {isAuthenticated ? (
                  <>
                    {!showLinks ? (
                      <button
                        onClick={handlePrepareDownloads}
                        disabled={isPreparing}
                        className="w-full flex items-center justify-center gap-2 bg-light-highlight dark:bg-highlight text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
                      >
                        {isPreparing ? (
                          <>
                            <SpinnerIcon className="animate-spin h-6 w-6" />
                            <span>Generating links in {countdown}s...</span>
                          </>
                        ) : (
                          <>
                            <DownloadIcon className="h-6 w-6" />
                            <span>Prepare Download Links</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="space-y-3 animate-fade-in">
                        {storedMovie.download_links.map((link, index) => (
                          <button
                            key={index}
                            onClick={() => handleDownloadClick(link.url)}
                            className="w-full flex items-center justify-between bg-light-accent dark:bg-accent text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity"
                          >
                            <span>{link.label}</span>
                            <DownloadIcon className="h-6 w-6" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-4 bg-light-primary dark:bg-primary/40 rounded-md border border-light-border dark:border-glass-border">
                      <h3 className="font-bold text-lg text-light-text dark:text-white mb-2">Login to Download</h3>
                      <p className="text-light-muted dark:text-muted mb-4">
                          Please log in or create a free account to prepare and view the download links for this content.
                      </p>
                      <Link
                          to="/login"
                          state={{ from: location }}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-light-accent dark:bg-accent text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity"
                      >
                          <DownloadIcon className="h-6 w-6" />
                          <span>Log In or Sign Up to Download</span>
                      </Link>
                  </div>
                )}
              </>
            ) : (
              <p className="text-light-muted dark:text-muted">No download links available yet. Please check back later.</p>
            )}
          </div>
          
          <div className="mt-8 bg-light-secondary dark:bg-secondary p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">Help the Community: Suggest a Link</h2>
              {isAuthenticated ? (
                  <form onSubmit={handleSuggestLink} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="sm:col-span-1">
                              <label htmlFor="suggestionLabel" className="block text-sm font-medium text-light-muted dark:text-muted mb-1">Label</label>
                              <input
                                  id="suggestionLabel"
                                  type="text"
                                  value={suggestionLabel}
                                  onChange={(e) => setSuggestionLabel(e.target.value)}
                                  placeholder="e.g., 1080p WEB-DL"
                                  className="w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent"
                                  required
                                  disabled={isSuggesting}
                              />
                          </div>
                          <div className="sm:col-span-2">
                              <label htmlFor="suggestionUrl" className="block text-sm font-medium text-light-muted dark:text-muted mb-1">URL</label>
                              <input
                                  id="suggestionUrl"
                                  type="url"
                                  value={suggestionUrl}
                                  onChange={(e) => setSuggestionUrl(e.target.value)}
                                  placeholder="https://example.com/download"
                                  className="w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent"
                                  required
                                  disabled={isSuggesting}
                              />
                          </div>
                      </div>
                      <div className="flex justify-center pt-2">
                          <Turnstile onSuccess={setTurnstileToken} />
                      </div>
                      <div>
                          <button
                              type="submit"
                              disabled={isSuggesting || !turnstileToken}
                              className="w-full flex items-center justify-center gap-2 bg-light-accent/80 dark:bg-accent/80 text-white font-bold py-3 px-4 rounded-lg hover:bg-light-accent dark:hover:bg-accent transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
                          >
                              {isSuggesting ? (
                                  <>
                                      <SpinnerIcon className="animate-spin h-6 w-6" />
                                      <span>Submitting...</span>
                                  </>
                              ) : (
                                  <span>Submit Suggestion</span>
                              )}
                          </button>
                      </div>
                  </form>
              ) : (
                  <div className="text-center p-4 bg-light-primary dark:bg-primary/40 rounded-md border border-light-border dark:border-glass-border">
                      <h3 className="font-bold text-lg text-light-text dark:text-white mb-2">Want to contribute?</h3>
                      <p className="text-light-muted dark:text-muted mb-4">
                          Please log in or create an account to suggest new download links for the community.
                      </p>
                      <Link
                          to="/login"
                          state={{ from: location }}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-light-accent dark:bg-accent text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
                      >
                          Log In to Suggest
                      </Link>
                  </div>
              )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DetailsPage;