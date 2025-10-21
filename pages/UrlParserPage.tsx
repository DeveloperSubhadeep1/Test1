import React, { useState } from 'react';
import { usePageMetadata } from '../hooks/usePageMetadata';
import { useToast } from '../hooks/useToast';
import { apiParseUrl } from '../services/api';
import { LinkIcon, SpinnerIcon, CopyIcon, PlusCircleIcon } from '../components/Icons';
import { ParsedUrlData } from '../types';
import { Link } from 'react-router-dom';

const UrlParserPage: React.FC = () => {
    usePageMetadata({
        title: 'URL Parser Tool',
        description: 'Extract movie and TV show details from a download link.',
        path: '/url-parser',
    });

    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ParsedUrlData | null>(null);
    const { addToast } = useToast();

    const ResultCard: React.FC<{ data: ParsedUrlData }> = ({ data }) => {
        const handleCopy = () => {
            const infoParts = [
                data.movieName,
            ];
            if (data.season && data.episode) {
                const seasonStr = String(data.season).padStart(2, '0');
                const episodeStr = String(data.episode).padStart(2, '0');
                infoParts.push(`S${seasonStr}E${episodeStr}`);
            } else if (data.year) {
                infoParts.push(String(data.year));
            }
            if (data.languages.length > 0) {
                infoParts.push(data.languages.join(' '));
            }
            if (data.quality) {
                infoParts.push(data.quality);
            }
            if (data.size) {
                infoParts.push(data.size);
            }
            
            const infoString = infoParts.filter(Boolean).join(' ');

            navigator.clipboard.writeText(infoString).then(() => {
                addToast('Info copied to clipboard!', 'success');
            }).catch(err => {
                addToast('Failed to copy info.', 'error');
                console.error('Copy failed:', err);
            });
        };
        
        const isTV = data.season !== null && data.episode !== null;

        return (
            <div className="glass-panel p-6 rounded-lg animate-fade-in mt-8">
                <div className="flex justify-between items-start mb-4 gap-4">
                    <h3 className="text-2xl font-bold text-white">{data.movieName || 'Unknown Title'}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button 
                            onClick={handleCopy}
                            className="flex items-center gap-2 text-sm bg-secondary text-muted px-3 py-1.5 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
                            title="Copy info to clipboard"
                        >
                            <CopyIcon className="h-4 w-4" />
                        </button>
                        {data.movieName && (
                            <Link
                                to={`/admin?tab=content&search=${encodeURIComponent(data.movieName)}`}
                                className="flex items-center gap-2 text-sm bg-highlight text-white px-3 py-1.5 rounded-full hover:bg-green-600 transition-colors"
                                title="Add this content to the database"
                            >
                                <PlusCircleIcon className="h-4 w-4" />
                            </Link>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                     {isTV ? (
                        <>
                            <div>
                                <p className="text-muted">Season</p>
                                <p className="font-semibold text-lg">{data.season}</p>
                            </div>
                            <div>
                                <p className="text-muted">Episode</p>
                                <p className="font-semibold text-lg">{data.episode}</p>
                            </div>
                        </>
                    ) : (
                        <div>
                            <p className="text-muted">Year</p>
                            <p className="font-semibold text-lg">{data.year || 'N/A'}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-muted">Quality</p>
                        <p className="font-semibold text-lg">{data.quality || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-muted">File Size</p>
                        <p className="font-semibold text-lg">{data.size || 'N/A'}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                        <p className="text-muted">Languages</p>
                        <p className="font-semibold text-lg">{data.languages.length > 0 ? data.languages.join(', ') : 'N/A'}</p>
                    </div>
                </div>
            </div>
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) {
            addToast('Please enter a URL.', 'error');
            return;
        }

        setLoading(true);
        setResult(null);
        try {
            const data = await apiParseUrl(url);
            setResult(data);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to parse URL.";
            addToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-2 border-l-4 border-light-accent dark:border-accent pl-4">Movie Info Extractor</h1>
            <p className="text-light-muted dark:text-muted mb-6">Paste a video download link below to automatically extract details like title, year, quality, and file size.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="relative">
                    <input
                        type="url"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        placeholder="https://example.com/movie.name.2023.1080p.mkv"
                        className="w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-lg py-3 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent transition-all"
                        disabled={loading}
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <LinkIcon className="h-5 w-5 text-light-muted dark:text-muted" />
                    </div>
                </div>
                 <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-light-accent dark:bg-accent text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <SpinnerIcon className="animate-spin h-5 w-5" />
                            <span>Extracting...</span>
                        </>
                    ) : (
                       'Extract Info'
                    )}
                </button>
            </form>

            {result && <ResultCard data={result} />}
        </div>
    );
};

export default UrlParserPage;