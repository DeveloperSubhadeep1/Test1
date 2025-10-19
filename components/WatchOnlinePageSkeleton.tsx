import React from 'react';

const WatchOnlinePageSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen bg-primary text-white p-4 sm:p-6 md:p-8 animate-pulse">
            <div className="max-w-6xl mx-auto">
                <div className="mb-4">
                    <div className="h-5 bg-secondary rounded w-48"></div>
                </div>
                <div className="space-y-6">
                    <div className="w-full aspect-video rounded-lg bg-secondary"></div>

                    <div className="glass-panel p-4 rounded-lg">
                        <div className="h-4 bg-secondary rounded w-24 mb-2"></div>
                        <div className="h-5 bg-secondary rounded w-full"></div>
                    </div>

                    <div className="h-7 bg-secondary rounded w-1/2 max-w-xs mx-auto"></div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 7 }).map((_, index) => (
                            <div key={index} className="h-14 glass-panel rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WatchOnlinePageSkeleton;