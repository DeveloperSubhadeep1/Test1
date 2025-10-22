import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationsContext } from '../context/NotificationsContext';
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
  apiTestEmail,
  getDbStats,
  // FIX: Imported missing functions from the api service.
  apiParseUrl,
  searchContentByType,
} from '../services/api';
import {
  Metrics,
  StoredMovie,
  AdminUserView,
  SupportTicket,
  DownloadLink,
  TMDBSearchResult,
  ContentItem,
  ContentType,
  DbStats,
  MovieSummary,
  TVSummary,
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
  DownloadIcon,
  MessageSquareIcon,
  UsersIcon,
  LinkIcon,
  SettingsIcon,
  SpinnerIcon,
  DatabaseIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from '../components/Icons';
import { useDebounce } from '../hooks/useDebounce';
import { TMDB_IMAGE_BASE_URL_SMALL } from '../constants';
import { Avatar } from '../components/Avatars';
import { generateLinkLabel } from '../utils';
import { DashboardSkeleton, TableSkeleton, CardListSkeleton, TicketSkeleton, DatabaseSkeleton } from '../components/AdminPageSkeletons';


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Tab Button Component
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const TabButton: React.FC<{ name: string; activeTab: string; setActiveTab: (name: string) => void; icon: React.ReactNode; label: string }> = ({ name, activeTab, setActiveTab, icon, label }) => {
  const isActive = activeTab === name;
  return (
    <button
      onClick={() => setActiveTab(name)}
      className={`relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-300 ${
        isActive
          ? 'text-cyan'
          : 'text-muted hover:text-white'
      }`}
    >
      {icon}
      {label}
      {isActive && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan animate-glow" style={{'--glow-color': 'cyan'} as React.CSSProperties}></div>}
    </button>
  );
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Dashboard Tab
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string; }> = ({ icon, label, value, color }) => (
    <div className="glass-panel p-4 rounded-lg flex flex-col justify-between" style={{ borderLeft: `2px solid ${color}` }}>
        <div>
            <div className="flex justify-between items-center text-muted">
                <span className="text-sm font-semibold">{label}</span>
                <div style={{ color }}>{icon}</div>
            </div>
            <p className="text-4xl font-bold text-white mt-2">{value}</p>
        </div>
    </div>
);

const TopContentBarChart: React.FC = () => {
    const [topMovies, setTopMovies] = useState<StoredMovie[]>([]);
    const [chartReady, setChartReady] = useState(false);

    useEffect(() => {
        getStoredMovies()
            .then(movies => {
                const moviesWithDownloads = movies.filter(m => m.download_count > 0);
                if (moviesWithDownloads.length > 0) {
                    const sorted = [...moviesWithDownloads].sort((a,b) => b.download_count - a.download_count);
                    setTopMovies(sorted.slice(0, 6));
                } else {
                    setTopMovies([]);
                }
                setTimeout(() => setChartReady(true), 100);
            })
            .catch(err => {
                console.error("Failed to load top content for chart", err);
                setTopMovies([]);
            });
    }, []);

    const maxDownloads = topMovies.length > 0 ? topMovies[0].download_count : 1;

    return (
        <div className="glass-panel p-6 rounded-lg h-full flex flex-col">
            <h3 className="font-bold text-lg text-white mb-4 flex-shrink-0">Top Content by Downloads</h3>
            {topMovies.length > 0 ? (
                <div className="flex-grow overflow-x-auto -mx-6 px-6 pb-2">
                    <div className="grid grid-cols-6 gap-x-4 min-w-[480px] h-full">
                        {topMovies.map((movie) => (
                            <div key={movie._id} className="flex flex-col-reverse items-center group text-center">
                                <p className="text-xs text-muted mt-2 truncate w-full flex-shrink-0" title={movie.title}>
                                    {movie.title}
                                </p>
                                <div className="relative w-full flex-grow" title={`${movie.title}: ${movie.download_count.toLocaleString()} downloads`}>
                                    <div
                                        className="absolute bottom-0 left-0 right-0 bg-cyan rounded-t-md transition-all duration-1000 ease-out group-hover:bg-purple group-hover:shadow-[0_0_15px_theme(colors.purple)]"
                                        style={{ height: chartReady ? `${(movie.download_count / maxDownloads) * 100}%` : '0%' }}
                                    >
                                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            {movie.download_count.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center text-muted">
                    No download data available.
                </div>
            )}
        </div>
    );
};

interface ArcData {
  key: keyof Metrics;
  startAngle: number;
  endAngle: number;
}
interface CircularChartProps {
  metrics: Metrics;
  colors: Partial<Record<keyof Metrics, string>>;
  metricConfig: Partial<Record<keyof Metrics, { label: string; color: string; icon: React.ReactNode }>>;
  onHover: (tooltipData: TooltipData) => void;
}

const CircularChart: React.FC<CircularChartProps> = ({ metrics, colors, metricConfig, onHover }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);

    const arcData = useMemo(() => {
        const colorKeys = Object.keys(colors) as Array<keyof Metrics>;
        const total = colorKeys.reduce((sum, key) => sum + (Number(metrics[key]) || 0), 0);
        
        const finalArcData: ArcData[] = [];
        if (total > 0) {
            let currentAngle = -Math.PI / 2; // Start at 12 o'clock
            colorKeys.forEach(key => {
                const value = metrics[key] || 0;
                if (value > 0) {
                    const sliceAngle = (value / total) * 2 * Math.PI;
                    const endAngle = currentAngle + sliceAngle;
                    finalArcData.push({ key, startAngle: currentAngle, endAngle });
                    currentAngle = endAngle;
                }
            });
        }
        return finalArcData;
    }, [metrics, colors]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const devicePixelRatio = window.devicePixelRatio || 1;
        const canvasSize = 220;
        canvas.width = canvasSize * devicePixelRatio;
        canvas.height = canvasSize * devicePixelRatio;
        canvas.style.width = `${canvasSize}px`;
        canvas.style.height = `${canvasSize}px`;
        ctx.scale(devicePixelRatio, devicePixelRatio);

        const colorKeys = Object.keys(colors) as Array<keyof Metrics>;
        const total = colorKeys.reduce((sum, key) => sum + (Number(metrics[key]) || 0), 0);

        const centerX = canvasSize / 2;
        const centerY = canvasSize / 2;
        const radius = 80;
        const defaultLineWidth = 28;
        
        const textColor = '#E5E7EB';
        const emptyColor = '#374151';
        
        if (total === 0) {
            ctx.clearRect(0, 0, canvasSize, canvasSize);
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = emptyColor;
            ctx.lineWidth = defaultLineWidth;
            ctx.stroke();
            ctx.fillStyle = textColor;
            ctx.textAlign = 'center';
            ctx.font = 'bold 36px Rajdhani';
            ctx.fillText('0', centerX, centerY + 10);
            return;
        }

        let animationFrameId: number;
        let startTimestamp: number | null = null;
        const duration = 1000;

        const animate = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const elapsed = timestamp - startTimestamp;
            const progress = Math.min(elapsed / duration, 1);

            ctx.clearRect(0, 0, canvasSize, canvasSize);

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = emptyColor;
            ctx.lineWidth = defaultLineWidth;
            ctx.stroke();

            arcData.forEach(arc => {
                const animatedEndAngle = arc.startAngle + (arc.endAngle - arc.startAngle) * progress;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, arc.startAngle, animatedEndAngle);
                ctx.strokeStyle = colors[arc.key]!;
                ctx.lineWidth = arc.key === hoveredKey ? defaultLineWidth + 4 : defaultLineWidth;
                ctx.stroke();
            });
            
            ctx.fillStyle = textColor;
            ctx.textAlign = 'center';
            ctx.font = 'bold 38px Rajdhani';
            ctx.fillText(Math.round(total * progress).toLocaleString(), centerX, centerY + 12);

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };
        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [metrics, colors, hoveredKey, arcData]);
    
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const canvasSize = 220;
        const centerX = canvasSize / 2;
        const centerY = canvasSize / 2;
        const radius = 80;
        const halfLineWidth = 14;
        
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        let angle = Math.atan2(dy, dx);
        if (angle < -Math.PI / 2) {
            angle += 2 * Math.PI;
        }

        let foundSegment: ArcData | null = null;
        if (distance > radius - halfLineWidth && distance < radius + halfLineWidth) {
            for (const arc of arcData) {
                if (angle >= arc.startAngle && angle < arc.endAngle) {
                    foundSegment = arc;
                    break;
                }
            }
        }
        
        if (foundSegment) {
            setHoveredKey(foundSegment.key);
            const value = Number(metrics[foundSegment.key]) || 0;
            const label = metricConfig[foundSegment.key]!.label;
            onHover({
                visible: true,
                content: `${label}: ${value.toLocaleString()}`,
                x: e.clientX,
                y: e.clientY
            });
        } else {
            setHoveredKey(null);
            onHover({ visible: false, content: '', x: 0, y: 0 });
        }
    };

    const handleMouseLeave = () => {
        setHoveredKey(null);
        onHover({ visible: false, content: '', x: 0, y: 0 });
    };

    return <canvas ref={canvasRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className="drop-shadow-[0_0_15px_rgba(8,217,214,0.4)]"></canvas>;
};

interface TooltipData {
  visible: boolean;
  content: string;
  x: number;
  y: number;
}
const DashboardTab: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const [tooltip, setTooltip] = useState<TooltipData>({ visible: false, content: '', x: 0, y: 0 });

  useEffect(() => {
    const fetchData = async () => {
        try {
            setLoading(true);
            const metricsData = await getMetrics();
            setMetrics(metricsData);
        } catch (err) {
            addToast('Failed to load dashboard data.', 'error');
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [addToast]);
  
  const metricConfig = {
      totalLinks: { label: 'Total Links', color: '#08D9D6', icon: <LinkIcon className="h-5 w-5"/> },
      totalDownloads: { label: 'Total Downloads', color: '#9A16DD', icon: <DownloadIcon className="h-5 w-5" /> },
      totalUsers: { label: 'Total Users', color: '#8B949E', icon: <UsersIcon className="h-5 w-5" /> },
      totalSupportTickets: { label: 'Support Tickets', color: '#FF2E63', icon: <MessageSquareIcon className="h-5 w-5" /> },
  };

  if (loading) return <DashboardSkeleton />;
  
  const chartColors = {
      totalLinks: metricConfig.totalLinks.color,
      totalDownloads: metricConfig.totalDownloads.color,
      totalUsers: metricConfig.totalUsers.color,
      totalSupportTickets: metricConfig.totalSupportTickets.color,
  };

  return (
    <>
      {tooltip.visible && (
          <div 
              className="fixed z-50 p-2 text-xs font-bold text-white bg-black/70 rounded-md shadow-lg pointer-events-none"
              style={{
                  transform: `translate(${tooltip.x + 15}px, ${tooltip.y + 15}px)`
              }}
          >
              {tooltip.content}
          </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {metrics && (Object.keys(metricConfig) as Array<keyof typeof metricConfig>).map(key => (
              <MetricCard 
                  key={key}
                  label={metricConfig[key].label}
                  value={(metrics[key] || 0).toLocaleString()}
                  color={metricConfig[key].color}
                  icon={metricConfig[key].icon}
              />
          ))}
      </div>
       <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
          <div className="xl:col-span-1 glass-panel p-6 rounded-lg flex flex-col items-center justify-center">
            {metrics && <CircularChart metrics={metrics} colors={chartColors} onHover={setTooltip} metricConfig={metricConfig} />}
            <div className="mt-6 pt-4 border-t border-glass-border w-full">
                <h3 className="font-bold text-base text-white text-center mb-3">Platform Overview</h3>
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                    {(Object.keys(chartColors) as Array<keyof typeof chartColors>).map(key => (
                        <div key={key} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors[key] }}></div>
                            <span className="text-sm text-gray-300">{metricConfig[key].label}</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
          <div className="xl:col-span-2">
              <TopContentBarChart />
          </div>
      </div>
    </>
  );
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Content Management Tab
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const ContentManagementTab: React.FC = () => {
    const [movies, setMovies] = useState<StoredMovie[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingMovie, setEditingMovie] = useState<StoredMovie | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<StoredMovie | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);

    const { addToast } = useToast();
    const { fetchNotifications } = useContext(NotificationsContext);

    const fetchMovies = useCallback(() => {
        setLoading(true);
        getStoredMovies()
            .then(data => {
                setMovies(data);
                setLoading(false);
            })
            .catch(err => {
                addToast('Failed to load content.', 'error');
                setLoading(false);
            });
    }, [addToast]);

    useEffect(() => {
        const [query] = useSearchParams();
        const prefillSearch = query.get('search');
        if(prefillSearch) {
            setSearchQuery(prefillSearch);
        }
    }, [useSearchParams]);
    
    useEffect(fetchMovies, [fetchMovies]);

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            await deleteStoredMovie(confirmDelete._id);
            addToast(`"${confirmDelete.title}" deleted successfully.`, 'info');
            fetchMovies();
        } catch (error) {
            addToast('Failed to delete content.', 'error');
        } finally {
            setConfirmDelete(null);
        }
    };

    const handleSave = async (movieToSave: StoredMovie, isNew: boolean) => {
        try {
            if (isNew) {
                const { _id, ...newMovieData } = movieToSave;
                await addStoredMovie(newMovieData);
                addToast(`"${movieToSave.title}" added successfully.`, 'success');
            } else {
                await updateStoredMovie(movieToSave._id, { download_links: movieToSave.download_links });
                addToast(`"${movieToSave.title}" updated successfully.`, 'success');
            }
            fetchMovies();
            fetchNotifications(); // Refresh notifications globally
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            addToast(`Failed to save: ${message}`, 'error');
        }
    };
    
    const filteredMovies = useMemo(() => {
        if (!debouncedSearch) return movies;
        return movies.filter(m => m.title.toLowerCase().includes(debouncedSearch.toLowerCase()));
    }, [movies, debouncedSearch]);

    const renderContent = () => {
        if (loading) return (
            <>
                <TableSkeleton />
                <CardListSkeleton />
            </>
        );
        if (filteredMovies.length === 0) return <p className="text-center text-muted">No content found.</p>;

        return (
            <>
                {/* Desktop Table View */}
                <div className="hidden md:block glass-panel rounded-lg shadow overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-xs uppercase text-muted">
                            <tr>
                                <th scope="col" className="px-6 py-4 border-b border-glass-border">Title</th>
                                <th scope="col" className="px-6 py-4 border-b border-glass-border text-center">Type</th>
                                <th scope="col" className="px-6 py-4 border-b border-glass-border text-center">Links</th>
                                <th scope="col" className="px-6 py-4 border-b border-glass-border text-center">Downloads</th>
                                <th scope="col" className="px-6 py-4 border-b border-glass-border text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMovies.map(movie => (
                                <tr key={movie._id} className="hover:bg-cyan/10 transition-colors border-b border-glass-border">
                                    <td className="px-6 py-4 font-semibold text-white">{movie.title}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${movie.type === 'movie' ? 'bg-cyan/20 text-cyan' : 'bg-purple/20 text-purple'}`}>{movie.type}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">{movie.download_links.length}</td>
                                    <td className="px-6 py-4 text-center">{movie.download_count.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => setEditingMovie(movie)} className="p-2 text-muted hover:text-cyan"><EditIcon className="h-4 w-4" /></button>
                                        <button onClick={() => setConfirmDelete(movie)} className="p-2 text-muted hover:text-danger"><TrashIcon className="h-4 w-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                 {/* Mobile Card View */}
                <div className="space-y-4 md:hidden">
                    {filteredMovies.map(movie => (
                         <div key={movie._id} className="glass-panel p-4 rounded-lg shadow-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-white">{movie.title}</h3>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${movie.type === 'movie' ? 'bg-cyan/20 text-cyan' : 'bg-purple/20 text-purple'}`}>{movie.type}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button onClick={() => setEditingMovie(movie)} className="p-2 text-muted hover:text-cyan"><EditIcon className="h-5 w-5" /></button>
                                    <button onClick={() => setConfirmDelete(movie)} className="p-2 text-muted hover:text-danger"><TrashIcon className="h-5 w-5" /></button>
                                </div>
                            </div>
                            <div className="flex justify-between mt-3 pt-3 border-t border-glass-border text-sm">
                                <span className="text-muted">Links: <span className="font-bold text-white">{movie.download_links.length}</span></span>
                                <span className="text-muted">Downloads: <span className="font-bold text-white">{movie.download_count.toLocaleString()}</span></span>
                            </div>
                        </div>
                    ))}
                </div>
            </>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-auto sm:flex-grow max-w-lg">
                    <input
                        type="text"
                        placeholder="Search content..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-primary border border-glass-border rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-muted" />
                    </div>
                </div>
                <button onClick={() => setShowAddModal(true)} className="group w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 bg-cyan text-primary font-bold py-2 px-4 rounded-full hover:brightness-125 transition-all">
                    <PlusCircleIcon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                    <span>Add New Content</span>
                </button>
            </div>
            
            {renderContent()}

            {(editingMovie || showAddModal) && (
                <ContentModal
                    movie={editingMovie}
                    onClose={() => { setEditingMovie(null); setShowAddModal(false); }}
                    onSave={handleSave}
                />
            )}
            {confirmDelete && (
                <ConfirmationModal
                    isOpen={!!confirmDelete}
                    onClose={() => setConfirmDelete(null)}
                    onConfirm={handleDelete}
                    title={`Delete "${confirmDelete.title}"`}
                    message="Are you sure you want to delete this content? All associated links will be permanently removed. This action cannot be undone."
                />
            )}
        </div>
    );
};


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Content Modal
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
interface ContentModalProps {
    movie: StoredMovie | null;
    onClose: () => void;
    onSave: (movie: StoredMovie, isNew: boolean) => void;
}

const ContentModal: React.FC<ContentModalProps> = ({ movie, onClose, onSave }) => {
    const [formData, setFormData] = useState<StoredMovie>(
        movie || { _id: '', tmdb_id: 0, type: 'movie', title: '', download_links: [], download_count: 0 }
    );
    const [isNew, setIsNew] = useState(!movie);
    const [tmdbSearchResults, setTmdbSearchResults] = useState<TMDBSearchResult[]>([]);
    const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
    const debouncedTmdbSearch = useDebounce(tmdbSearchQuery, 300);
    const [isAutomating, setIsAutomating] = useState(false);
    const [urlForAutomate, setUrlForAutomate] = useState('');
    const { addToast } = useToast();

    useEffect(() => {
        const search = async () => {
            if (debouncedTmdbSearch.trim().length > 1 && isNew) {
                try {
                    const res = await searchTMDB(debouncedTmdbSearch);
                    setTmdbSearchResults(res.results.slice(0, 5));
                } catch {
                    addToast('Failed to search TMDB.', 'error');
                }
            } else {
                setTmdbSearchResults([]);
            }
        };
        search();
    }, [debouncedTmdbSearch, isNew, addToast]);

    const handleAutomate = async () => {
        if (!urlForAutomate.trim()) {
            addToast('Please paste a URL to automate.', 'error');
            return;
        }
        setIsAutomating(true);
        try {
            const parsedData = await apiParseUrl(urlForAutomate);
            const searchType = parsedData.season === null ? 'movie' : 'tv';
            const { results } = await searchContentByType(parsedData.movieName, searchType, parsedData.year);

            if (results.length > 0) {
                const bestMatch = results[0];
                
                const newLink: DownloadLink = {
                    label: generateLinkLabel(parsedData),
                    url: urlForAutomate,
                };

                // FIX: Refactored to be type-safe and avoid a state update race condition.
                // This logic now correctly identifies the content type from the search and
                // combines all state updates into a single `setFormData` call.
                if (searchType === 'movie') {
                    const match = bestMatch as MovieSummary;
                    setFormData(prev => ({
                        ...prev,
                        tmdb_id: match.id,
                        title: match.title,
                        type: 'movie',
                        download_links: [newLink],
                    }));
                } else {
                    const match = bestMatch as TVSummary;
                    setFormData(prev => ({
                        ...prev,
                        tmdb_id: match.id,
                        title: match.name,
                        type: 'tv',
                        download_links: [newLink],
                    }));
                }
                
                setTmdbSearchQuery('');
                setTmdbSearchResults([]);
                addToast('Automation successful!', 'success');
            } else {
                addToast(`Could not find a match on TMDB for "${parsedData.movieName}". Please search manually.`, 'error');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unexpected error occurred during automation.';
            addToast(message, 'error');
        } finally {
            setIsAutomating(false);
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLinkChange = (index: number, field: keyof DownloadLink, value: string) => {
        const newLinks = [...formData.download_links];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setFormData(prev => ({ ...prev, download_links: newLinks }));
    };

    const addLink = () => {
        setFormData(prev => ({ ...prev, download_links: [...prev.download_links, { label: '', url: '' }] }));
    };

    const removeLink = (index: number) => {
        const newLinks = formData.download_links.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, download_links: newLinks }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.tmdb_id === 0 || !formData.title) {
            addToast('Please select a movie or TV show from TMDB.', 'error');
            return;
        }
        onSave(formData, isNew);
        onClose();
    };

    const handleSelectTmdbResult = (result: TMDBSearchResult) => {
        setFormData(prev => ({
            ...prev,
            tmdb_id: result.id,
            title: result.media_type === 'movie' ? (result as MovieSummary).title : (result as TVSummary).name,
            type: result.media_type,
        }));
        setTmdbSearchQuery('');
        setTmdbSearchResults([]);
    };
    
    const resetSelection = () => {
        setFormData(prev => ({
            ...prev,
            tmdb_id: 0,
            title: '',
        }));
    };
    
    const renderTmdbSelection = () => {
        if (formData.tmdb_id && formData.title) {
            return (
                <div className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                    <p className="font-semibold text-white">Selected: <span className="text-cyan">{formData.title}</span></p>
                    <button type="button" onClick={resetSelection} className="p-1 text-muted hover:text-white">
                        <XIcon className="h-4 w-4" />
                    </button>
                </div>
            );
        }
        
        return (
            <div className="relative">
                <input
                    type="text"
                    value={tmdbSearchQuery}
                    onChange={e => setTmdbSearchQuery(e.target.value)}
                    placeholder="Search TMDB for a movie or TV show..."
                    className="w-full bg-secondary border border-glass-border rounded-md p-2 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-cyan"
                />
                {tmdbSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-secondary border border-glass-border rounded-lg shadow-lg">
                        <ul>
                            {tmdbSearchResults.map(result => {
                                const title = result.media_type === 'movie' ? (result as MovieSummary).title : (result as TVSummary).name;
                                const releaseDate = result.media_type === 'movie' ? (result as MovieSummary).release_date : (result as TVSummary).first_air_date;
                                const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
                                return (
                                <li key={result.id} onClick={() => handleSelectTmdbResult(result)} className="flex items-center gap-3 p-2 hover:bg-cyan/10 cursor-pointer">
                                    <img src={`${TMDB_IMAGE_BASE_URL_SMALL}${result.poster_path}`} alt={title} className="w-8 h-12 rounded object-cover" />
                                    <div className="min-w-0">
                                        <p className="font-semibold text-white truncate">{title}</p>
                                        <p className="text-sm text-muted">{year}</p>
                                    </div>
                                </li>
                            )})}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="glass-panel rounded-lg shadow-xl w-full max-w-2xl border-cyan" style={{boxShadow: '0 0 30px rgba(8, 217, 214, 0.4)'}} onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-5 border-b border-glass-border flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">{isNew ? 'Add New Content' : `Editing "${formData.title}"`}</h3>
                        <button onClick={onClose} type="button" className="p-1 rounded-full hover:bg-white/10"><XIcon className="h-5 w-5 text-muted" /></button>
                    </div>
                    
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {isNew && (
                            <>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-muted">Automate from URL</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            placeholder="Paste a download link to auto-fill details..."
                                            value={urlForAutomate}
                                            onChange={e => setUrlForAutomate(e.target.value)}
                                            className="w-full bg-secondary border border-glass-border rounded-md p-2 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-cyan"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAutomate}
                                            disabled={isAutomating}
                                            className="w-32 flex-shrink-0 flex items-center justify-center gap-2 bg-purple text-white font-bold py-2 px-3 rounded-md hover:brightness-125 transition-all disabled:bg-muted"
                                        >
                                            {isAutomating ? <SpinnerIcon className="animate-spin h-5 w-5" /> : 'Automate'}
                                        </button>
                                    </div>
                                </div>
                                <div className="text-center text-xs text-muted">OR</div>
                                {renderTmdbSelection()}
                            </>
                        )}
                        {!isNew && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-muted">TMDB ID</label>
                                <input type="number" name="tmdb_id" value={formData.tmdb_id} onChange={handleInputChange} disabled className="w-full bg-secondary border-glass-border rounded-md p-2" />
                            </div>
                        )}
                        
                        <div>
                            <h4 className="text-sm font-medium text-muted mb-2">Download Links</h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {formData.download_links.map((link, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input type="text" placeholder="Label (e.g., 1080p WEB-DL)" value={link.label} onChange={e => handleLinkChange(index, 'label', e.target.value)} className="w-1/3 bg-secondary border border-glass-border rounded-md p-2 text-sm" />
                                        <input type="url" placeholder="URL" value={link.url} onChange={e => handleLinkChange(index, 'url', e.target.value)} className="flex-grow bg-secondary border border-glass-border rounded-md p-2 text-sm" required/>
                                        <button type="button" onClick={() => removeLink(index)} className="p-2 text-muted hover:text-danger"><TrashIcon className="h-4 w-4" /></button>
                                    </div>
                                ))}
                            </div>
                             <button type="button" onClick={addLink} className="group mt-2 flex items-center gap-2 text-sm text-cyan font-semibold hover:brightness-125">
                                <PlusCircleIcon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                                <span>Add Link</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-primary/50 px-6 py-4 flex justify-end gap-2 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-muted/50 text-white hover:bg-muted/70">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-cyan text-primary font-bold hover:brightness-125">Save</button>
                    </div>
                </form>
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
        setLoading(true);
        getUsers()
            .then(setUsers)
            .catch(() => addToast('Failed to load users.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    if (loading) return <TableSkeleton cols={6} />;

    return (
        <div className="glass-panel rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs uppercase text-muted">
                    <tr>
                        <th scope="col" className="px-6 py-4 border-b border-glass-border">User</th>
                        <th scope="col" className="px-6 py-4 border-b border-glass-border">Email</th>
                        <th scope="col" className="px-6 py-4 border-b border-glass-border text-center">Favorites</th>
                        <th scope="col" className="px-6 py-4 border-b border-glass-border text-center">Watchlist</th>
                        <th scope="col" className="px-6 py-4 border-b border-glass-border">Joined</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                         <tr key={user._id} className="hover:bg-cyan/10 transition-colors border-b border-glass-border">
                            <td className="px-6 py-4 font-semibold text-white">
                                <div className="flex items-center gap-3">
                                    <Avatar avatar={user.avatar} className="w-8 h-8 rounded-full" />
                                    <span>{user.username}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">{user.email}</td>
                            <td className="px-6 py-4 text-center">{user.favoritesCount}</td>
                            <td className="px-6 py-4 text-center">{user.watchlistCount}</td>
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
    const [confirmDelete, setConfirmDelete] = useState<SupportTicket | null>(null);
    const { addToast } = useToast();

    const fetchTickets = useCallback(() => {
        setLoading(true);
        getSupportTickets()
            .then(setTickets)
            .catch(() => addToast('Failed to load support tickets.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(fetchTickets, [fetchTickets]);

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            await deleteSupportTicket(confirmDelete._id);
            addToast('Ticket deleted.', 'info');
            fetchTickets();
        } catch (error) {
            addToast('Failed to delete ticket.', 'error');
        } finally {
            setConfirmDelete(null);
        }
    };
    
    if (loading) return <TicketSkeleton />;
    
    return (
        <div className="space-y-4">
            {tickets.length > 0 ? tickets.map(ticket => (
                <div key={ticket._id} className="glass-panel p-4 rounded-lg shadow-lg border-l-2 border-danger">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white">{ticket.subject}</h3>
                      <p className="text-sm text-muted">From: <span className="font-semibold text-gray-300">{ticket.username}</span></p>
                      <p className="text-xs text-muted">
                        {new Date(ticket.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => setConfirmDelete(ticket)} className="p-2 text-muted hover:text-danger"><TrashIcon className="h-5 w-5" /></button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-glass-border">
                    {ticket.contentTitle && <p className="text-sm font-semibold mb-1">Regarding: {ticket.contentTitle}</p>}
                    <p className="text-sm whitespace-pre-wrap">{ticket.message}</p>
                  </div>
                </div>
            )) : <p className="text-center text-muted">No support tickets found.</p>}
            
            {confirmDelete && (
                <ConfirmationModal
                    isOpen={!!confirmDelete}
                    onClose={() => setConfirmDelete(null)}
                    onConfirm={handleDelete}
                    title="Delete Ticket"
                    message="Are you sure you want to delete this support ticket? This action is permanent."
                />
            )}
        </div>
    );
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Diagnostics Tab
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const DiagnosticsTab: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string} | null>(null);

    const handleTestEmail = async () => {
        setIsLoading(true);
        setResult(null);
        try {
            const response = await apiTestEmail();
            setResult(response);
        } catch (error) {
            setResult({ success: false, message: error instanceof Error ? error.message : 'An unknown client-side error occurred.'});
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="glass-panel p-6 rounded-lg max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-2">Email Service Diagnostics</h3>
            <p className="text-muted mb-4">
                This tool sends a test email from the server to the address configured in your environment variables.
                It's essential for ensuring the OTP-based signup and password reset features are working correctly.
            </p>
            <button
                onClick={handleTestEmail}
                disabled={isLoading}
                className="group flex items-center justify-center gap-2 bg-cyan text-primary font-bold py-2 px-4 rounded-full hover:brightness-125 transition-all disabled:opacity-50"
            >
                {isLoading ? (
                    <>
                        <SpinnerIcon className="animate-spin h-5 w-5" />
                        <span>Sending...</span>
                    </>
                ) : (
                    'Send Test Email'
                )}
            </button>
            {result && (
                <div className={`mt-4 p-4 rounded-lg animate-fade-in ${result.success ? 'bg-highlight/20 border border-highlight' : 'bg-danger/20 border border-danger'}`}>
                    <div className="flex items-start">
                        {result.success ? <CheckCircleIcon className="h-5 w-5 text-highlight flex-shrink-0 mt-0.5" /> : <AlertTriangleIcon className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />}
                        <div className="ml-3">
                            <h4 className={`font-bold ${result.success ? 'text-highlight' : 'text-danger'}`}>{result.success ? 'Success' : 'Failure'}</h4>
                            <pre className="text-xs whitespace-pre-wrap font-sans mt-1">{result.message}</pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Database Tab
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const DatabaseTab: React.FC = () => {
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    getDbStats()
      .then(setDbStats)
      .catch(() => addToast('Failed to load database statistics.', 'error'))
      .finally(() => setLoading(false));
  }, [addToast]);

  if (loading) return <DatabaseSkeleton />;
  if (!dbStats) return <p className="text-center text-muted">Could not load database statistics.</p>;
  
  const usedPercent = dbStats ? (dbStats.usedBytes / dbStats.totalBytes) * 100 : 0;
  // To prevent the progress ring from being just a dot, set a minimum visual percentage.
  // This ensures that even for very small usage, a small arc is visible.
  const visualPercent = usedPercent > 0 && usedPercent < 1.5 ? 1.5 : usedPercent;
  const displayPercent = usedPercent > 0 && usedPercent < 0.1 ? '< 0.1' : usedPercent.toFixed(1);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="glass-panel p-6 rounded-lg flex flex-col items-center justify-center min-h-[50vh]">
        <h3 className="text-2xl font-bold text-white mb-4">Database Storage</h3>
        <div className="relative" style={{ width: 200, height: 200 }}>
            <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                    className="stroke-secondary"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3"
                />
                <path
                    className="stroke-cyan animate-glow"
                    style={{ '--glow-color': 'cyan' } as React.CSSProperties}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3"
                    strokeDasharray={`${visualPercent}, 100`}
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                />
            </svg>
        </div>
        <p className="text-4xl font-bold text-white mt-2">
            {displayPercent}%
        </p>
        <p className="text-muted text-lg">Used</p>
        <p className="text-white font-semibold mt-4">
            {formatSize(dbStats.usedBytes)} / {formatSize(dbStats.totalBytes)}
        </p>
    </div>
  );
};


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Main Admin Page Component
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const AdminPage: React.FC = () => {
    const { isAdmin, currentUser } = useContext(AuthContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'dashboard';

    const setActiveTab = (tabName: string) => {
        setSearchParams({ tab: tabName });
    };

    usePageMetadata({ title: 'Admin Dashboard', description: 'Manage CineStream content and users.', path: '/admin' });

    if (!currentUser) {
        return <div className="text-center py-10"><Spinner /></div>;
    }
    
    if (!isAdmin) {
        return (
            <div className="text-center py-20">
                <h1 className="text-4xl font-bold text-danger">Access Denied</h1>
                <p className="text-muted mt-2">You do not have permission to view this page.</p>
            </div>
        );
    }
    
    const tabs: { [key: string]: { component: React.ReactNode; icon: React.ReactNode; label: string } } = {
        dashboard: { component: <DashboardTab />, icon: <UsersIcon className="h-4 w-4" />, label: 'Dashboard' },
        content: { component: <ContentManagementTab />, icon: <EditIcon className="h-4 w-4" />, label: 'Content' },
        users: { component: <UsersTab />, icon: <UsersIcon className="h-4 w-4" />, label: 'Users' },
        tickets: { component: <SupportTicketsTab />, icon: <MessageSquareIcon className="h-4 w-4" />, label: 'Tickets' },
        database: { component: <DatabaseTab />, icon: <DatabaseIcon className="h-4 w-4" />, label: 'Database' },
        diagnostics: { component: <DiagnosticsTab />, icon: <SettingsIcon className="h-4 w-4" />, label: 'Diagnostics' },
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold border-l-4 border-cyan pl-4">Admin Dashboard</h1>
            <div className="border-b border-glass-border flex flex-wrap -mb-px">
                 {Object.entries(tabs).map(([key, { icon, label }]) => (
                    <TabButton key={key} name={key} activeTab={activeTab} setActiveTab={setActiveTab} icon={icon} label={label} />
                ))}
            </div>
            <div className="animate-fade-in">
                {tabs[activeTab]?.component || <div>Tab not found.</div>}
            </div>
        </div>
    );
};

export default AdminPage;