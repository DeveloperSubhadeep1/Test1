import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
    const { addToast } = useToast();
    const [movieToDelete, setMovieToDelete] = useState<StoredMovie | null>(null);
    
    const [searchParams, setSearchParams] = useSearchParams();
    const [showModal, setShowModal] = useState(!!searchParams.get('search'));

    const fetchMovies = useCallback(() => {
        setLoading(true);
        getStoredMovies()
            .then(setMovies)
            .catch(() => addToast('Failed to load content.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchMovies();
    }, [fetchMovies]);
    
    useEffect(() => {
        if (searchParams.get('search')) {
            setShowModal(true);
            setEditingMovie(null); // Ensure we're in "Add New" mode
        }
    }, [searchParams]);

    const handleModalClose = () => {
        setShowModal(false);
        setEditingMovie(null);
        // Clean up URL on close
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('search');
        setSearchParams(newParams, { replace: true });
    };

    const handleSave = () => {
        handleModalClose();
        fetchMovies();
    };

    const handleDelete = async () => {
        if (!movieToDelete) return;
        try {
            await deleteStoredMovie(movieToDelete._id);
            addToast(`"${movieToDelete.title}" deleted successfully.`, 'success');
            setMovies(movies.filter(m => m._id !== movieToDelete._id));
        } catch (error) {
            addToast('Failed to delete content.', 'error');
        } finally {
            setMovieToDelete(null);
        }
    };
    
    if (loading) return (
        <>
            <TableSkeleton />
            <CardListSkeleton />
        </>
    );

    return (
        <>
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => { setEditingMovie(null); setShowModal(true); }}
                    className="flex items-center gap-2 bg-highlight text-white font-bold py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
                >
                    <PlusCircleIcon className="h-5 w-5" />
                    Add New Content
                </button>
            </div>
            {showModal && (
                <ContentModal
                    movie={editingMovie}
                    onClose={handleModalClose}
                    onSave={handleSave}
                    initialSearchQuery={searchParams.get('search')}
                />
            )}
            {movieToDelete && (
                <ConfirmationModal 
                    isOpen={!!movieToDelete}
                    onClose={() => setMovieToDelete(null)}
                    onConfirm={handleDelete}
                    title="Delete Content"
                    message={`Are you sure you want to delete "${movieToDelete.title}"? This action cannot be undone.`}
                />
            )}
             {/* Desktop Table View */}
            <div className="hidden md:block glass-panel rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm text-left">
                     <thead className="text-xs uppercase text-muted">
                        <tr>
                            <th scope="col" className="px-6 py-4 border-b border-glass-border">Title</th>
                            <th scope="col" className="px-6 py-4 border-b border-glass-border">Type</th>
                            <th scope="col" className="px-6 py-4 border-b border-glass-border">Links</th>
                            <th scope="col" className="px-6 py-4 border-b border-glass-border">Downloads</th>
                            <th scope="col" className="px-6 py-4 border-b border-glass-border text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movies.map(movie => (
                            <tr key={movie._id} className="border-b border-glass-border">
                                <td className="px-6 py-3 font-medium text-white">{movie.title}</td>
                                <td className="px-6 py-3 text-muted">{movie.type}</td>
                                <td className="px-6 py-3 text-white font-semibold">{movie.download_links.length}</td>
                                <td className="px-6 py-3 text-white font-semibold">{movie.download_count.toLocaleString()}</td>
                                <td className="px-6 py-3 text-right">
                                    <button onClick={() => { setEditingMovie(movie); setShowModal(true); }} className="p-2 text-muted hover:text-accent"><EditIcon className="h-5 w-5"/></button>
                                    <button onClick={() => setMovieToDelete(movie)} className="p-2 text-muted hover:text-danger"><TrashIcon className="h-5 w-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Mobile Card View */}
            <div className="space-y-4 md:hidden">
                {movies.map(movie => (
                    <div key={movie._id} className="glass-panel p-4 rounded-lg">
                        <p className="font-bold text-white truncate">{movie.title}</p>
                        <div className="flex justify-between text-sm mt-2">
                             <div className="text-center">
                                <p className="font-bold text-lg text-white">{movie.type}</p>
                                <p className="text-xs text-muted">Type</p>
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-lg text-white">{movie.download_links.length}</p>
                                <p className="text-xs text-muted">Links</p>
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-lg text-white">{movie.download_count.toLocaleString()}</p>
                                <p className="text-xs text-muted">Downloads</p>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-glass-border flex justify-end gap-2">
                            <button onClick={() => { setEditingMovie(movie); setShowModal(true); }} className="p-2 text-muted hover:text-accent"><EditIcon className="h-5 w-5"/></button>
                            <button onClick={() => setMovieToDelete(movie)} className="p-2 text-muted hover:text-danger"><TrashIcon className="h-5 w-5"/></button>
                        </div>
                    </div>
                ))}
            </div>
        </>
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
    getUsers().then(setUsers).catch(() => addToast('Failed to load users.', 'error')).finally(() => setLoading(false));
  }, [addToast]);

  if (loading) return (
    <>
        <TableSkeleton cols={5} />
        <CardListSkeleton />
    </>
  );

  return (
    <>
      {/* Mobile Card View */}
      <div className="space-y-4 md:hidden">
        {users.map(user => (
          <div key={user._id} className="glass-panel p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar avatar={user.avatar} className="h-10 w-10 rounded-full" />
                <div>
                  <p className="font-bold text-white">{user.username}</p>
                  <p className="text-xs text-muted">{user.email}</p>
                </div>
              </div>
            </div>
             <div className="mt-3 pt-3 border-t border-glass-border flex justify-around text-center">
                <div>
                    <p className="font-bold text-lg text-white">{user.favoritesCount}</p>
                    <p className="text-xs text-muted">Favorites</p>
                </div>
                <div>
                    <p className="font-bold text-lg text-white">{user.watchlistCount}</p>
                    <p className="text-xs text-muted">Watchlist</p>
                </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden md:block glass-panel rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase text-muted">
            <tr>
              <th scope="col" className="px-6 py-4 border-b border-glass-border">User</th>
              <th scope="col" className="px-6 py-4 border-b border-glass-border">Email</th>
              <th scope="col" className="px-6 py-4 border-b border-glass-border">Favorites</th>
              <th scope="col" className="px-6 py-4 border-b border-glass-border">Watchlist</th>
              <th scope="col" className="px-6 py-4 border-b border-glass-border">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} className="border-b border-glass-border">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar avatar={user.avatar} className="h-8 w-8 rounded-full" />
                    <span className="font-medium text-white">{user.username}</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-muted">{user.email}</td>
                <td className="px-6 py-3 text-white font-semibold">{user.favoritesCount}</td>
                <td className="px-6 py-3 text-white font-semibold">{user.watchlistCount}</td>
                <td className="px-6 py-3 text-muted">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
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

    useEffect(() => {
        getSupportTickets()
            .then(setTickets)
            .catch(() => addToast('Failed to load tickets.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    const handleDelete = async () => {
        if (!ticketToDelete) return;
        try {
            await deleteSupportTicket(ticketToDelete._id);
            setTickets(tickets.filter(t => t._id !== ticketToDelete._id));
            addToast('Ticket deleted.', 'info');
        } catch (err) {
            addToast('Failed to delete ticket.', 'error');
        } finally {
            setTicketToDelete(null);
        }
    };
    
    if (loading) return <TicketSkeleton />;

    return (
        <div className="space-y-4">
            {ticketToDelete && (
                 <ConfirmationModal 
                    isOpen={!!ticketToDelete}
                    onClose={() => setTicketToDelete(null)}
                    onConfirm={handleDelete}
                    title="Delete Support Ticket"
                    message="Are you sure you want to delete this ticket? This action cannot be undone."
                />
            )}
            {tickets.map(ticket => (
                <div key={ticket._id} className="glass-panel p-4 rounded-lg shadow-lg border-l-2 border-danger">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-white text-lg">{ticket.subject}</h3>
                            {ticket.contentTitle && <p className="text-sm text-cyan">Related: {ticket.contentTitle}</p>}
                             <p className="text-xs text-muted mt-1">From: {ticket.username || 'Guest'} | {new Date(ticket.timestamp).toLocaleString()}</p>
                        </div>
                         <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => setTicketToDelete(ticket)} className="p-2 text-muted hover:text-danger"><TrashIcon className="h-5 w-5"/></button>
                        </div>
                    </div>
                    <p className="mt-3 text-gray-300 whitespace-pre-wrap">{ticket.message}</p>
                </div>
            ))}
            {tickets.length === 0 && <p className="text-center text-muted">No support tickets found.</p>}
        </div>
    );
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Database Tab
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const DatabaseTab: React.FC = () => {
    const [stats, setStats] = useState<DbStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        getDbStats()
            .then(setStats)
            .catch(() => addToast('Failed to load database stats.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);
    
    if (loading) return <DatabaseSkeleton />;
    if (!stats) return <p>Could not load database statistics.</p>;

    const usedPercent = stats.totalBytes > 0 ? (stats.usedBytes / stats.totalBytes) * 100 : 0;
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    return (
        <div className="glass-panel p-6 rounded-lg flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold mb-6 text-white">Database Storage</h2>
            <div className="relative" style={{width: 250, height: 250}}>
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="transparent" stroke="currentColor" strokeWidth="10" className="text-gray-700"/>
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="10"
                        strokeDasharray={2 * Math.PI * 45}
                        strokeDashoffset={2 * Math.PI * 45 * (1 - usedPercent / 100)}
                        transform="rotate(-90 50 50)"
                        className="text-cyan animate-glow"
                        style={{ transition: 'stroke-dashoffset 1s ease-out', '--glow-color': 'cyan' } as React.CSSProperties}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <span className="text-4xl font-bold">{usedPercent.toFixed(1)}%</span>
                    <span className="text-sm text-muted">Used</span>
                </div>
            </div>
            <p className="mt-6 text-lg font-semibold text-white">
                {formatBytes(stats.usedBytes)} / {formatBytes(stats.totalBytes)}
            </p>
        </div>
    );
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Diagnostics Tab
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const DiagnosticsTab: React.FC = () => {
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

    const handleTestEmail = async () => {
        setIsTesting(true);
        setTestResult(null);
        try {
            const result = await apiTestEmail();
            setTestResult(result);
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown error occurred on the client side.";
            setTestResult({ success: false, message });
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="glass-panel p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-white">System Diagnostics</h2>
            <div className="space-y-4">
                <div className="bg-primary/50 p-4 rounded-md">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                        <div>
                            <h3 className="font-bold text-white">Email Service (SMTP)</h3>
                            <p className="text-sm text-muted">Tests the connection to the email server for sending OTPs.</p>
                        </div>
                        <button
                            onClick={handleTestEmail}
                            disabled={isTesting}
                            className="mt-2 sm:mt-0 flex items-center justify-center gap-2 bg-cyan text-primary font-bold py-2 px-4 rounded-md hover:brightness-125 transition-all disabled:bg-muted disabled:cursor-not-allowed"
                        >
                            {isTesting ? <SpinnerIcon className="animate-spin h-5 w-5"/> : 'Run Test'}
                        </button>
                    </div>
                    {testResult && (
                        <div className={`mt-4 p-3 rounded-md text-sm border ${testResult.success ? 'bg-green-900/50 border-green-700 text-green-300' : 'bg-red-900/50 border-red-700 text-red-300'}`}>
                           <div className="flex items-start gap-2">
                               {testResult.success ? <CheckCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" /> : <AlertTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />}
                               <p className="whitespace-pre-wrap font-mono text-xs">{testResult.message}</p>
                           </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Main Admin Page Component
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const AdminPage: React.FC = () => {
  const { isAdmin } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);

  usePageMetadata({
    title: 'Admin Dashboard',
    description: 'Manage content, users, and site metrics.',
    path: '/admin',
  });

  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-danger">Access Denied</h1>
        <p className="text-muted mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  const tabs = {
    dashboard: <DashboardTab />,
    content: <ContentManagementTab />,
    users: <UsersTab />,
    tickets: <SupportTicketsTab />,
    database: <DatabaseTab />,
    diagnostics: <DiagnosticsTab />,
  };
  
  const tabConfig = [
      { name: 'dashboard', label: 'Dashboard', icon: <UsersIcon className="h-5 w-5" /> },
      { name: 'content', label: 'Content', icon: <DownloadIcon className="h-5 w-5" /> },
      { name: 'users', label: 'Users', icon: <UsersIcon className="h-5 w-5" /> },
      { name: 'tickets', label: 'Tickets', icon: <MessageSquareIcon className="h-5 w-5" /> },
      { name: 'database', label: 'Database', icon: <DatabaseIcon className="h-5 w-5" /> },
      { name: 'diagnostics', label: 'Diagnostics', icon: <SettingsIcon className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold border-l-4 border-cyan pl-4">Admin Dashboard</h1>
        <div className="mt-4 border-b border-glass-border">
            <nav className="flex -mb-px space-x-2" aria-label="Tabs">
                {tabConfig.map(tab => (
                    <TabButton 
                        key={tab.name}
                        name={tab.name}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        label={tab.label}
                        icon={tab.icon}
                    />
                ))}
            </nav>
        </div>
      </header>
      
      <main>
        {tabs[activeTab as keyof typeof tabs]}
      </main>
    </div>
  );
};

export default AdminPage;

const ContentModal: React.FC<{
  movie: StoredMovie | null;
  onClose: () => void;
  onSave: () => void;
  initialSearchQuery?: string | null;
}> = ({ movie, onClose, onSave, initialSearchQuery }) => {
  const [tmdbId, setTmdbId] = useState<number | null>(movie?.tmdb_id || null);
  const [contentType, setContentType] = useState<ContentType>(movie?.type || 'movie');
  const [title, setTitle] = useState(movie?.title || '');
  const [links, setLinks] = useState<DownloadLink[]>(movie?.download_links || []);
  const { addToast } = useToast();

  // Search functionality
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<TMDBSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (debouncedSearchQuery.trim().length > 1) {
      setIsSearching(true);
      searchTMDB(debouncedSearchQuery)
        .then(res => setSearchResults(res.results.slice(0, 5)))
        .catch(() => addToast('TMDB search failed.', 'error'))
        .finally(() => setIsSearching(false));
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery, addToast]);

  const handleSelectSearchResult = (result: TMDBSearchResult) => {
    setTmdbId(result.id);
    setContentType(result.media_type);
    setTitle(result.media_type === 'movie' ? result.title : result.name);
    setSearchQuery('');
    setSearchResults([]);
  };

  const addLink = () => setLinks([...links, { label: '', url: '' }]);
  const removeLink = (index: number) => setLinks(links.filter((_, i) => i !== index));
  const updateLink = (index: number, field: 'label' | 'url' | 'suggestedBy', value: string) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setLinks(newLinks);
  };
  
  const handleAutomate = async (url: string, index: number) => {
    try {
        const { movieName, year, languages, quality, size, season, episode } = await apiParseUrl(url);
        
        const detectedType: ContentType = (season !== null && episode !== null) ? 'tv' : 'movie';
        
        setContentType(detectedType);

        // A more robust, multi-step search process.
        let finalResults: (MovieSummary | TVSummary)[] = [];

        // 1. Try the most specific search first: title + year.
        if (year) {
            const res = await searchContentByType(movieName, detectedType, year);
            if (res.results.length > 0) {
                finalResults = res.results;
            }
        }

        // 2. If that fails, or if there was no year, fall back to title-only search.
        if (finalResults.length === 0) {
            const res = await searchContentByType(movieName, detectedType);
            finalResults = res.results;
        }

        if (finalResults.length > 0) {
            const firstResult = finalResults[0];
            const resultAsTMDBSearch = { ...firstResult, media_type: detectedType } as TMDBSearchResult;
            handleSelectSearchResult(resultAsTMDBSearch);
        } else {
            addToast(`Could not find a match for "${movieName}" on TMDB.`, 'info');
            setTitle(movieName);
            setTmdbId(null);
        }
        
        const newLabel = generateLinkLabel({ quality, languages, size, season, episode });
        updateLink(index, 'label', newLabel);

    } catch (error) {
        addToast(error instanceof Error ? error.message : "Automation failed.", 'error');
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmdbId || !title) {
      addToast('Please select a movie/show from TMDB search.', 'error');
      return;
    }
    const finalLinks = links.filter(link => link.label && link.url);
    try {
      if (movie) {
        await updateStoredMovie(movie._id, { download_links: finalLinks });
        addToast('Content updated successfully.', 'success');
      } else {
        await addStoredMovie({ tmdb_id: tmdbId, type: contentType, title, download_links: finalLinks, download_count: 0 });
        addToast('Content added successfully.', 'success');
      }
      onSave();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to save content.', 'error');
    }
  };

  return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
        <div className="glass-panel rounded-lg shadow-xl w-full max-w-2xl border-cyan" style={{boxShadow: '0 0 30px rgba(8, 217, 214, 0.4)'}} onClick={e => e.stopPropagation()}>
             <form onSubmit={handleSubmit}>
                <div className="p-5 border-b border-glass-border flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">{movie ? 'Edit Content' : 'Add New Content'}</h3>
                    <button onClick={onClose} type="button" className="p-1 rounded-full hover:bg-white/10"><XIcon className="h-5 w-5 text-muted"/></button>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* TMDB Search */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-muted mb-1">Search TMDB</label>
                        <div className="relative">
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search for a movie or TV show..." className="w-full bg-primary border border-glass-border rounded-md p-2 pl-10 text-white" />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon className="h-5 w-5 text-muted"/></div>
                        </div>
                        {searchResults.length > 0 && (
                            <ul className="absolute z-10 w-full bg-secondary border border-glass-border rounded-md mt-1 max-h-60 overflow-y-auto">
                                {searchResults.map(result => (
                                    <li key={result.id} onClick={() => handleSelectSearchResult(result)} className="p-2 hover:bg-cyan/20 cursor-pointer flex items-center gap-3">
                                        <img src={`${TMDB_IMAGE_BASE_URL_SMALL}${result.poster_path}`} alt="" className="w-10 h-14 rounded-md"/>
                                        <div>
                                            <p className="font-bold text-white">{result.media_type === 'movie' ? result.title : result.name}</p>
                                            <p className="text-sm text-muted">{new Date(result.media_type === 'movie' ? result.release_date : result.first_air_date).getFullYear()}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-muted mb-1">TMDB ID</label>
                            <input type="number" value={tmdbId || ''} readOnly className="w-full bg-primary border border-glass-border rounded-md p-2 text-muted" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-muted mb-1">Type</label>
                            <input type="text" value={contentType} readOnly className="w-full bg-primary border border-glass-border rounded-md p-2 text-muted" />
                        </div>
                        <div className="sm:col-span-3">
                            <label className="block text-sm font-medium text-muted mb-1">Title</label>
                            <input type="text" value={title} readOnly className="w-full bg-primary border border-glass-border rounded-md p-2 text-muted" />
                        </div>
                    </div>

                    {/* Download Links */}
                    <div>
                        <h4 className="font-bold text-white mb-2">Download Links</h4>
                        <div className="space-y-3">
                            {links.map((link, index) => (
                                <div key={index} className="flex flex-col sm:flex-row gap-2 items-start">
                                    <input type="text" value={link.label} onChange={e => updateLink(index, 'label', e.target.value)} placeholder="Label (e.g., 1080p WEB-DL)" className="flex-grow bg-primary border border-glass-border rounded-md p-2 text-white w-full sm:w-auto"/>
                                    <div className="flex w-full sm:w-auto sm:flex-grow-[2]">
                                        <input type="url" value={link.url} onChange={e => updateLink(index, 'url', e.target.value)} placeholder="URL" className="flex-grow bg-primary border-r-0 border border-glass-border rounded-l-md p-2 text-white"/>
                                        <button type="button" onClick={() => handleAutomate(link.url, index)} className="p-2 bg-primary border border-glass-border text-cyan hover:bg-cyan/20 rounded-r-md">Automate</button>
                                    </div>
                                    <button type="button" onClick={() => removeLink(index)} className="p-2 text-muted hover:text-danger"><TrashIcon className="h-5 w-5"/></button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addLink} className="mt-2 text-cyan font-semibold text-sm">+ Add Link</button>
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