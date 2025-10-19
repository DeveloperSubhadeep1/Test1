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
  apiTestEmail,
  getDbStats,
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
  DbStats,
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
} from '../components/Icons';
import { useDebounce } from '../hooks/useDebounce';
import { TMDB_IMAGE_BASE_URL_SMALL } from '../constants';
import { Avatar } from '../components/Avatars';

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Tab Button Component
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const TabButton: React.FC<{ name: string; activeTab: string; setActiveTab: (name: string) => void; label: string }> = ({ name, activeTab, setActiveTab, label }) => {
  const isActive = activeTab === name;
  return (
    <button
      onClick={() => setActiveTab(name)}
      className={`relative px-4 py-2 text-sm font-bold transition-all duration-300 ${
        isActive
          ? 'text-cyan'
          : 'text-muted hover:text-cyan'
      }`}
    >
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
  // FIX: Make props Partial as the component is designed to handle a subset of metrics.
  colors: Partial<Record<keyof Metrics, string>>;
  metricConfig: Partial<Record<keyof Metrics, { label: string; color: string; icon: React.ReactNode }>>;
  onHover: (tooltipData: TooltipData) => void;
}

const CircularChart: React.FC<CircularChartProps> = ({ metrics, colors, metricConfig, onHover }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);

    const arcData = useMemo(() => {
        const colorKeys = Object.keys(colors) as Array<keyof Metrics>;
        // FIX: Calculate total based ONLY on the metrics that will be displayed in the chart.
        // This ensures the chart segments add up to a full circle (100%).
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

        // FIX: Re-calculate total based on displayed metrics to match the arc calculation,
        // ensuring the number in the center is also correct.
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
                // FIX: Add non-null assertion as `colors` is Partial but logic ensures key exists.
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
            // FIX: Add non-null assertion as logic ensures metricConfig has the same keys as colors.
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
      // Note: totalCollections is available in `metrics` but not displayed here as a card or in the chart legend.
  };

  if (loading) return <Spinner />;
  
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
// Users Tab
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    getUsers().then(setUsers).catch(() => addToast('Failed to load users.', 'error')).finally(() => setLoading(false));
  }, [addToast]);

  if (loading) return <Spinner />;

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
                  <p className="text-xs text-muted">
                    Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-glass-border flex justify-around text-sm text-center">
                <div>
                    <p className="text-muted text-xs">Favorites</p>
                    <p className="font-bold text-white">{user.favoritesCount}</p>
                </div>
                <div>
                    <p className="text-muted text-xs">Watchlist</p>
                    <p className="font-bold text-white">{user.watchlistCount}</p>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block glass-panel rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs uppercase text-muted">
            <tr>
              <th scope="col" className="px-6 py-4 border-b border-glass-border">Username</th>
              <th scope="col" className="px-6 py-4 border-b border-glass-border">Email</th>
              <th scope="col" className="px-6 py-4 border-b border-glass-border">Joined</th>
              <th scope="col" className="px-6 py-4 border-b border-glass-border">Favorites</th>
              <th scope="col" className="px-6 py-4 border-b border-glass-border">Watchlist</th>
            </tr>
          </thead>
          <tbody className="text-gray-300">
            {users.map(user => (
              <tr key={user._id} className="border-b border-glass-border hover:bg-cyan/10 transition-colors">
                <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                  <Avatar avatar={user.avatar} className="h-8 w-8 rounded-full" />
                  {user.username}
                </td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td className="px-6 py-4">{user.favoritesCount}</td>
                <td className="px-6 py-4">{user.watchlistCount}</td>
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
            <div key={ticket._id} className="glass-panel p-4 rounded-lg shadow-lg border-l-2 border-danger">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white">{ticket.subject}</h4>
                  {ticket.contentTitle && <p className="text-sm text-muted">Content: {ticket.contentTitle}</p>}
                  <p className="text-xs text-muted mt-1">{new Date(ticket.timestamp).toLocaleString()}</p>
                </div>
                <button onClick={() => setTicketToDelete(ticket)} className="p-2 text-muted hover:text-danger transition-colors" title="Delete Ticket">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-2 text-sm whitespace-pre-wrap text-gray-300">{ticket.message}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-muted">No support tickets.</p>
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
// Database Tab
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const DatabaseUsageChart: React.FC<{ usedBytes: number; totalBytes: number }> = ({ usedBytes, totalBytes }) => {
    const [isAnimated, setIsAnimated] = useState(false);
    
    useEffect(() => {
        const timer = setTimeout(() => setIsAnimated(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(1))} ${['B', 'KB', 'MB', 'GB', 'TB'][i]}`;
    };

    const usedPercent = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;
    
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const usedOffset = circumference - (usedPercent / 100) * circumference;

    const usedColor = '#8B949E'; // Muted Gray
    const freeColor = '#238636'; // Highlight Green

    return (
        <div className="flex flex-col items-center justify-center gap-4 text-center">
            <h3 className="text-2xl font-bold text-white">Database Storage</h3>
            <div className="relative w-56 h-56">
                <svg className="w-full h-full" viewBox="0 0 200 200">
                    <circle
                        cx="100"
                        cy="100"
                        r={radius}
                        fill="transparent"
                        stroke={freeColor}
                        strokeOpacity="0.2"
                        strokeWidth="20"
                    />
                    <circle
                        cx="100"
                        cy="100"
                        r={radius}
                        fill="transparent"
                        stroke={usedColor}
                        strokeWidth="20"
                        strokeDasharray={circumference}
                        strokeDashoffset={isAnimated ? usedOffset : circumference}
                        strokeLinecap="round"
                        transform="rotate(-90 100 100)"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-white">{usedPercent.toFixed(1)}%</span>
                    <span className="text-base text-muted">Used</span>
                </div>
            </div>
            <div className="text-lg font-semibold text-gray-300">
                <span style={{ color: usedColor }}>{formatBytes(usedBytes)}</span> / <span style={{ color: freeColor }}>{formatBytes(totalBytes)}</span>
            </div>
        </div>
    );
};

const DatabaseTab: React.FC = () => {
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
        try {
            setLoading(true);
            const dbStatsData = await getDbStats();
            setDbStats(dbStatsData);
        } catch (err) {
            addToast('Failed to load database stats.', 'error');
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [addToast]);

  if (loading) return <Spinner />;

  return (
    <div className="glass-panel p-6 rounded-lg flex flex-col items-center justify-center min-h-[50vh]">
        {dbStats ? (
            <DatabaseUsageChart usedBytes={dbStats.usedBytes} totalBytes={dbStats.totalBytes} />
        ) : (
            <p className="text-muted">Could not load database statistics.</p>
        )}
    </div>
  );
};


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Movies Tab and Modals
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const inputClass = "w-full bg-primary border border-glass-border rounded-md p-2 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-cyan transition-all";

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-panel rounded-lg shadow-xl w-full max-w-2xl border-cyan" style={{boxShadow: '0 0 30px rgba(8, 217, 214, 0.4)'}} onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-lg font-bold text-white">Edit Links for: <span className="text-cyan">{movie.title}</span></h3>
            <div className="space-y-4 mt-4 max-h-96 overflow-y-auto pr-2">
              {links.map((link, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input type="text" placeholder="Label (e.g., 1080p)" value={link.label} onChange={e => handleLinkChange(index, 'label', e.target.value)} className={`${inputClass} w-1/3`} />
                  <input type="url" placeholder="URL" value={link.url} onChange={e => handleLinkChange(index, 'url', e.target.value)} className={`${inputClass} w-2/3`} />
                  <button type="button" onClick={() => removeLink(index)} className="p-2 text-danger hover:bg-danger/10 rounded-full transition-colors">
                    <XIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addLink} className="mt-4 flex items-center gap-2 text-sm text-cyan font-semibold hover:brightness-125 transition-all">
              <PlusCircleIcon className="h-5 w-5" />
              Add another link
            </button>
          </div>
          <div className="bg-primary/50 px-6 py-4 flex justify-end gap-2 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-muted/50 text-white hover:bg-muted/70 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-cyan text-primary font-bold hover:brightness-125 transition-all disabled:bg-muted disabled:text-gray-800 disabled:cursor-not-allowed">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
     <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-panel rounded-lg shadow-xl w-full max-w-2xl border-cyan" style={{boxShadow: '0 0 30px rgba(8, 217, 214, 0.4)'}} onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">{step === 1 ? 'Step 1: Find Content' : `Step 2: Add links for ${selectedItem && ('title' in selectedItem ? selectedItem.title : selectedItem.name)}`}</h3>
              <button type="button" onClick={onClose} className="text-muted hover:text-white"><XIcon className="h-5 w-5" /></button>
            </div>
            {step === 1 ? (
              <div className="mt-4">
                <div className="relative">
                  <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search for a movie or TV show..." className={`${inputClass} pl-10`} />
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted pointer-events-none" />
                </div>
                {loading && <Spinner />}
                <ul className="mt-2 max-h-80 overflow-y-auto">
                  {searchResults.map(item => (
                    <li key={item.id} onClick={() => handleSelect(item)} className="p-2 flex gap-4 items-center hover:bg-cyan/10 rounded cursor-pointer transition-colors">
                      <img src={item.poster_path ? `${TMDB_IMAGE_BASE_URL_SMALL}${item.poster_path}` : ''} alt="" className="w-10 h-14 object-cover rounded bg-primary" />
                      <div>
                        <p className="text-white">{'title' in item ? item.title : item.name}</p>
                        <p className="text-sm text-muted">{new Date('release_date' in item ? item.release_date : item.first_air_date).getFullYear() || 'N/A'}</p>
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
                      <input type="text" placeholder="Label (e.g., 1080p)" value={link.label} onChange={e => handleLinkChange(index, 'label', e.target.value)} className={`${inputClass} w-1/3`} />
                      <input type="url" placeholder="URL" value={link.url} onChange={e => handleLinkChange(index, 'url', e.target.value)} className={`${inputClass} w-2/3`} />
                      <button type="button" onClick={() => removeLink(index)} className="p-2 text-danger hover:bg-danger/10 rounded-full transition-colors">
                        <XIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addLink} className="mt-4 flex items-center gap-2 text-sm text-cyan font-semibold hover:brightness-125 transition-all">
                  <PlusCircleIcon className="h-5 w-5" />
                  Add another link
                </button>
              </div>
            )}
          </div>
          <div className="bg-primary/50 px-6 py-4 flex justify-end gap-2 rounded-b-lg">
            {step === 2 && <button type="button" onClick={() => setStep(1)} className="px-4 py-2 rounded-md bg-muted/50 text-white hover:bg-muted/70 transition-colors">Back</button>}
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-muted/50 text-white hover:bg-muted/70 transition-colors">Cancel</button>
            {step === 2 && (
              <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-cyan text-primary font-bold hover:brightness-125 transition-all disabled:bg-muted disabled:text-gray-800 disabled:cursor-not-allowed">
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
    if (!searchQuery) return movies;
    return movies.filter(movie => movie.title.toLowerCase().includes(searchQuery.toLowerCase()));
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
          <input type="text" placeholder="Search by title..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`${inputClass} pl-10`} />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><SearchIcon className="h-5 w-5 text-muted" /></div>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-cyan text-primary font-bold py-2 px-4 rounded-md hover:brightness-125 transition-all w-full sm:w-auto flex-shrink-0"
        >
          <PlusCircleIcon className="h-5 w-5" />
          <span>Add New Links</span>
        </button>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-4 md:hidden">
        {filteredMovies.map(movie => (
          <div key={movie._id} className="glass-panel p-4 rounded-lg">
            <div>
              <p className="font-bold text-white truncate">{movie.title}</p>
              <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${movie.type === 'movie' ? 'bg-purple/20 text-purple' : 'bg-cyan/20 text-cyan'}`}>
                {movie.type}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-glass-border flex justify-between items-center text-sm">
              <div className="flex gap-6">
                  <div>
                    <p className="text-muted text-xs">Links</p>
                    <p className="font-bold text-white">{movie.download_links.length}</p>
                  </div>
                  <div>
                    <p className="text-muted text-xs">Downloads</p>
                    <p className="font-bold text-white">{movie.download_count}</p>
                  </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setMovieToEdit(movie)} className="p-2 text-muted hover:text-cyan transition-colors" title="Edit Links">
                  <EditIcon className="h-5 w-5" />
                </button>
                <button onClick={() => setMovieToDelete(movie)} className="p-2 text-muted hover:text-danger transition-colors" title="Delete">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden md:block glass-panel rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs uppercase text-muted">
            <tr>
              <th scope="col" className="px-6 py-4 border-b border-glass-border">Title</th>
              <th scope="col" className="px-6 py-4 border-b border-glass-border">Type</th>
              <th scope="col" className="px-6 py-4 border-b border-glass-border">Links</th>
              <th scope="col" className="px-6 py-4 border-b border-glass-border">Downloads</th>
              <th scope="col" className="px-6 py-4 border-b border-glass-border">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-300">
            {filteredMovies.map(movie => (
              <tr key={movie._id} className="border-b border-glass-border hover:bg-cyan/10 transition-colors">
                <td className="px-6 py-4 font-medium text-white">{movie.title}</td>
                <td className="px-6 py-4 uppercase">{movie.type}</td>
                <td className="px-6 py-4">{movie.download_links.length}</td>
                <td className="px-6 py-4">{movie.download_count}</td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={() => setMovieToEdit(movie)} className="p-2 text-muted hover:text-cyan transition-colors" title="Edit Links">
                    <EditIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => setMovieToDelete(movie)} className="p-2 text-muted hover:text-danger transition-colors" title="Delete">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(filteredMovies.length === 0 && !loading) && (
        <p className="text-center py-10 text-muted">No content found matching your search.</p>
      )}

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
// Diagnostics Tab
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const FormattedErrorMessage: React.FC<{ message: string }> = ({ message }) => {
    const parts = message.split('\n\nTROUBLESHOOTING:\n');
    const rawError = parts[0];
    const troubleshootingText = parts.length > 1 ? parts[1] : null;

    const formatLine = (line: string) => {
        // Bolds text wrapped in ** and makes it cyan
        const boldedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan">$1</strong>');
        return <span dangerouslySetInnerHTML={{ __html: boldedLine }} />;
    };

    return (
        <div>
            <p className="font-mono bg-primary p-3 rounded-md text-gray-400 text-xs mb-4 whitespace-pre-wrap break-words">{rawError}</p>
            {troubleshootingText && (
                <div>
                    <h5 className="font-bold text-white mb-2 uppercase tracking-wider">Troubleshooting</h5>
                    <ol className="space-y-3 text-sm text-gray-300 list-decimal list-outside ml-5">
                        {troubleshootingText.split(/\n(?=\d\.)/).map((step, index) => (
                            <li key={index} className="pl-2">{formatLine(step.replace(/^\d\.\s*/, ''))}</li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
};

const DiagnosticsTab: React.FC = () => {
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const { addToast } = useToast();

    const handleTestEmail = async () => {
        setIsTesting(true);
        setTestResult(null);
        try {
            const result = await apiTestEmail();
            setTestResult(result);
            if (result.success) {
                addToast('Test email sent successfully!', 'success');
            } else {
                addToast('Test email failed. See details below.', 'error');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            setTestResult({ success: false, message });
            addToast('An error occurred while running the test.', 'error');
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">System Diagnostics</h2>
            <div className="glass-panel p-6 rounded-lg">
                <h3 className="font-bold text-lg text-white mb-2">Email Service Test</h3>
                <p className="text-sm text-muted mb-4">
                    Click the button below to send a test email to the address configured in your backend environment variables (`EMAIL_USER`). This will verify your SMTP credentials and connection.
                </p>
                <button
                    onClick={handleTestEmail}
                    disabled={isTesting}
                    className="flex items-center justify-center gap-2 bg-cyan text-primary font-bold py-2 px-4 rounded-md hover:brightness-125 transition-all disabled:bg-muted disabled:cursor-not-allowed"
                >
                    {isTesting ? (
                        <>
                            <SpinnerIcon className="animate-spin h-5 w-5" />
                            <span>Testing...</span>
                        </>
                    ) : (
                        <>
                            <SettingsIcon className="h-5 w-5" />
                            <span>Send Test Email</span>
                        </>
                    )}
                </button>

                {testResult && (
                    <div className="mt-4 p-4 rounded-md bg-primary/50 border border-glass-border animate-fade-in">
                        <h4 className={`font-bold mb-3 ${testResult.success ? 'text-highlight' : 'text-danger'}`}>
                            Test Result: {testResult.success ? 'Success' : 'Failure'}
                        </h4>
                        {testResult.success ? (
                            <pre className="mt-2 text-xs text-gray-300 whitespace-pre-wrap break-words">
                                <code>{testResult.message}</code>
                            </pre>
                        ) : (
                           <FormattedErrorMessage message={testResult.message} />
                        )}
                    </div>
                )}
            </div>
        </div>
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
    return <p className="text-center py-20 text-xl text-white">Please log in to view the admin dashboard.</p>;
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold text-danger">Access Denied</h1>
        <p className="mt-4 text-muted">You do not have permission to view this page.</p>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab />;
      case 'movies': return <MoviesTab />;
      case 'users': return <UsersTab />;
      case 'tickets': return <SupportTicketsTab />;
      case 'database': return <DatabaseTab />;
      case 'diagnostics': return <DiagnosticsTab />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-white uppercase tracking-wider">Admin Dashboard</h1>
      <div className="glass-panel rounded-lg">
        <div className="flex border-b border-glass-border overflow-x-auto">
          <TabButton name="dashboard" activeTab={activeTab} setActiveTab={setActiveTab} label="Dashboard" />
          <TabButton name="movies" activeTab={activeTab} setActiveTab={setActiveTab} label="Content Links" />
          <TabButton name="users" activeTab={activeTab} setActiveTab={setActiveTab} label="Users" />
          <TabButton name="tickets" activeTab={activeTab} setActiveTab={setActiveTab} label="Support Tickets" />
          <TabButton name="database" activeTab={activeTab} setActiveTab={setActiveTab} label="Database" />
          <TabButton name="diagnostics" activeTab={activeTab} setActiveTab={setActiveTab} label="Diagnostics" />
        </div>
      </div>
      <div key={activeTab} className="animate-fade-in">{renderTabContent()}</div>
    </div>
  );
};

export default AdminPage;
