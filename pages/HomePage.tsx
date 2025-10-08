import React, { useEffect, useState } from 'react';
import { getTrending } from '../services/api';
import { MovieSummary, TVSummary } from '../types';
import MovieCard from '../components/MovieCard';
import Spinner from '../components/Spinner';
import AdPlaceholder from '../components/AdPlaceholder';

const HomePage: React.FC = () => {
  const [trendingMovies, setTrendingMovies] = useState<MovieSummary[]>([]);
  const [trendingTV, setTrendingTV] = useState<TVSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [moviePage, setMoviePage] = useState(1);
  const [tvPage, setTvPage] = useState(1);
  const [loadingMoreMovies, setLoadingMoreMovies] = useState(false);
  const [loadingMoreTV, setLoadingMoreTV] = useState(false);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const [movies, tvShows] = await Promise.all([
          getTrending('movie', 1),
          getTrending('tv', 1)
        ]);
        setTrendingMovies(movies.results);
        setTrendingTV(tvShows.results);
        setMoviePage(1);
        setTvPage(1);
      } catch (error) {
        console.error('Failed to fetch trending content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  const handleLoadMore = async (type: 'movie' | 'tv') => {
    if (type === 'movie') {
      setLoadingMoreMovies(true);
      try {
        const nextPage = moviePage + 1;
        const data = await getTrending('movie', nextPage);
        setTrendingMovies(prev => [...prev, ...data.results]);
        setMoviePage(nextPage);
      } catch (error) {
        console.error('Failed to load more movies:', error);
      } finally {
        setLoadingMoreMovies(false);
      }
    } else {
      setLoadingMoreTV(true);
      try {
        const nextPage = tvPage + 1;
        const data = await getTrending('tv', nextPage);
        setTrendingTV(prev => [...prev, ...data.results]);
        setTvPage(nextPage);
      } catch (error) {
        console.error('Failed to load more TV shows:', error);
      } finally {
        setLoadingMoreTV(false);
      }
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="space-y-12">
      <AdPlaceholder width="w-full max-w-4xl" height="h-24" label="Leaderboard Ad" />
      <section>
        <h2 className="text-2xl font-bold mb-4 border-l-4 border-accent pl-4">Trending Movies</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {trendingMovies.map(movie => (
            <MovieCard key={movie.id} item={movie} type="movie" />
          ))}
        </div>
        <div className="text-center mt-8">
            <button
                onClick={() => handleLoadMore('movie')}
                disabled={loadingMoreMovies}
                className="bg-accent text-white font-bold py-2 px-6 rounded-full hover:bg-blue-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center mx-auto min-w-[190px]"
            >
                {loadingMoreMovies ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                        <span>Loading...</span>
                    </>
                ) : (
                    'Load More Movies'
                )}
            </button>
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold mb-4 border-l-4 border-accent pl-4">Trending TV Shows</h2>
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {trendingTV.map(tv => (
            <MovieCard key={tv.id} item={tv} type="tv" />
          ))}
        </div>
        <div className="text-center mt-8">
            <button
                onClick={() => handleLoadMore('tv')}
                disabled={loadingMoreTV}
                className="bg-accent text-white font-bold py-2 px-6 rounded-full hover:bg-blue-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center mx-auto min-w-[190px]"
            >
                {loadingMoreTV ? (
                     <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                        <span>Loading...</span>
                    </>
                ) : (
                    'Load More TV Shows'
                )}
            </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;