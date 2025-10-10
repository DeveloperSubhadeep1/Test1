import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { usePageMetadata } from '../hooks/usePageMetadata';
import {
  getMetrics,
  getStoredMovies,
  getUsers,
  getSupportTickets,
  deleteStoredMovie,
  deleteSupportTicket,
  updateStoredMovie,
  addStoredMovie,
  searchTMDB,
} from '../services/api';
import {
  Metrics,
  StoredMovie,
  AdminUserView,
  SupportTicket,
  DownloadLink,
  MovieSummary,
  TVSummary,
  ContentType,
} from '../types';
import Spinner from '../components/Spinner';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../hooks/useToast';
import {
  TrashIcon,
  EditIcon,
  PlusCircleIcon,
  XIcon,
  SearchIcon,
} from '../components/Icons';
import { useDebounce } from '../hooks/useDebounce';
import { TMDB_IMAGE_BASE_URL_SMALL } from '../constants';

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Tab Button Component
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const TabButton: React.FC<{ name: string; activeTab: string; setActiveTab: (name: string) => void; label: string }> = ({ name, activeTab, setActiveTab, label }) => {
  const isActive = activeTab === name;
  return (
    <button
      onClick={() => setActiveTab(name)}
      className={`px-4 py-2 -mb-px text-sm font-semibold border-b-2 transition-colors ${
        isActive
          ? 'border-light-accent dark:border-accent text-light-accent dark:text-accent'
          : 'border-transparent text-light-muted dark:text-muted hover:border-gray-400 dark:hover:border-gray-500 hover:text-light-text dark:hover:text-white'
      }`}
    >
      {label}
    </button>
  );
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Dashboard Tab
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const CircularChart: React.FC<{ metrics: Metrics; colors: Record<keyof Metrics, string> }> = ({ metrics, colors }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const devicePixelRatio = window.devicePixelRatio || 1;
        const canvasSize = 250;
        canvas.width = canvasSize * devicePixelRatio;
        canvas.height = canvasSize * devicePixelRatio;
        canvas.style.width = `${canvasSize}px`;
        canvas.style.height = `${canvasSize}px`;
        ctx.scale(devicePixelRatio, devicePixelRatio);

        const values = [metrics.totalLinks, metrics.totalDownloads, metrics.totalUsers, metrics.totalSupportTickets];
        const total = values.reduce((sum, val) => sum + (val || 0), 0);

        const centerX = canvasSize / 2;
        const centerY = canvasSize / 2;
        const radius = 90;
        const lineWidth = 30;
        
        const textColor = theme === 'dark' ? '#E5E7EB' : '#1F2328';
        const mutedTextColor = theme === 'dark' ? '#8B949E' : '#57606A';

        // Clear previous drawing before starting a new one
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        
        if (total === 0) {
            // Draw an empty state circle if there's no data
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = theme === 'dark' ? '#374151' : '#E5E7EB'; // Muted gray
            ctx.lineWidth = lineWidth;
            ctx.stroke();

            // Draw center text for empty state
            ctx.fillStyle = textColor;
            ctx.textAlign = 'center';
            ctx.font = 'bold 36px sans-serif';
            ctx.fillText('0', centerX, centerY);
            
            ctx.fillStyle = mutedTextColor;
            ctx.font = '14px sans-serif';
            ctx.fillText('Total Records', centerX, centerY + 25);
            return; // Exit after drawing empty state
        }

        let animationFrameId: number;
        let startTimestamp: number | null = null;
        const duration = 1000; // 1 second animation

        const animate = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const elapsed = timestamp - startTimestamp;
            const progress = Math.min(elapsed / duration, 1);

            ctx.clearRect(0, 0, canvasSize, canvasSize);

            let currentAngle = -Math.PI / 2;
            const colorKeys = Object.keys(colors) as Array<keyof Metrics>;

            colorKeys.forEach(key => {
                const value = metrics[key] || 0;
                const sliceAngle = (value / total) * 2 * Math.PI;
                
                if (sliceAngle > 0) { // Only draw if there's a slice to draw
                    const endAngle = currentAngle + sliceAngle * progress;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, currentAngle, endAngle);
                    ctx.strokeStyle = colors[key];
                    ctx.lineWidth = lineWidth;
                    ctx.stroke();
                }
                
                currentAngle += sliceAngle;
            });
            
            // Draw center text
            ctx.fillStyle = textColor;
            ctx.textAlign = 'center';
            ctx.font = 'bold 36px sans-serif';
            ctx.fillText(Math.round(total * progress).toLocaleString(), centerX, centerY);
            
            ctx.fillStyle = mutedTextColor;
            ctx.font = '14px sans-serif';
            ctx.fillText('Total Records', centerX, centerY + 25);


            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };

    }, [metrics, colors, theme]);

    return <canvas ref={canvasRef}></canvas>;
};


const DashboardTab: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await getMetrics();
        setMetrics(data);
      } catch (error) {
        addToast('Failed to load site metrics.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [addToast]);
  
  const metricConfig = useMemo(() => ({
      totalLinks: { label: 'Total Links', color: '#22c55e' },
      totalDownloads: { label: 'Total Downloads', color: '#a855f7' },
      totalUsers: { label: 'Total Users', color: '#9ca3af' },
      totalSupportTickets: { label: 'Support Tickets', color: '#ef4444' },
  }), []);


  if (loading) return <Spinner />;
  if (!metrics) return <p>Could not load metrics.</p>;
  
  const chartColors = {
      totalLinks: metricConfig.totalLinks.color,
      totalDownloads: metricConfig.totalDownloads.color,
      totalUsers: metricConfig.totalUsers.color,
      totalSupportTickets: metricConfig.totalSupportTickets.color,
  };

  const total = Object.values(metrics).reduce((sum, val) => sum + (val || 0), 0);
  
  const legendItems = (Object.keys(metricConfig) as Array<keyof Metrics>).map(key => ({
      ...metricConfig[key],
      value: metrics[key] || 0,
      percentage: total > 0 ? (((metrics[key] || 0) / total) * 100).toFixed(1) : '0.0'
  }));


  return (
     <div className="bg-light-secondary dark:bg-secondary p-6 rounded-lg shadow-lg text-center max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-light-text dark:text-white">System Overview</h2>
        <p className="text-sm text-light-muted dark:text-muted mb-6">Live visualization of database records</p>
        
        <div className="flex justify-center my-4">
             <CircularChart metrics={metrics} colors={chartColors} />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 mt-8 pt-6 border-t border-light-border dark:border-gray-700 text-left">
            {legendItems.map(item => (
                <div key={item.label}>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="text-sm text-light-muted dark:text-muted">{item.label}</span>
                    </div>
                    <p className="font-bold text-xl text-light-text dark:text-white mt-1">{item.value.toLocaleString()}</p>
                    <p className="text-xs text-light-accent dark:text-accent font-semibold">{item.percentage}% of total</p>
                </div>
            ))}
        </div>
     </div>
  );
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Users Tab
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await getUsers();
        setUsers(data);
      } catch (error) {
        addToast('Failed to load users.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [addToast]);

  if (loading) return <Spinner />;

  return (
    <div className="bg-light-secondary dark:bg-secondary rounded-lg shadow overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-light-primary dark:bg-primary text-xs uppercase text-light-muted dark:text-muted">
          <tr>
            <th scope="col" className="px-6 py-3">Username</th>
            <th scope="col" className="px-6 py-3">Favorites</th>
            <th scope="col" className="px-6 py-3">Watchlist</th>
            <th scope="col" className="px-6 py-3">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id} className="border-b border-light-border dark:border-gray-700 hover:bg-light-primary dark:hover:bg-primary">
              <td className="px-6 py-4 font-medium text-light-text dark:text-white">{user.username}</td>
              <td className="px-6 py-4">{user.favoritesCount}</td>
              <td className="px-6 py-4">{user.watchlistCount}</td>
              <td className="px-6 py-4">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Support Tickets Tab
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const SupportTicketsTab: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketToDelete, setTicketToDelete] = useState<SupportTicket | null>(null);
  const { addToast } = useToast();

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSupportTickets();
      setTickets(data);
    } catch (error) {
      addToast('Failed to load support tickets.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleDelete = async () => {
    if (!ticketToDelete) return;
    try {
      await deleteSupportTicket(ticketToDelete._id);
      addToast('Support ticket deleted.', 'success');
      fetchTickets();
    } catch (error) {
      addToast('Failed to delete ticket.', 'error');
    }
    setTicketToDelete(null);
  };

  if (loading) return <Spinner />;

  return (
    <>
      <div className="space-y-4">
        {tickets.length > 0 ? (
          tickets.map(ticket => (
            <div key={ticket._id} className="bg-light-secondary dark:bg-secondary p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold">{ticket.subject}</h4>
                  {ticket.contentTitle && <p className="text-sm text-light-muted dark:text-muted">Content: {ticket.contentTitle}</p>}
                  <p className="text-xs text-light-muted dark:text-muted mt-1">{new Date(ticket.timestamp).toLocaleString()}</p>
                </div>
                <button onClick={() => setTicketToDelete(ticket)} className="p-2 text-light-muted dark:text-muted hover:text-red-500" title="Delete Ticket">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-2 text-sm whitespace-pre-wrap">{ticket.message}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-light-muted dark:text-muted">No support tickets.</p>
        )}
      </div>
      <ConfirmationModal
        isOpen={!!ticketToDelete}
        onClose={() => setTicketToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Support Ticket"
        message="Are you sure you want to delete this support ticket? This action cannot be undone."
      />
    </>
  );
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Movies Tab and Modals
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Edit Modal
interface MovieEditModalProps {
  movie: StoredMovie;
  onClose: () => void;
  onSave: () => void;
}
const MovieEditModal: React.FC<MovieEditModalProps> = ({ movie, onClose, onSave }) => {
  const [links, setLinks] = useState<DownloadLink[]>(() => (movie.download_links.length > 0 ? movie.download_links : [{ label: '', url: '' }]));
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleLinkChange = (index: number, field: 'label' | 'url', value: string) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  const addLink = () => setLinks([...links, { label: '', url: '' }]);
  const removeLink = (index: number) => setLinks(links.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validLinks = links.filter(link => link.label.trim() && link.url.trim());
    if (validLinks.length === 0) {
      addToast('Please add at least one valid link.', 'error');
      return;
    }
    setLoading(true);
    try {
      await updateStoredMovie(movie._id, { download_links: validLinks });
      addToast('Links updated successfully.', 'success');
      onSave();
      onClose();
    } catch (error) {
      addToast('Failed to update links.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-light-secondary dark:bg-secondary rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-lg font-bold">Edit Links for: {movie.title}</h3>
            <div className="space-y-4 mt-4 max-h-96 overflow-y-auto pr-2">
              {links.map((link, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input type="text" placeholder="Label (e.g., 1080p)" value={link.label} onChange={e => handleLinkChange(index, 'label', e.target.value)} className="w-1/3 bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded p-2" />
                  <input type="url" placeholder="URL" value={link.url} onChange={e => handleLinkChange(index, 'url', e.target.value)} className="w-2/3 bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded p-2" />
                  <button type="button" onClick={() => removeLink(index)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full">
                    <XIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addLink} className="mt-4 flex items-center gap-2 text-sm text-light-accent dark:text-accent font-semibold">
              <PlusCircleIcon className="h-5 w-5" />
              Add another link
            </button>
          </div>
          <div className="bg-light-primary dark:bg-primary px-6 py-4 flex justify-end gap-2 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-500 text-white">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-light-accent dark:bg-accent text-white disabled:bg-gray-400">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Modal
interface MovieAddModalProps {
  onClose: () => void;
  onSave: () => void;
}
const MovieAddModal: React.FC<MovieAddModalProps> = ({ onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const [searchResults, setSearchResults] = useState<(MovieSummary | TVSummary)[]>([]);
  const [selectedItem, setSelectedItem] = useState<(MovieSummary | TVSummary) & { type: ContentType } | null>(null);
  const [links, setLinks] = useState<DownloadLink[]>([{ label: '', url: '' }]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (debouncedQuery.trim().length > 2) {
      setLoading(true);
      searchTMDB(debouncedQuery)
        .then(res => setSearchResults(res.results))
        .catch(() => addToast('Search failed', 'error'))
        .finally(() => setLoading(false));
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery, addToast]);

  const handleSelect = (item: MovieSummary | TVSummary) => {
    const type = (item as any).media_type || ('title' in item ? 'movie' : 'tv');
    setSelectedItem({ ...item, type });
    setStep(2);
  };

  const handleLinkChange = (index: number, field: 'label' | 'url', value: string) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  const addLink = () => setLinks([...links, { label: '', url: '' }]);
  const removeLink = (index: number) => setLinks(links.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const validLinks = links.filter(link => link.label.trim() && link.url.trim());
    if (validLinks.length === 0) {
      addToast('Please add at least one valid link.', 'error');
      return;
    }
    setLoading(true);
    try {
      await addStoredMovie({
        tmdb_id: selectedItem.id,
        type: selectedItem.type,
        title: 'title' in selectedItem ? selectedItem.title : selectedItem.name,
        download_links: validLinks,
        download_count: 0,
      });
      addToast('New content added successfully.', 'success');
      onSave();
      onClose();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to add content.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-light-secondary dark:bg-secondary rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{step === 1 ? 'Step 1: Find Content' : `Step 2: Add links for ${selectedItem && ('title' in selectedItem ? selectedItem.title : selectedItem.name)}`}</h3>
              <button type="button" onClick={onClose}><XIcon className="h-5 w-5" /></button>
            </div>
            {step === 1 ? (
              <div className="mt-4">
                <div className="relative">
                  <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search for a movie or TV show..." className="w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded p-2 pl-10" />
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-light-muted dark:text-muted" />
                </div>
                {loading && <Spinner />}
                <ul className="mt-2 max-h-80 overflow-y-auto">
                  {searchResults.map(item => (
                    <li key={item.id} onClick={() => handleSelect(item)} className="p-2 flex gap-4 items-center hover:bg-light-primary dark:hover:bg-primary rounded cursor-pointer">
                      <img src={item.poster_path ? `${TMDB_IMAGE_BASE_URL_SMALL}${item.poster_path}` : ''} alt="" className="w-10 h-14 object-cover rounded bg-light-primary dark:bg-primary" />
                      <div>
                        <p>{'title' in item ? item.title : item.name}</p>
                        <p className="text-sm text-light-muted dark:text-muted">{new Date('release_date' in item ? item.release_date : item.first_air_date).getFullYear() || 'N/A'}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-4">
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {links.map((link, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input type="text" placeholder="Label (e.g., 1080p)" value={link.label} onChange={e => handleLinkChange(index, 'label', e.target.value)} className="w-1/3 bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded p-2" />
                      <input type="url" placeholder="URL" value={link.url} onChange={e => handleLinkChange(index, 'url', e.target.value)} className="w-2/3 bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded p-2" />
                      <button type="button" onClick={() => removeLink(index)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full">
                        <XIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addLink} className="mt-4 flex items-center gap-2 text-sm text-light-accent dark:text-accent font-semibold">
                  <PlusCircleIcon className="h-5 w-5" />
                  Add another link
                </button>
              </div>
            )}
          </div>
          <div className="bg-light-primary dark:bg-primary px-6 py-4 flex justify-end gap-2 rounded-b-lg">
            {step === 2 && <button type="button" onClick={() => setStep(1)} className="px-4 py-2 rounded bg-gray-500 text-white">Back to Search</button>}
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-500 text-white">Cancel</button>
            {step === 2 && (
              <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-light-accent dark:bg-accent text-white disabled:bg-gray-400">
                {loading ? 'Saving...' : 'Save Content'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// Movies Tab Main Component
const MoviesTab: React.FC = () => {
  const [movies, setMovies] = useState<StoredMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [movieToEdit, setMovieToEdit] = useState<StoredMovie | null>(null);
  const [movieToDelete, setMovieToDelete] = useState<StoredMovie | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToast } = useToast();

  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getStoredMovies();
      setMovies(data.sort((a, b) => a.title.localeCompare(b.title)));
    } catch (error) {
      addToast('Failed to load stored movies.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const filteredMovies = useMemo(() => {
    if (!searchQuery) {
      return movies;
    }
    return movies.filter(movie =>
      movie.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [movies, searchQuery]);

  const handleDelete = async () => {
    if (!movieToDelete) return;
    try {
      await deleteStoredMovie(movieToDelete._id);
      addToast('Movie links deleted.', 'success');
      fetchMovies();
    } catch (error) {
      addToast('Failed to delete movie links.', 'error');
    }
    setMovieToDelete(null);
  };

  if (loading) return <Spinner />;

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-light-muted dark:text-muted" />
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-light-accent dark:bg-accent text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity w-full sm:w-auto flex-shrink-0"
        >
          <PlusCircleIcon className="h-5 w-5" />
          <span>Add New Links</span>
        </button>
      </div>

      <div className="bg-light-secondary dark:bg-secondary rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-light-primary dark:bg-primary text-xs uppercase text-light-muted dark:text-muted">
            <tr>
              <th scope="col" className="px-6 py-3">Title</th>
              <th scope="col" className="px-6 py-3">Type</th>
              <th scope="col" className="px-6 py-3">Links</th>
              <th scope="col" className="px-6 py-3">Downloads</th>
              <th scope="col" className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovies.map(movie => (
              <tr key={movie._id} className="border-b border-light-border dark:border-gray-700 hover:bg-light-primary dark:hover:bg-primary">
                <td className="px-6 py-4 font-medium text-light-text dark:text-white">{movie.title}</td>
                <td className="px-6 py-4 uppercase">{movie.type}</td>
                <td className="px-6 py-4">{movie.download_links.length}</td>
                <td className="px-6 py-4">{movie.download_count}</td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={() => setMovieToEdit(movie)} className="p-2 text-light-muted dark:text-muted hover:text-light-accent dark:hover:text-accent" title="Edit Links">
                    <EditIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => setMovieToDelete(movie)} className="p-2 text-light-muted dark:text-muted hover:text-red-500" title="Delete">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
             {filteredMovies.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-light-muted dark:text-muted">
                  No content found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddModalOpen && <MovieAddModal onClose={() => setIsAddModalOpen(false)} onSave={fetchMovies} />}
      {movieToEdit && <MovieEditModal movie={movieToEdit} onClose={() => setMovieToEdit(null)} onSave={fetchMovies} />}
      <ConfirmationModal
        isOpen={!!movieToDelete}
        onClose={() => setMovieToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Movie Links"
        message={`Are you sure you want to delete all links for "${movieToDelete?.title}"? This action cannot be undone.`}
      />
    </>
  );
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Main AdminPage Component
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const AdminPage: React.FC = () => {
  const { isAdmin, isAuthenticated } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');

  usePageMetadata({
    title: 'Admin Dashboard',
    description: 'Manage CineStream content, users, and support tickets.',
    path: '/admin',
  });

  if (!isAuthenticated) {
    return <p className="text-center py-20 text-xl">Please log in to view the admin dashboard.</p>;
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold">Access Denied</h1>
        <p className="mt-4 text-light-muted dark:text-muted">You do not have permission to view this page.</p>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'movies':
        return <MoviesTab />;
      case 'users':
        return <UsersTab />;
      case 'tickets':
        return <SupportTicketsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold border-l-4 border-light-accent dark:border-accent pl-4">Admin Dashboard</h1>
      <div className="flex border-b border-light-border dark:border-gray-700">
        <TabButton name="dashboard" activeTab={activeTab} setActiveTab={setActiveTab} label="Dashboard" />
        <TabButton name="movies" activeTab={activeTab} setActiveTab={setActiveTab} label="Content Links" />
        <TabButton name="users" activeTab={activeTab} setActiveTab={setActiveTab} label="Users" />
        <TabButton name="tickets" activeTab={activeTab} setActiveTab={setActiveTab} label="Support Tickets" />
      </div>
      <div>{renderTabContent()}</div>
    </div>
  );
};

export default AdminPage;