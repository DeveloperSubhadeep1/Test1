import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePageMetadata } from '../hooks/usePageMetadata';
import { ArrowLeftIcon } from '../components/Icons';

const WatchTrailerPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const trailerKey = searchParams.get('key');
    const title = searchParams.get('title') || 'Trailer';
    
    usePageMetadata({
        title: `Trailer: ${title}`,
        description: `Watch the official trailer for ${title}.`,
        path: `/trailer?key=${trailerKey}&title=${title}`
    });

    const handleBack = () => navigate(-1);

    return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4 animate-fade-in z-50">
            <button 
                onClick={handleBack}
                className="group absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
                aria-label="Go back"
            >
                <ArrowLeftIcon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                <span>Back</span>
            </button>
            
            <div className="w-full max-w-6xl aspect-video relative">
                {trailerKey ? (
                    <iframe
                        src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&iv_load_policy=3&modestbranding=1`}
                        title={`Trailer for ${title}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full rounded-lg shadow-2xl shadow-cyan/20"
                    ></iframe>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary rounded-lg">
                        <p className="text-muted">Trailer not found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WatchTrailerPage;