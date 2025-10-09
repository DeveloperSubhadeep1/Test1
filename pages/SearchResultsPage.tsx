import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { searchTMDB } from '../services/api';
import { MovieSummary, TVSummary } from '../types';
import { useToast } from '../hooks/useToast';
import { usePageMetadata } from '../hooks/usePageMetadata';
import MovieCard from '../components/MovieCard';
import Spinner from '../components/Spinner';

const SearchResultsPage: React.FC = () => {
  const { query } = useParams<{ query: string }>();
  const [results, setResults] = useState<(MovieSummary | TVSummary)[]>([]);
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
    return <Spinner />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Search Results for "{query}"</h1>
      {results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {results.map(item => {
            const type = (item as any).media_type;

            if (type !== 'movie' && type !== 'tv') {
              return null;
            }

            return <MovieCard key={`${type}-${item.id}`} item={item} type={type} />;
          })}
        </div>
      ) : (
        <p className="text-center text-light-muted dark:text-muted text-lg mt-10">No results found for your search.</p>
      )}
    </div>
  );
};

export default SearchResultsPage;
