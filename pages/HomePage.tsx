import React, { useEffect, useState, useRef, useCallback } from 'react';
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

  const movieObserver = useRef<IntersectionObserver>();
  const tvObserver = useRef<IntersectionObserver>();

  const fetchInitialData = useCallback(async () => {
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
  }, [movieSort, tvSort]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleLoadMore = useCallback(async (type: 'movie' | 'tv') => {
    if (type === 'movie') {
      if (loadingMoreMovies) return;
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
      if (loadingMoreTV) return;
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
  }, [loadingMoreMovies, moviePage, movieSort, loadingMoreTV, tvPage, tvSort]);

  const movieLoaderRef = useCallback(node => {
    if (loadingMoreMovies) return;
    if (movieObserver.current) movieObserver.current.disconnect();
    movieObserver.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            handleLoadMore('movie');
        }
    });
    if (node) movieObserver.current.observe(node);
  }, [loadingMoreMovies, handleLoadMore]);

  const tvLoaderRef = useCallback(node => {
      if (loadingMoreTV) return;
      if (tvObserver.current) tvObserver.current.disconnect();
      tvObserver.current = new IntersectionObserver(entries => {
          if (entries[0].isIntersecting) {
              handleLoadMore('tv');
          }
      });
      if (node) tvObserver.current.observe(node);
  }, [loadingMoreTV, handleLoadMore]);

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
        <div ref={movieLoaderRef} className="h-10" />
        {loadingMoreMovies && <Spinner />}
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
        <div ref={tvLoaderRef} className="h-10" />
        {loadingMoreTV && <Spinner />}
      </section>
    </div>
  );
};

export default HomePage;