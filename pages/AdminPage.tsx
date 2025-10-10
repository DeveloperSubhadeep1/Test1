
import React, { useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getMetrics, getStoredMovies, addStoredMovie, deleteStoredMovie, searchTMDB, getSupportTickets, deleteSupportTicket } from '../services/api';
import { StoredMovie, MovieSummary, TVSummary, DownloadLink, Metrics, SupportTicket } from '../types';
import { useToast } from '../hooks/useToast';
import { usePageMetadata } from '../hooks/usePageMetadata';
import Spinner from '../components/Spinner';
import { useDebounce } from '../hooks/useDebounce';
import { TMDB_IMAGE_BASE_URL } from '../constants';
import { TrashIcon, PlusCircleIcon, ArrowUpIcon, ArrowDownIcon, MenuIcon } from '../components/Icons';
import ConfirmationModal from '../components/ConfirmationModal';

const AdminPage: React.FC = () => {
    const { isAuthenticated, login, logout } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    usePageMetadata({
      title: 'Admin Dashboard',
      description: 'Admin login and dashboard for CineStream.',
      path: '/admin',
    });

    useEffect(() => {
        // Prevent admin page from being indexed by search engines
        const meta = document.createElement('meta');
        meta.name = 'robots';
        meta.content = 'noindex, nofollow';
        document.head.appendChild(meta);
    
        return () => {
            // Cleanup on unmount
            const metaTag = document.querySelector('meta[name="robots"]');
            if (metaTag) {
                metaTag.remove();
            }
        };
    }, []);

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
                <div className="w-full max-w-md bg-light-secondary dark:bg-secondary p-8 rounded-lg shadow-lg">
                    <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-light-muted dark:text-muted">Username</label>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-muted dark:text-muted">Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent" />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button type="submit" className="w-full bg-light-accent dark:bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500 transition-colors">Login</button>
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

type SortKey = 'title' | 'links';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}

const ITEMS_PER_PAGE = 10;

const AdminDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [storedMovies, setStoredMovies] = useState<StoredMovie[]>([]);
    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    const [modalState, setModalState] = useState<{ isOpen: boolean; id: string | null; type: 'movie' | 'ticket' | null }>({ isOpen: false, id: null, type: null });

    const refreshData = useCallback(async () => {
        setLoading(true);
        try {
            const [metricsData, moviesData, ticketsData] = await Promise.all([
                getMetrics(),
                getStoredMovies(),
                getSupportTickets(),
            ]);
            setMetrics(metricsData);
            setStoredMovies(moviesData);
            setSupportTickets(ticketsData);
        } catch (error) {
            console.error("Failed to load dashboard data", error);
            addToast('Failed to load dashboard data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const handleDeleteRequest = (id: string, type: 'movie' | 'ticket') => {
        setModalState({ isOpen: true, id, type });
    };

    const handleConfirmDelete = async () => {
        if (!modalState.id || !modalState.type) return;
        
        try {
            if (modalState.type === 'movie') {
                await deleteStoredMovie(modalState.id);
                addToast('Entry deleted successfully.', 'success');
            } else if (modalState.type === 'ticket') {
                await deleteSupportTicket(modalState.id);
                addToast('Ticket deleted successfully.', 'success');
            }
            refreshData();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            addToast(`Error: ${message}`, 'error');
        } finally {
            setModalState({ isOpen: false, id: null, type: null });
        }
    };

    if (loading) return <Spinner />;

    return (
        <div className="space-y-8">
            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, id: null, type: null })}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
                message="Are you sure you want to delete this item? This action cannot be undone."
            />
            <section className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="bg-light-secondary dark:bg-secondary p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-light-muted dark:text-muted">Total Links Stored</h3>
                    <p className="text-4xl font-bold">{metrics?.totalLinks}</p>
                </div>
                <div className="bg-light-secondary dark:bg-secondary p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-light-muted dark:text-muted">Total Download Clicks</h3>
                    <p className="text-4xl font-bold">{metrics?.totalDownloads}</p>
                </div>
                <div className="bg-light-secondary dark:bg-secondary p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-light-muted dark:text-muted">Open Support Tickets</h3>
                    <p className="text-4xl font-bold">{metrics?.totalSupportTickets}</p>
                </div>
            </section>
            
            <AddMovieForm onMovieAdded={refreshData} />

            <SupportTicketsSection tickets={supportTickets} onDeleteRequest={(id) => handleDeleteRequest(id, 'ticket')} />

            <StoredMoviesSection movies={storedMovies} onDeleteRequest={(id) => handleDeleteRequest(id, 'movie')} />

        </div>
    );
};

const StoredMoviesSection: React.FC<{ movies: StoredMovie[]; onDeleteRequest: (id: string) => void; }> = ({ movies, onDeleteRequest }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'title', direction: 'ascending' });

    const sortedMovies = useMemo(() => {
        let sortableItems = [...movies];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (sortConfig.key === 'title') {
                    return a.title.localeCompare(b.title) * (sortConfig.direction === 'ascending' ? 1 : -1);
                } else { // sort by links
                    const diff = a.download_links.length - b.download_links.length;
                    return diff * (sortConfig.direction === 'ascending' ? 1 : -1);
                }
            });
        }
        return sortableItems;
    }, [movies, sortConfig]);

    const paginatedMovies = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedMovies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedMovies, currentPage]);

    const totalPages = Math.ceil(sortedMovies.length / ITEMS_PER_PAGE);

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1); // Reset to first page on sort
    };

    const getSortIndicator = (key: SortKey) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? <ArrowUpIcon className="h-4 w-4 ml-1" /> : <ArrowDownIcon className="h-4 w-4 ml-1" />;
    };

    return (
        <section className="bg-light-secondary dark:bg-secondary p-6 rounded-lg">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                <h2 className="text-2xl font-bold">Stored Movie Links</h2>
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-semibold text-light-muted dark:text-muted">Sort by:</span>
                    <button onClick={() => requestSort('title')} className="flex items-center text-sm font-medium text-light-accent dark:text-accent hover:underline">
                        Title {getSortIndicator('title')}
                    </button>
                    <button onClick={() => requestSort('links')} className="flex items-center text-sm font-medium text-light-accent dark:text-accent hover:underline">
                        Links {getSortIndicator('links')}
                    </button>
                </div>
            </div>
            <div className="space-y-4">
                {paginatedMovies.length > 0 ? (
                    paginatedMovies.map(movie => (
                        <div key={movie._id} className="bg-light-primary dark:bg-primary p-4 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-bold text-lg">{movie.title} <span className="text-xs uppercase bg-light-accent dark:bg-accent text-white dark:text-primary font-bold px-2 py-0.5 rounded-full ml-2">{movie.type}</span></p>
                                <p className="text-sm text-light-muted dark:text-muted">{movie.download_links.length} link(s)</p>
                            </div>
                            <button onClick={() => onDeleteRequest(movie._id)} className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-red-500/10">
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-light-muted dark:text-muted">No movies have been added yet.</p>
                )}
            </div>
            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-1 mt-6">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 bg-light-primary dark:bg-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                        <button
                            key={pageNumber}
                            onClick={() => setCurrentPage(pageNumber)}
                            className={`px-4 py-2 rounded-md text-sm ${currentPage === pageNumber ? 'bg-light-accent dark:bg-accent text-white font-bold' : 'bg-light-primary dark:bg-primary hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            aria-current={currentPage === pageNumber ? 'page' : undefined}
                        >
                            {pageNumber}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 bg-light-primary dark:bg-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        Next
                    </button>
                </div>
            )}
        </section>
    );
};

type TicketSortKey = 'subject' | 'timestamp';
interface TicketSortConfig {
    key: TicketSortKey;
    direction: SortDirection;
}

const SupportTicketsSection: React.FC<{ tickets: SupportTicket[], onDeleteRequest: (id: string) => void }> = ({ tickets, onDeleteRequest }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<TicketSortConfig>({ key: 'timestamp', direction: 'descending' });
    
    const sortedTickets = useMemo(() => {
        return [...tickets].sort((a, b) => {
            let compareResult = 0;
            if (sortConfig.key === 'subject') {
                compareResult = a.subject.localeCompare(b.subject);
            } else { // timestamp
                compareResult = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            }
            return compareResult * (sortConfig.direction === 'ascending' ? 1 : -1);
        });
    }, [tickets, sortConfig]);

    const paginatedTickets = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedTickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedTickets, currentPage]);
    
    const totalPages = Math.ceil(sortedTickets.length / ITEMS_PER_PAGE);

    const requestSort = (key: TicketSortKey) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'descending' ? 'ascending' : 'descending'
        }));
        setCurrentPage(1);
    };

    const getSortIndicator = (key: TicketSortKey) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? <ArrowUpIcon className="h-4 w-4 ml-1" /> : <ArrowDownIcon className="h-4 w-4 ml-1" />;
    };
    
    return (
        <section className="bg-light-secondary dark:bg-secondary p-6 rounded-lg">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                <h2 className="text-2xl font-bold">Support Tickets</h2>
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-semibold text-light-muted dark:text-muted">Sort by:</span>
                    <button onClick={() => requestSort('timestamp')} className="flex items-center text-sm font-medium text-light-accent dark:text-accent hover:underline">
                        Date {getSortIndicator('timestamp')}
                    </button>
                    <button onClick={() => requestSort('subject')} className="flex items-center text-sm font-medium text-light-accent dark:text-accent hover:underline">
                        Subject {getSortIndicator('subject')}
                    </button>
                </div>
            </div>
            <div className="space-y-4">
                {paginatedTickets.length > 0 ? (
                    paginatedTickets.map(ticket => (
                        <div key={ticket._id} className="bg-light-primary dark:bg-primary p-4 rounded-md">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-lg">{ticket.subject}</p>
                                    <p className="text-xs text-light-muted dark:text-muted">
                                        {new Date(ticket.timestamp).toLocaleString()}
                                    </p>
                                    {ticket.contentTitle && <p className="text-sm mt-1 text-light-accent dark:text-accent">Regarding: {ticket.contentTitle}</p>}
                                </div>
                                <button onClick={() => onDeleteRequest(ticket._id)} className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-red-500/10 flex-shrink-0">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                            <p className="mt-2 text-light-text dark:text-gray-300 bg-light-secondary dark:bg-secondary p-3 rounded">{ticket.message}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-light-muted dark:text-muted">No support tickets found.</p>
                )}
            </div>
            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-1 mt-6">
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-2 bg-light-primary dark:bg-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm hover:bg-gray-200 dark:hover:bg-gray-700">Prev</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                        <button key={pageNumber} onClick={() => setCurrentPage(pageNumber)} className={`px-4 py-2 rounded-md text-sm ${currentPage === pageNumber ? 'bg-light-accent dark:bg-accent text-white font-bold' : 'bg-light-primary dark:bg-primary hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{pageNumber}</button>
                    ))}
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-2 bg-light-primary dark:bg-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm hover:bg-gray-200 dark:hover:bg-gray-700">Next</button>
                </div>
            )}
        </section>
    );
};


const AddMovieForm: React.FC<{onMovieAdded: () => void}> = ({onMovieAdded}) => {
    const [title, setTitle] = useState('');
    const debouncedTitle = useDebounce(title, 500);
    const [searchResults, setSearchResults] = useState<(MovieSummary | TVSummary)[]>([]);
    const [selectedMovie, setSelectedMovie] = useState<(MovieSummary | TVSummary) | null>(null);
    const [links, setLinks] = useState<DownloadLink[]>([{ label: '', url: '' }]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToast();

    // Drag and drop state
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        const fetchMovies = async () => {
            if (debouncedTitle.length > 2 && !selectedMovie) {
                try {
                    const res = await searchTMDB(debouncedTitle);
                    setSearchResults(res.results.slice(0, 5));
                } catch (error) {
                    console.error("Search failed:", error);
                    addToast('Could not perform search.', 'error');
                }
            } else {
                setSearchResults([]);
            }
        };
        fetchMovies();
    }, [debouncedTitle, selectedMovie, addToast]);

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

    const handleDragSort = () => {
        if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
            return;
        }
        const newLinks = [...links];
        const draggedItemContent = newLinks.splice(dragItem.current, 1)[0];
        newLinks.splice(dragOverItem.current, 0, draggedItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
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
            addToast("Please select a movie from the search results.", "error");
            return;
        }
        if (links.every(link => !link.label || !link.url)) {
            addToast("Please add at least one valid download link.", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const newMovie: Omit<StoredMovie, '_id'> = {
                tmdb_id: selectedMovie.id,
                title: 'title' in selectedMovie ? selectedMovie.title : selectedMovie.name,
                type: 'title' in selectedMovie ? 'movie' : 'tv',
                download_links: links.filter(link => link.label && link.url),
            };
            await addStoredMovie(newMovie);
            addToast('Movie added successfully!', 'success');
            resetForm();
            onMovieAdded();
// FIX: Corrected invalid `catch` syntax from `catch (error) => {` to `catch (error) {`. This fixes this and several subsequent cascading errors.
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            console.error("Add movie failed:", message);
            addToast(`Error: ${message}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <section className="bg-light-secondary dark:bg-secondary p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Add New Movie/TV Show</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <label className="block text-sm font-medium text-light-muted dark:text-muted">Search Movie/TV Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => {
                            setTitle(e.target.value);
                            if(selectedMovie) setSelectedMovie(null);
                        }}
                        placeholder="Start typing a title..."
                        className="w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent"
                    />
                    {searchResults.length > 0 && (
                        <div className="absolute z-10 w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
                            {searchResults.map(movie => {
                                const movieTitle = 'title' in movie ? movie.title : movie.name;
                                return (
                                <div key={movie.id} onClick={() => handleSelectMovie(movie)} className="p-3 hover:bg-light-secondary dark:hover:bg-secondary cursor-pointer flex items-center space-x-4">
                                    <img src={movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : 'https://picsum.photos/50/75'} alt={movieTitle} className="w-10 h-auto rounded"/>
                                    <div>
                                        <p>{movieTitle}</p>
                                        <p className="text-xs text-light-muted dark:text-muted">
                                            {'release_date' in movie ? movie.release_date?.split('-')[0] : movie.first_air_date?.split('-')[0]}
                                        </p>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {selectedMovie && (
                     <div className="bg-light-primary dark:bg-primary p-4 rounded-md flex items-center space-x-4">
                        <img src={selectedMovie.poster_path ? `${TMDB_IMAGE_BASE_URL}${selectedMovie.poster_path}` : 'https://picsum.photos/100/150'} alt={'title' in selectedMovie ? selectedMovie.title : selectedMovie.name} className="w-20 h-auto rounded"/>
                        <div>
                            <p className="font-bold text-lg">Selected: {'title' in selectedMovie ? selectedMovie.title : selectedMovie.name}</p>
                            <p className="text-sm text-light-muted dark:text-muted">TMDB ID: {selectedMovie.id}</p>
                            <p className="text-sm text-light-muted dark:text-muted">Year: {'release_date' in selectedMovie ? selectedMovie.release_date?.split('-')[0] : selectedMovie.first_air_date?.split('-')[0] || 'N/A'}</p>
                             <button type="button" onClick={() => { setSelectedMovie(null); setTitle(''); }} className="text-xs text-red-500 hover:underline mt-1">Clear Selection</button>
                        </div>
                     </div>
                )}
                
                <div>
                    <label className="block text-sm font-medium text-light-muted dark:text-muted mb-2">Download Links</label>
                    {links.map((link, index) => (
                        <div 
                            key={index} 
                            className="flex items-center space-x-2 mb-2 p-1 rounded-md bg-light-primary dark:bg-primary"
                            draggable
                            onDragStart={() => (dragItem.current = index)}
                            onDragEnter={() => (dragOverItem.current = index)}
                            onDragEnd={handleDragSort}
                            onDragOver={(e) => e.preventDefault()}
                        >
                             <span className="cursor-move p-1 text-light-muted dark:text-muted" title="Drag to reorder"><MenuIcon className="h-5 w-5"/></span>
                             <input type="text" placeholder="Label (e.g., 1080p)" value={link.label} onChange={(e) => handleLinkChange(index, 'label', e.target.value)} className="w-1/3 bg-light-secondary dark:bg-secondary border border-light-border dark:border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent" />
                             <input type="url" placeholder="URL" value={link.url} onChange={(e) => handleLinkChange(index, 'url', e.target.value)} className="w-2/3 bg-light-secondary dark:bg-secondary border border-light-border dark:border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent" />
                            <button type="button" onClick={() => handleRemoveLink(index)} className="p-2 text-red-500 hover:text-red-400"><TrashIcon className="h-5 w-5"/></button>
                        </div>
                    ))}
                    <button type="button" onClick={handleAddLink} className="flex items-center space-x-2 text-light-accent dark:text-accent hover:text-blue-400 text-sm mt-2">
                        <PlusCircleIcon className="h-5 w-5"/>
                        <span>Add Another Link</span>
                    </button>
                </div>
                
                <button type="submit" disabled={!selectedMovie || isSubmitting} className="w-full bg-light-highlight dark:bg-highlight text-white font-bold py-2 px-4 rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                    {isSubmitting ? 'Adding...' : 'Add Movie'}
                </button>
            </form>
        </section>
    );
};

export default AdminPage;
