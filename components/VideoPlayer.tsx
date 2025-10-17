import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    PlayIcon, PauseIcon, RewindIcon, FastForwardIcon, 
    Volume2Icon, Volume1Icon, VolumeXIcon, 
    MaximizeIcon, MinimizeIcon, XIcon 
} from './Icons';

interface VideoPlayerProps {
  src: string;
  title: string;
  onClose: () => void;
}

const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, title, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    let controlsTimeout = useRef<number | null>(null);

    const hideControls = useCallback(() => {
        if(isPlaying) {
            setShowControls(false);
        }
    }, [isPlaying]);

    const handleMouseMove = useCallback(() => {
        setShowControls(true);
        if (controlsTimeout.current) {
            clearTimeout(controlsTimeout.current);
        }
        controlsTimeout.current = window.setTimeout(hideControls, 3000);
    }, [hideControls]);

    useEffect(() => {
        handleMouseMove(); // Show controls on mount
        return () => {
            if (controlsTimeout.current) {
                clearTimeout(controlsTimeout.current);
            }
        };
    }, [isPlaying, handleMouseMove]);
    
    // Declarative play/pause logic to prevent race conditions
    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        if (isPlaying) {
            const playPromise = videoElement.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // The 'AbortError' is expected when the user quickly toggles play/pause.
                    // It's safe to ignore as it just means one action (play) was cancelled by another (pause).
                    if (error.name !== 'AbortError') {
                        console.error("Video play failed:", error);
                        // If play fails for other reasons (e.g., browser policy), update state to reflect reality.
                        setIsPlaying(false);
                    }
                });
            }
        } else {
            videoElement.pause();
        }
    }, [isPlaying, src]); // Re-run when isPlaying or the src changes


    const togglePlay = () => {
        setIsPlaying(prevIsPlaying => !prevIsPlaying);
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
        }
    };
    
    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (videoRef.current) {
            const seekTime = (e.nativeEvent.offsetX / e.currentTarget.offsetWidth) * duration;
            videoRef.current.currentTime = seekTime;
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if(videoRef.current) {
            videoRef.current.volume = newVolume;
            videoRef.current.muted = newVolume === 0;
        }
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);
        if (videoRef.current) {
            videoRef.current.muted = newMutedState;
        }
    };

    const skipTime = (amount: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime += amount;
        }
    };

    const toggleFullscreen = useCallback(() => {
        if (!playerContainerRef.current) return;
        
        if (!document.fullscreenElement) {
            playerContainerRef.current.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    }, []);

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    const VolumeIcon = () => {
        if (isMuted || volume === 0) return <VolumeXIcon className="w-6 h-6" />;
        if (volume < 0.5) return <Volume1Icon className="w-6 h-6" />;
        return <Volume2Icon className="w-6 h-6" />;
    };
    
    useEffect(() => {
      // Exit fullscreen when component unmounts
      return () => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
      }
    }, [])

    return (
        <div 
            ref={playerContainerRef} 
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            onMouseMove={handleMouseMove}
            onMouseLeave={hideControls}
            onClick={togglePlay}
        >
            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={onClose}
                key={src}
            >
                <source src={src} />
                Your browser does not support the video tag. We recommend using the latest version of Chrome or Firefox.
            </video>

            <div 
                className={`absolute inset-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
                onClick={e => e.stopPropagation()} // Prevent click-to-play when interacting with controls
            >
                {/* Top Gradient & Info */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/70 to-transparent p-4 flex justify-between items-start">
                    <h2 className="text-white text-lg font-bold">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full bg-black/50 hover:bg-white/20 transition-colors">
                        <XIcon className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/70 to-transparent p-4 flex flex-col justify-end">
                    {/* Progress Bar */}
                    <div className="w-full cursor-pointer group" onClick={handleSeek}>
                        <div className="h-1 bg-white/30 rounded-full group-hover:h-1.5 transition-all">
                            <div className="h-full bg-cyan rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-white mt-2">
                        {/* Left Controls */}
                        <div className="flex items-center gap-4">
                            <button onClick={togglePlay}>
                                {isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8" />}
                            </button>
                            <div className="flex items-center gap-2">
                                <button onClick={() => skipTime(-10)}><RewindIcon className="w-6 h-6 opacity-80 hover:opacity-100" /></button>
                                <button onClick={() => skipTime(10)}><FastForwardIcon className="w-6 h-6 opacity-80 hover:opacity-100" /></button>
                            </div>
                            <div className="flex items-center gap-2 group">
                                <button onClick={toggleMute}><VolumeIcon /></button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="w-0 group-hover:w-24 h-1 rounded-lg appearance-none cursor-pointer transition-all duration-300 accent-cyan bg-white/30"
                                />
                            </div>
                        </div>

                        {/* Center Time */}
                        <div className="text-sm">
                            <span>{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
                        </div>

                        {/* Right Controls */}
                        <div className="flex items-center gap-4">
                            <button onClick={toggleFullscreen}>
                                {isFullscreen ? <MinimizeIcon className="w-6 h-6" /> : <MaximizeIcon className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;