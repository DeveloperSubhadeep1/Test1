import React, { useState, useEffect } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { getDetails, findIdBySlug } from '../services/api';
import { usePageMetadata } from '../hooks/usePageMetadata';
import VideoPlayer from '../components/VideoPlayer';
import { PlayIcon } from '../components/Icons';
import Spinner from '../components/Spinner';
import { parseQualityFromLink } from '../utils';
import { DownloadLink } from '../types';

const WatchOnlinePage: React.FC = () => {
    const { slug, type } = useParams<{ slug: string, type: 'movie' | 'tv' }>();
    const location = useLocation();
    const { title: navTitle, posterUrl, downloadLinks } = (location.state as { title?: string, posterUrl?: string, downloadLinks?: DownloadLink[] }) || {};
    
    const [currentVideo, setCurrentVideo] = useState<string | null>(null);
    const [videoTitle, setVideoTitle] = useState(navTitle || 'Watch Online');
    const [loading, setLoading] = useState(!navTitle);

    usePageMetadata({
        title: `Watch Online: ${videoTitle}`,
        description: `Watch ${videoTitle} online.`,
        path: `/watch/${type}/${slug}`,
    });

    useEffect(() => {
        const fetchTitle = async () => {
            if (navTitle) return;
            if (!slug || !type) return;
            
            try {
                let tmdbId: number | null = null;
                const idMatch = slug.match(/^(\d+)/);
                if (idMatch) {
                    tmdbId = parseInt(idMatch[1], 10);
                } else {
                    tmdbId = await findIdBySlug(type, slug);
                }

                if (tmdbId) {
                    const details = await getDetails(type, tmdbId);
                    const title = 'title' in details ? details.title : details.name;
                    setVideoTitle(title);
                }
            } catch (error) {
                console.error("Failed to fetch content title", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTitle();
    }, [slug, type, navTitle]);

    const convertToWatchUrl = (url: string): string => {
        if (!url) return '';
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
    
            // Check if the path looks like '/{id}/{filename...}' where {id} is numeric.
            // It should NOT convert if it already starts with '/watch'.
            // The regex /^\/\d+\// checks for a path starting with '/', then one or more digits, then a '/'.
            if (/^\/\d+\//.test(pathname)) {
                // Prepend '/watch' to the existing path
                urlObj.pathname = `/watch${pathname}`;
                return urlObj.toString();
            }
        } catch (error) {
            console.error("Invalid URL for conversion", error);
        }
        // Return the original URL if it doesn't match the pattern or if an error occurs
        return url;
    };
    
    const handleWatch = (url: string) => {
        if (url) {
            setCurrentVideo(convertToWatchUrl(url));
        }
    };

    if (loading) {
        return <Spinner />;
    }

    return (
        <div className="space-y-8">
            {currentVideo && (
                <VideoPlayer src={currentVideo} title={videoTitle} onClose={() => setCurrentVideo(null)} />
            )}

            <div className="text-center">
                <h1 className="text-3xl font-bold border-l-4 border-r-4 border-accent inline-block px-4 py-2">Watch Online: {videoTitle}</h1>
                 {posterUrl && <img src={posterUrl} alt={videoTitle} className="max-w-xs mx-auto rounded-lg shadow-2xl mt-6" />}
            </div>

            <div className="glass-panel p-6 rounded-lg max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-white text-center mb-4">Select Quality</h2>
                {downloadLinks && downloadLinks.length > 0 ? (
                    <div className="flex flex-wrap justify-center gap-4">
                        {downloadLinks.map((link, index) => {
                            const quality = parseQualityFromLink(link.label || link.url);
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleWatch(link.url)}
                                    className="flex items-center justify-center gap-2 bg-cyan text-primary font-bold py-3 px-6 rounded-lg hover:brightness-125 transition-all transform hover:-translate-y-1"
                                >
                                    <PlayIcon className="h-5 w-5" />
                                    <span>{`${videoTitle} ${quality}`}</span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center text-muted">No streaming links are available for this content.</p>
                )}
            </div>

             <div className="text-center mt-8">
                <Link to={`/${type}/${slug}`} className="text-sm text-light-accent dark:text-accent hover:underline">
                    &larr; Back to Details Page
                </Link>
            </div>
        </div>
    );
};

export default WatchOnlinePage;