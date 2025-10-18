import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllGenres } from '../services/api';
import { Genre } from '../types';
import { useToast } from '../hooks/useToast';
import { usePageMetadata } from '../hooks/usePageMetadata';

const GenresPage: React.FC = () => {
    const [genres, setGenres] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    usePageMetadata({
        title: 'Explore Genres',
        description: 'Discover movies and TV shows by browsing our collection of genres.',
        path: '/genres',
    });

    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const genresData = await getAllGenres();
                setGenres(genresData);
            } catch (error) {
                console.error("Failed to fetch genres", error);
                addToast("Could not load genres.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchGenres();
    }, [addToast]);

    if (loading) {
        return (
            <div>
                <h1 className="text-3xl font-bold mb-6 border-l-4 border-light-accent dark:border-accent pl-4">Explore by Genre</h1>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-pulse">
                    {Array.from({ length: 15 }).map((_, index) => (
                        <div key={index} className="bg-light-secondary dark:bg-secondary h-20 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 border-l-4 border-light-accent dark:border-accent pl-4">Explore by Genre</h1>
            {genres.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-fade-in">
                    {genres.map(genre => (
                        <Link
                            key={genre.id}
                            to={`/?genre=${genre.id}`}
                            className="block bg-light-secondary dark:bg-secondary p-6 rounded-lg text-center font-bold text-lg text-light-text dark:text-white hover:bg-light-accent dark:hover:bg-accent hover:text-white hover:scale-105 transform transition-all duration-300 shadow-lg"
                        >
                            {genre.name}
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="text-center text-light-muted dark:text-muted">No genres found.</p>
            )}
        </div>
    );
};

export default GenresPage;