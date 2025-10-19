import React, { useState, useEffect } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { usePageMetadata } from '../hooks/usePageMetadata';
import WatchOnlinePageSkeleton from '../components/WatchOnlinePageSkeleton';
import { DownloadLink } from '../types';
import { useToast } from '../hooks/useToast';
import { DownloadIcon } from '../components/Icons';

// Helper component for external player buttons
const PlayerButton: React.FC<{ onClick: () => void; imgSrc: string; text: string; }> = ({ onClick, imgSrc, text }) => (
    <button onClick={onClick} className="glass-panel hover:bg-white/10 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-3">
        <img src={imgSrc} alt="" className="h-7" />
        <span className="text-sm">{text}</span>
    </button>
);

const WatchOnlinePage: React.FC = () => {
    const { slug, type } = useParams<{ slug: string, type: 'movie' | 'tv' }>();
    const location = useLocation();
    const { title, downloadLinks } = (location.state as { title?: string, downloadLinks?: DownloadLink[] }) || {};
    const { addToast } = useToast();

    const [streamUrl, setStreamUrl] = useState<string | null>(null);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    usePageMetadata({
        title: `Watch: ${title || 'Loading...'}`,
        description: `Watch ${title || 'content'} online.`,
        path: `/watch/${type}/${slug}`,
    });
    
    const convertToWatchUrl = (url: string): string => {
        if (!url) return '';
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            if (/^\/\d+\//.test(pathname)) {
                urlObj.pathname = `/watch${pathname}`;
                return urlObj.toString();
            }
        } catch (error)
        {
            console.error("Invalid URL for conversion", error);
        }
        return url;
    };

    useEffect(() => {
        if (downloadLinks && downloadLinks.length > 0) {
            const firstLink = downloadLinks[0];
            const originalUrl = firstLink.url;
            setDownloadUrl(originalUrl);
            setStreamUrl(convertToWatchUrl(originalUrl));
            
            try {
                const urlPath = new URL(originalUrl).pathname;
                const segments = urlPath.split('/');
                setFileName(decodeURIComponent(segments.pop() || 'video file'));
            } catch {
                setFileName('video file');
            }
        }
        setLoading(false);
    }, [downloadLinks]);
    
    const openInVLC = () => { if (streamUrl) window.location.href = `vlc://${streamUrl}`; };
    const openInMX = () => { if (streamUrl) window.location.href = `intent:${streamUrl}#Intent;package=com.mxtech.videoplayer.ad;end`; };
    const openInPlayit = () => { if (streamUrl) window.location.href = `playit://play?url=${streamUrl}`; };
    const openInKM = () => { if (streamUrl) window.location.href = `intent:${streamUrl}#Intent;package=com.kmplayer;end`; };
    const openInS = () => addToast("S Player does not have a standard URL scheme to open videos directly.", 'info');
    const openInHD = () => addToast("HD Player does not have a standard URL scheme to open videos directly.", 'info');
    const handleDownload = () => { if (downloadUrl) window.open(downloadUrl, '_blank'); };

    if (loading) return <WatchOnlinePageSkeleton />;
    
    return (
        <div className="min-h-screen bg-primary text-white p-4 sm:p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-4">
                    <Link to={`/${type}/${slug}`} className="text-sm text-accent hover:underline">
                        &larr; Back to {title}
                    </Link>
                </div>
                {streamUrl ? (
                    <div className="space-y-6">
                        <video
                            src={streamUrl}
                            className="w-full aspect-video rounded-lg shadow-2xl bg-black"
                            controls
                            autoPlay
                            playsInline
                            key={streamUrl}
                        >
                            Your browser does not support the video tag.
                        </video>

                        <div className="glass-panel p-4 rounded-lg">
                            <h4 className="text-muted text-sm">File name:</h4>
                            <p className="text-white font-bold break-words">{fileName}</p>
                        </div>

                        <h3 className="text-xl font-bold text-center">Open with External Player</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <PlayerButton onClick={openInVLC} imgSrc="https://i.postimg.cc/15TQ4y7B/vlc.png" text="Watch in VLC" />
                            <PlayerButton onClick={openInMX} imgSrc="https://i.postimg.cc/sx4Msv4T/mx.png" text="Watch in MX Player" />
                            <PlayerButton onClick={openInPlayit} imgSrc="https://i.postimg.cc/RVGWYJFF/playit.png" text="Watch in PLAYit" />
                            <PlayerButton onClick={openInKM} imgSrc="https://i.postimg.cc/wT9tFQ9Z/km.png" text="Watch in KM Player" />
                            <PlayerButton onClick={openInS} imgSrc="https://i.postimg.cc/XYJr6NGg/s.png" text="Watch in S Player" />
                            <PlayerButton onClick={openInHD} imgSrc="https://i.postimg.cc/rFT43LNh/hd.png" text="Watch in HD Player" />
                             <button
                                onClick={handleDownload}
                                className="bg-cyan/90 hover:bg-cyan text-primary font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-3"
                            >
                                <DownloadIcon className="h-6 w-6"/>
                                <span>Download Video</span>
                            </button>
                        </div>
                    </div>
                ) : (
                     <div className="text-center text-light-muted dark:text-muted text-lg mt-10 py-10 flex flex-col items-center">
                        <p className="font-bold text-xl">No Streamable Link Found</p>
                        <p>We couldn't generate a streaming link from the available download sources.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WatchOnlinePage;