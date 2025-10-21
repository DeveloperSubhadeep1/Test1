import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { getDetails, getStoredMovie, incrementDownloadCount, getCredits, findIdBySlug, getVideos } from '../services/api';
// FIX: Imported the 'Video' type to resolve a type error when processing video data from the API.
import { ContentType, MovieDetail, StoredMovie, TVDetail, CastMember, ContentItem, CrewMember, DownloadLink, Video } from '../types';
import { TMDB_IMAGE_BASE_URL } from '../constants';
import { FavoritesContext } from '../context/FavoritesContext';
import { WatchlistContext } from '../context/WatchlistContext';
import { HistoryContext } from '../context/HistoryContext';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { usePageMetadata } from '../hooks/usePageMetadata';
import DetailsPageSkeleton from '../components/DetailsPageSkeleton';
import TelegramAd from '../components/TelegramAd';
import CastCard from '../components/CastCard';
import { CalendarIcon, ClockIcon, DownloadIcon, HeartIcon, BookmarkIcon, ShareIcon, SpinnerIcon, PlusCircleIcon, PlayIcon, ArrowLeftIcon, StarIcon } from '../components/Icons';
import ExpandableText from '../components/ExpandableText';
import AddToCollectionModal from '../components/AddToCollectionModal';
import ScoreRing from '../components/ScoreRing';
import { parseMediaFilename } from '../utils';

interface DetailsPageProps {
  type: ContentType;
}

const DownloadLinkButton: React.FC<{ link: DownloadLink; title: string; year: string; onDownload: (link: DownloadLink) => void }> = ({ link, title, year, onDownload }) => {
    const [displayLabel, setDisplayLabel] = useState(`${title} (${year})`);
    
    useEffect(() => {
        const generateLabel = () => {
            const url = link.url;
            // Extract filename from URL
            const filenameMatch = url.match(/([^/\\?]+)(?:[?#]|$)/);
            const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : '';
            
            // Combine filename from URL and the admin-provided label to gather all possible details.
            const infoSource = `${filename} ${link.label || ''}`;
            const details = parseMediaFilename(infoSource);

            const parts = [title];
    
            if (details.season !== null) {
                const seasonStr = String(details.season).padStart(2, '0');
                if (details.episode !== null) {
                    const episodeStr = String(details.episode).padStart(2, '0');
                    parts.push(`S${seasonStr}E${episodeStr}`);
                } else {
                    parts.push(`Season ${seasonStr}`);
                }
            } else if (year && year !== 'N/A') {
                parts.push(`(${year})`);
            }

            if (details.quality) {
                parts.push(details.quality);
            }

            if (details.languages.length > 0) {
                parts.push(`(${details.languages.join(', ')})`);
            }

            if (details.size) {
                parts.push(`[${details.size}]`);
            }
            
            setDisplayLabel(parts.join(' '));
        };

        generateLabel();
    }, [link, title, year]);

    return (
        <button
            onClick={() => onDownload(link)}
            className="group w-full flex items-center justify-between bg-accent text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity text-left"
        >
            <span className="truncate">{displayLabel}</span>
            <DownloadIcon className="h-6 w-6 flex-shrink-0 ml-4 transition-transform duration-300 group-hover:scale-110" />
        </button>
    );
};

const DetailsPage: React.FC<DetailsPageProps> = ({ type }) => {
  const { slug } = useParams<{ slug: string }>();
  const [details, setDetails] = useState<MovieDetail | TVDetail | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [crew, setCrew] = useState<{ director?: CrewMember, writers: CrewMember[] }>({ writers: [] });
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [storedMovie, setStoredMovie] = useState<StoredMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const { addFavorite, removeFavorite, isFavorite } = useContext(FavoritesContext);
  const { addToWatchlist, removeFromWatchlist, isOnWatchlist } = useContext(WatchlistContext);
  const { addToHistory } = useContext(HistoryContext);
  const { isAuthenticated, isAdmin } = useContext(AuthContext);
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  // States for download countdown
  const [isPreparing, setIsPreparing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showLinks, setShowLinks] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);

  const title = details ? ('title' in details ? details.title : details.name) : '';
  const posterPath = details?.poster_path ? `${TMDB_IMAGE_BASE_URL}${details.poster_path}` : undefined;
  const originalBackdropUrl = details?.poster_path ? `https://image.tmdb.org/t/p/original${details.poster_path}` : '';

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
        setDetails(null);
        setTrailerKey(null);
        
        let tmdbId: number | null = null;
        const idMatch = slug.match(/^(\d+)/);

        if (idMatch) {
          tmdbId = parseInt(idMatch[1], 10);
        } else {
          tmdbId = await findIdBySlug(type, slug);
        }

        if (!tmdbId) {
          addToast('Content not found.', 'error');
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
        setCast(creditsData.cast.slice(0, 10));
        
        const director = creditsData.crew.find(c => c.job === 'Director');
        const writers = creditsData.crew.filter(c => c.department === 'Writing').slice(0, 3);
        setCrew({ director, writers });

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
  
  // ... (other effects and handlers are the same)
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

  const handleDownloadClick = async (link: DownloadLink) => {
    if (storedMovie && details) {
      addToHistory({ ...details, type } as ContentItem);
      try {
        await incrementDownloadCount(storedMovie._id);
      } catch (error) {
        console.error("Failed to increment download count", error);
        addToast('Could not track download click.', 'info');
      }
      if (link.suggestedBy && !isAdmin) {
        addToast(`Shout out to ${link.suggestedBy} for this link!`, 'info');
      }
      window.open(link.url, '_blank');
    }
  };

  const handleFavoriteToggle = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (!details) return;
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
    const path = `/${type}/${slug}?id=${details.id}`;
    const cleanPathname = window.location.pathname.replace(/index\.html$/, '');
    const shareUrl = `${window.location.origin}${cleanPathname}#${path}`;
    const shareTitle = title;
    const shareText = `Check out ${title} on CineStream! Find download links and more.`;

    if (navigator.share) {
        try {
            await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        } catch (error) {
            if ((error as DOMException).name !== 'AbortError') {
                 console.error('Error sharing:', error);
                 addToast('Could not share content.', 'error');
            }
        }
    } else {
        try {
            await navigator.clipboard.writeText(shareUrl);
            addToast('Link copied to clipboard!', 'info');
        } catch (error) {
            console.error('Failed to copy link:', error);
            addToast('Could not copy link to clipboard.', 'error');
        }
    }
  };

  if (loading) {
    return <DetailsPageSkeleton />;
  }

  const posterUrl = details?.poster_path ? `${TMDB_IMAGE_BASE_URL}${details.poster_path}` : 'https://picsum.photos/500/750';
  const contentItemForCollection: ContentItem | null = details ? { ...details, type } as ContentItem : null;
  const isFav = details ? isFavorite(details.id) : false;
  const onWl = details ? isOnWatchlist(details.id) : false;
  const releaseDate = details ? ('release_date' in details ? details.release_date : details.first_air_date) : '';
  const year = releaseDate ? new Date(releaseDate).getFullYear().toString() : 'N/A';
  const runtime = details ? ('runtime' in details ? details.runtime : (details.episode_run_time?.[0] || 0)) : 0;

  return (
    <>
      {isCollectionModalOpen && contentItemForCollection && (
        <AddToCollectionModal item={contentItemForCollection} onClose={() => setIsCollectionModalOpen(false)} />
      )}
      <div className="min-h-screen w-full bg-primary relative text-white animate-fade-in">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-20" 
          style={{ backgroundImage: `url(${originalBackdropUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-primary/50 backdrop-blur-md"></div>
        </div>
        
        {!details ? (
            <div className="relative z-10 container flex items-center justify-center min-h-[70vh]">
                <p>Content not found.</p>
            </div>
        ) : (
            <>
                <div className="relative z-10 container mx-auto px-4 pt-16 pb-12 md:pt-20 md:pb-16">
                    <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
                    <div className="md:w-1/3 flex-shrink-0">
                        <img src={posterUrl} alt={title} className="rounded-lg shadow-2xl shadow-black/50 w-full object-cover aspect-[2/3]" />
                    </div>
                    
                    <div className="md:w-2/3">
                        <div className="flex items-start justify-between gap-4">
                            <h1 className="text-4xl lg:text-5xl font-bold text-white">{title}</h1>
                        </div>
                        {details.tagline && <p className="text-muted italic mt-2 text-lg">"{details.tagline}"</p>}
                        
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 my-4 text-muted">
                        <div className="flex items-center">
                            <CalendarIcon className="h-5 w-5 mr-1.5" />
                            <span>{year}</span>
                        </div>
                        {runtime > 0 && (
                            <div className="flex items-center">
                            <ClockIcon className="h-5 w-5 mr-1.5" />
                            <span>{runtime} min{type === 'tv' && ' / ep'}</span>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                            {details.genres.slice(0,3).map(genre => (
                            <span key={genre.id} className="border border-gray-700 text-gray-300 px-3 py-1 text-xs font-semibold rounded-full">{genre.name}</span>
                            ))}
                        </div>
                        </div>

                        <div className="flex items-center gap-4 my-6">
                          <div>
                            <div className="flex items-center gap-4">
                              <ScoreRing score={details.vote_average} />
                              <span className="font-bold">User<br/>Score</span>
                            </div>
                             <div className="flex items-center justify-center gap-1.5 mt-2">
                                <StarIcon className="h-5 w-5 text-yellow-400" />
                                <span className="font-bold text-white text-lg">{details.vote_average.toFixed(1)}</span>
                                <span className="text-muted text-sm">/ 10</span>
                            </div>
                          </div>
                          <div className="h-10 w-px bg-gray-700"></div>
                          <div className="flex items-center gap-2">
                              <button onClick={handleOpenCollectionModal} title="Add to collection" className="group h-11 w-11 flex items-center justify-center bg-black/20 rounded-full hover:bg-white/20 transition-colors" aria-label="Add to collection">
                                  <PlusCircleIcon className="h-6 w-6 text-white transition-transform duration-300 group-hover:scale-110" />
                              </button>
                              <button onClick={handleWatchlistToggle} title={onWl ? 'Remove from watchlist' : 'Add to watchlist'} className="group h-11 w-11 flex items-center justify-center bg-black/20 rounded-full hover:bg-white/20 transition-colors" aria-label="Toggle Watchlist">
                                  <BookmarkIcon className={`h-6 w-6 transition-all group-hover:scale-110 ${onWl ? 'fill-accent stroke-accent' : 'text-white'}`} />
                              </button>
                              <button onClick={handleFavoriteToggle} title={isFav ? 'Remove from favorites' : 'Add to favorites'} className="group h-11 w-11 flex items-center justify-center bg-black/20 rounded-full hover:bg-white/20 transition-colors" aria-label="Toggle Favorite">
                                  <HeartIcon className={`h-6 w-6 transition-all group-hover:scale-110 ${isFav ? 'fill-red-500 stroke-red-500' : 'text-white'}`} />
                              </button>
                              <button onClick={handleShare} title="Share" className="group h-11 w-11 flex items-center justify-center bg-black/20 rounded-full hover:bg-white/20 transition-colors" aria-label="Share this content">
                                  <ShareIcon className="h-6 w-6 text-white transition-transform duration-300 group-hover:scale-110" />
                              </button>
                          </div>
                        </div>
                        
                        <h2 className="text-xl font-semibold mt-6 mb-2">Overview</h2>
                        <ExpandableText text={details.overview} />
                        
                        <div className="grid grid-cols-2 gap-4 mt-6">
                        {crew.director && (
                            <div>
                                <p className="font-bold">{crew.director.name}</p>
                                <p className="text-sm text-muted">Director</p>
                            </div>
                        )}
                        {crew.writers.length > 0 && (
                            <div>
                                <p className="font-bold">{crew.writers.map(w => w.name).join(', ')}</p>
                                <p className="text-sm text-muted">Writer(s)</p>
                            </div>
                        )}
                        </div>
                        
                        <div className="flex flex-wrap gap-4 mt-8">
                            {trailerKey && (
                            <Link
                                to={`/trailer?key=${trailerKey}&title=${encodeURIComponent(title)}`}
                                className="group flex items-center gap-2 bg-white/90 text-black font-bold py-3 px-6 rounded-lg hover:bg-white transition-colors duration-300"
                                >
                                <PlayIcon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                                <span>Play Trailer</span>
                                </Link>
                            )}
                        </div>
                    </div>
                    </div>
                </div>

                <div className="relative z-10 container mx-auto px-4 pb-16 md:pb-24">
                    <div className="space-y-12">
                        {cast.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-semibold mb-4">Top Cast</h2>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                            {cast.map(person => ( <CastCard key={person.id} person={person} /> ))}
                            </div>
                        </div>
                        )}
                        <TelegramAd />
                        <div className="glass-panel p-6 rounded-lg">
                        <h2 className="text-2xl font-bold mb-4">Download Links</h2>
                        {storedMovie && storedMovie.download_links.length > 0 ? (
                            <>
                                {isAuthenticated ? (
                                <>
                                    {!showLinks ? (
                                    <button
                                        onClick={handlePrepareDownloads}
                                        disabled={isPreparing}
                                        className="w-full flex items-center justify-center gap-2 bg-highlight text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
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
                                            <DownloadLinkButton 
                                                key={index}
                                                link={link}
                                                onDownload={handleDownloadClick}
                                                title={title}
                                                year={year}
                                            />
                                        ))}
                                    </div>
                                    )}
                                </>
                                ) : (
                                <div className="text-center p-4 bg-primary/40 rounded-md border border-glass-border">
                                    <h3 className="font-bold text-lg text-white mb-2">Login to Download</h3>
                                    <p className="text-muted mb-4">Please log in or create an account to view download links.</p>
                                    <Link to="/login" state={{ from: location }} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity">
                                        <DownloadIcon className="h-6 w-6" />
                                        <span>Log In or Sign Up</span>
                                    </Link>
                                </div>
                                )}
                            </>
                            ) : (
                            <p className="text-muted">No download links available yet. Please check back later.</p>
                            )}
                        </div>
                        
                        <div className="glass-panel p-6 rounded-lg">
                            <h2 className="text-2xl font-bold mb-2">Help the Community</h2>
                            <p className="text-muted mb-4">Found a working link? Help us keep our library up-to-date by suggesting it.</p>
                            <Link to="/contribute" state={{ contentTitle: title, tmdbId: details.id, type }} className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent/80 text-white font-bold py-3 px-4 rounded-lg hover:bg-accent transition-colors">
                                <PlusCircleIcon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                                <span>Suggest a Link</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        )}
      </div>
    </>
  );
};

export default DetailsPage;