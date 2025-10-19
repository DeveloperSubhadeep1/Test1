import React from 'react';

const MovieCardSkeleton: React.FC = () => {
  return (
    <div className="bg-light-secondary dark:bg-secondary rounded-lg shadow-lg overflow-hidden animate-pulse">
      <div className="relative">
        <div className="w-full bg-light-border dark:bg-gray-700 aspect-[2/3]"></div>
        <div className="absolute bottom-0 left-0 p-4 w-full">
          <div className="h-6 bg-light-border dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="flex items-center space-x-4">
            <div className="h-4 bg-light-border dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-light-border dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCardSkeleton;
