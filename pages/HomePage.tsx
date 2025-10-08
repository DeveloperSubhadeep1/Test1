import React, { useEffect, useState } from 'react';
import { getDiscover } from '../services/api';
import { MovieSummary, TVSummary } from '../types';
import MovieCard from '../components/MovieCard';
import Spinner from '../components/Spinner';
import AdPlaceholder from '../components/AdPlaceholder';

const SortFilter: React.FC<{
  type: 'movie' | 'tv';
  currentSort: string;
  onSortChange: (type: 'movie' | 'tv', newSort: string) => void;
}> = ({ type, currentSort, onSortChange }) => {
  const buttonClass = (sortType: string) => `px-4 py-1 text-sm font-semibold rounded-full transition-colors ${
      currentSort === sortType
          ? 'bg-accent text-white'
          : 'bg-secondary text-muted hover:bg-gray-700'
  }`;

  return (
    <div className="flex space-x-2 bg-primary p-1 rounded-full">
      <button onClick={() => onSortChange(type, 'popularity.desc')} className={buttonClass('popularity.desc')}>
        Popular
      </button>
      <button onClick={() => onSortChange(type, 'vote_average.desc')} className={buttonClass('vote_average.desc')}>
        Top Rated
      </button>
    </div>
  );
};


const HomePage: React.FC = () => {
  const [trendingMovies, setTrendingMovies] = useState<MovieSummary[]>([]);
  const [trendingTV, setTrendingTV] = useState<TVSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [moviePage, setMoviePage] = useState(1);
  const [tvPage, setTvPage] = useState(1);
  const [loadingMoreMovies, setLoadingMoreMovies] = useState(false);
  const [loadingMoreTV, setLoadingMoreTV] = useState(false);

  const [movieSort, setMovieSort] = useState('popularity.desc');
  const [tvSort, setTvSort] = useState('popularity.desc');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [movies, tvShows] = await Promise.all([
          getDiscover('movie', 1, movieSort),
          getDiscover('tv', 1, tvSort)
        ]);
        setTrendingMovies(movies.results);
        setTrendingTV(tvShows.results);
        setMoviePage(1);
        setTvPage(1);
      } catch (error) {
        console.error('Failed to fetch content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [movieSort, tvSort]);

  const handleLoadMore = async (type: 'movie' | 'tv') => {
    if (type === 'movie') {
      setLoadingMoreMovies(true);
      try {
        const nextPage = moviePage + 1;
        const data = await getDiscover('movie', nextPage, movieSort);
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
        const data = await getDiscover('tv', nextPage, tvSort);
        setTrendingTV(prev => [...prev, ...data.results]);
        setTvPage(nextPage);
      } catch (error) {
        console.error('Failed to load more TV shows:', error);
      } finally {
        setLoadingMoreTV(false);
      }
    }
  };

  const handleSortChange = (type: 'movie' | 'tv', newSort: string) => {
    if (type === 'movie') {
      if (movieSort === newSort) return;
      setMovieSort(newSort);
    } else {
      if (tvSort === newSort) return;
      setTvSort(newSort);
    }
  };


  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="space-y-12">
      <AdPlaceholder width="w-full max-w-4xl" height="h-24" label="Leaderboard Ad" />
      <section>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
            <h2 className="text-2xl font-bold border-l-4 border-accent pl-4">Movies</h2>
            <SortFilter type="movie" currentSort={movieSort} onSortChange={handleSortChange} />
        </div>
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
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
            <h2 className="text-2xl font-bold border-l-4 border-accent pl-4">TV Shows</h2>
            <SortFilter type="tv" currentSort={tvSort} onSortChange={handleSortChange} />
        </div>
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