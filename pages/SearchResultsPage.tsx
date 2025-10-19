import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { searchTMDB } from '../services/api';
import { TMDBSearchResult } from '../types';
import { useToast } from '../hooks/useToast';
import { usePageMetadata } from '../hooks/usePageMetadata';
import MovieCard from '../components/MovieCard';
import MovieCardSkeleton from '../components/MovieCardSkeleton';
import { InfoIcon } from '../components/Icons';

const SearchResultsPage: React.FC = () => {
  const { query } = useParams<{ query: string }>();
  const [results, setResults] = useState<TMDBSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  usePageMetadata({
    title: `Search results for "${query || ''}"`,
    description: `Find movies and TV shows matching your search for "${query || ''}".`,
    path: `/search/${query || ''}`,
  });

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;
      try {
        setLoading(true);
        const searchRes = await searchTMDB(query);
        setResults(searchRes.results);
      } catch (error) {
        console.error('Failed to fetch search results:', error);
        addToast('Failed to perform search. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query, addToast]);

  if (loading) {
    return (
      <div>
        <div className="h-9 w-2/3 max-w-lg bg-light-secondary dark:bg-secondary rounded-md animate-pulse mb-6"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {Array.from({ length: 18 }).map((_, index) => (
            <MovieCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Found {results.length} {results.length === 1 ? 'result' : 'results'} for "{query}"
      </h1>
      {results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 animate-fade-in">
          {results.map(item => {
            const type = item.media_type;
            return <MovieCard key={`${type}-${item.id}`} item={item} type={type} />;
          })}
        </div>
      ) : (
        <div className="text-center text-light-muted dark:text-muted text-lg mt-10 py-10 flex flex-col items-center">
            <InfoIcon className="h-16 w-16 mb-4" />
            <p className="font-bold text-xl text-light-text dark:text-white">No Results Found</p>
            <p>We couldn't find any movies or TV shows matching "{query}".</p>
        </div>
      )}
    </div>
  );
};

export default SearchResultsPage;