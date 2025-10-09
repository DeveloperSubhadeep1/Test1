import React, { useState, useContext, useEffect, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getMetrics, getStoredMovies, addStoredMovie, deleteStoredMovie, searchTMDB } from '../services/api';
import { StoredMovie, MovieSummary, TVSummary, ContentType, DownloadLink, Metrics } from '../types';
import Spinner from '../components/Spinner';
import { useDebounce } from '../hooks/useDebounce';
import { TMDB_IMAGE_BASE_URL } from '../constants';
import { TrashIcon, PlusCircleIcon } from '../components/Icons';

const AdminPage: React.FC = () => {
    const { isAuthenticated, login, logout } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const success = login(username, password);
        if (!success) {
            setError('Invalid credentials');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-full max-w-md bg-secondary p-8 rounded-lg shadow-lg">
                    <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted">Username</label>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-primary border border-gray-700 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-accent" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted">Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-primary border border-gray-700 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-accent" />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button type="submit" className="w-full bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500 transition-colors">Login</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <button onClick={logout} className="bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition-colors">Logout</button>
            </div>
            <AdminDashboard />
        </div>
    );
};

const AdminDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [storedMovies, setStoredMovies] = useState<StoredMovie[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshData = useCallback(async () => {
        setLoading(true);
        try {
            const [metricsData, moviesData] = await Promise.all([
                getMetrics(),
                getStoredMovies()
            ]);
            setMetrics(metricsData);
            setStoredMovies(moviesData);
        } catch (error) {
            console.error("Failed to load dashboard data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this entry?")) {
            const success = await deleteStoredMovie(id);
            if(success) {
                await refreshData();
            } else {
                alert('Error: Could not delete the entry. The database might be temporarily unavailable.');
            }
        }
    }

    if (loading) return <Spinner />;

    return (
        <div className="space-y-8">
            <section className="grid md:grid-cols-2 gap-6">
                <div className="bg-secondary p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-muted">Total Links Stored</h3>
                    <p className="text-4xl font-bold">{metrics?.totalLinks}</p>
                </div>
                <div className="bg-secondary p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-muted">Total Download Clicks</h3>
                    <p className="text-4xl font-bold">{metrics?.totalDownloads}</p>
                </div>
            </section>
            
            <AddMovieForm onMovieAdded={refreshData} />

            <section className="bg-secondary p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-4">Stored Movie Links</h2>
                <div className="space-y-4">
                    {storedMovies.length > 0 ? (
                        storedMovies.map(movie => (
                            <div key={movie._id} className="bg-primary p-4 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-lg">{movie.title} <span className="text-xs uppercase bg-accent text-primary font-bold px-2 py-0.5 rounded-full ml-2">{movie.type}</span></p>
                                    <p className="text-sm text-muted">{movie.download_links.length} link(s)</p>
                                </div>
                                <button onClick={() => handleDelete(movie._id)} className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-red-500/10">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted">No movies have been added yet.</p>
                    )}
                </div>
            </section>
        </div>
    );
};


const AddMovieForm: React.FC<{onMovieAdded: () => void}> = ({onMovieAdded}) => {
    const [title, setTitle] = useState('');
    const debouncedTitle = useDebounce(title, 500);
    const [searchResults, setSearchResults] = useState<(MovieSummary | TVSummary)[]>([]);
    const [selectedMovie, setSelectedMovie] = useState<(MovieSummary | TVSummary) | null>(null);
    const [links, setLinks] = useState<DownloadLink[]>([{ label: '', url: '' }]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchMovies = async () => {
            if (debouncedTitle.length > 2 && !selectedMovie) {
                const res = await searchTMDB(debouncedTitle);
                setSearchResults(res.results.slice(0, 5));
            } else {
                setSearchResults([]);
            }
        };
        fetchMovies();
    }, [debouncedTitle, selectedMovie]);

    const handleSelectMovie = (movie: MovieSummary | TVSummary) => {
        setSelectedMovie(movie);
        setTitle('title' in movie ? movie.title : movie.name);
        setSearchResults([]);
    };

    const handleAddLink = () => {
        setLinks([...links, { label: '', url: '' }]);
    };

    const handleRemoveLink = (index: number) => {
        setLinks(links.filter((_, i) => i !== index));
    };

    const handleLinkChange = (index: number, field: keyof DownloadLink, value: string) => {
        const newLinks = [...links];
        newLinks[index][field] = value;
        setLinks(newLinks);
    };
    
    const resetForm = () => {
        setTitle('');
        setSelectedMovie(null);
        setLinks([{ label: '', url: '' }]);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMovie) {
            alert("Please select a movie from the search results.");
            return;
        }

        setIsSubmitting(true);

        const newMovie: Omit<StoredMovie, '_id'> = {
            tmdb_id: selectedMovie.id,
            title: 'title' in selectedMovie ? selectedMovie.title : selectedMovie.name,
            type: 'title' in selectedMovie ? 'movie' : 'tv',
            download_links: links.filter(link => link.label && link.url),
        };
        
        const result = await addStoredMovie(newMovie);
        setIsSubmitting(false);

        if (result) {
            resetForm();
            onMovieAdded();
        } else {
            alert('Error: Could not add the movie. The database might be temporarily unavailable.');
        }
    };


    return (
        <section className="bg-secondary p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Add New Movie/TV Show</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <label className="block text-sm font-medium text-muted">Search Movie/TV Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => {
                            setTitle(e.target.value);
                            if(selectedMovie) setSelectedMovie(null);
                        }}
                        placeholder="Start typing a title..."
                        className="w-full bg-primary border border-gray-700 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    {searchResults.length > 0 && (
                        <div className="absolute z-10 w-full bg-primary border border-gray-700 rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
                            {searchResults.map(movie => (
                                <div key={movie.id} onClick={() => handleSelectMovie(movie)} className="p-3 hover:bg-secondary cursor-pointer flex items-center space-x-4">
                                    <img src={movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : 'https://picsum.photos/50/75'} alt="" className="w-10 h-auto rounded"/>
                                    <div>
                                        <p>{'title' in movie ? movie.title : movie.name}</p>
                                        <p className="text-xs text-muted">
                                            {'release_date' in movie ? movie.release_date.split('-')[0] : movie.first_air_date.split('-')[0]}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {selectedMovie && (
                     <div className="bg-primary p-4 rounded-md flex items-center space-x-4">
                        <img src={selectedMovie.poster_path ? `${TMDB_IMAGE_BASE_URL}${selectedMovie.poster_path}` : 'https://picsum.photos/100/150'} alt="" className="w-20 h-auto rounded"/>
                        <div>
                            <p className="font-bold text-lg">Selected: {'title' in selectedMovie ? selectedMovie.title : selectedMovie.name}</p>
                            <p className="text-sm text-muted">TMDB ID: {selectedMovie.id}</p>
                             <button type="button" onClick={() => { setSelectedMovie(null); setTitle(''); }} className="text-xs text-red-500 hover:underline mt-1">Clear Selection</button>
                        </div>
                     </div>
                )}
                
                <div>
                    <label className="block text-sm font-medium text-muted mb-2">Download Links</label>
                    {links.map((link, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                             <input type="text" placeholder="Label (e.g., 1080p)" value={link.label} onChange={(e) => handleLinkChange(index, 'label', e.target.value)} className="w-1/3 bg-primary border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent" />
                             <input type="url" placeholder="URL" value={link.url} onChange={(e) => handleLinkChange(index, 'url', e.target.value)} className="w-2/3 bg-primary border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent" />
                            <button type="button" onClick={() => handleRemoveLink(index)} className="p-2 text-red-500 hover:text-red-400"><TrashIcon className="h-5 w-5"/></button>
                        </div>
                    ))}
                    <button type="button" onClick={handleAddLink} className="flex items-center space-x-2 text-accent hover:text-blue-400 text-sm mt-2">
                        <PlusCircleIcon className="h-5 w-5"/>
                        <span>Add Another Link</span>
                    </button>
                </div>
                
                <button type="submit" disabled={!selectedMovie || isSubmitting} className="w-full bg-highlight text-white font-bold py-2 px-4 rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                    {isSubmitting ? 'Adding...' : 'Add Movie'}
                </button>
            </form>
        </section>
    );
};

export default AdminPage;