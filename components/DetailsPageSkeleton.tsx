import React from 'react';

const DetailsPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-primary relative text-white">
      <div className="absolute inset-0 z-0 bg-secondary/20">
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-primary/50 backdrop-blur-md"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 pt-16 pb-12 md:pt-20 md:pb-16 animate-pulse">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Poster Skeleton */}
          <div className="md:w-1/3 flex-shrink-0">
            <div className="bg-secondary rounded-lg shadow-2xl w-full aspect-[2/3]"></div>
          </div>
          
          {/* Details Skeleton */}
          <div className="md:w-2/3">
            <div className="h-12 bg-secondary rounded w-3/4 mb-3"></div>
            <div className="h-6 bg-secondary rounded w-1/2 mb-6"></div>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 my-4">
              <div className="h-6 bg-secondary rounded w-16"></div>
              <div className="h-6 bg-secondary rounded w-24"></div>
              <div className="h-6 bg-secondary rounded w-20"></div>
            </div>

            <div className="flex items-center gap-4 my-6">
              <div className="h-16 w-16 bg-secondary rounded-full"></div>
              <div className="h-10 bg-secondary rounded w-16"></div>
              <div className="h-10 w-px bg-gray-700"></div>
              <div className="flex items-center gap-2">
                <div className="h-11 w-11 bg-secondary rounded-full"></div>
                <div className="h-11 w-11 bg-secondary rounded-full"></div>
                <div className="h-11 w-11 bg-secondary rounded-full"></div>
                <div className="h-11 w-11 bg-secondary rounded-full"></div>
              </div>
            </div>
            
            <div className="h-7 bg-secondary rounded w-32 mt-6 mb-3"></div>
            <div className="space-y-2">
                <div className="h-4 bg-secondary rounded w-full"></div>
                <div className="h-4 bg-secondary rounded w-full"></div>
                <div className="h-4 bg-secondary rounded w-5/6"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <div className="h-5 bg-secondary rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-secondary rounded w-1/2"></div>
              </div>
              <div>
                <div className="h-5 bg-secondary rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-secondary rounded w-1/2"></div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-8">
                <div className="h-12 bg-secondary rounded-lg w-40"></div>
                <div className="h-12 bg-secondary rounded-lg w-44"></div>
            </div>
          </div>
        </div>
      </div>

     <div className="relative z-10 container mx-auto px-4 pb-16 md:pb-24 animate-pulse">
        <div className="space-y-12">
            <div>
              <div className="h-8 bg-secondary rounded w-48 mb-4"></div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="text-center">
                        <div className="bg-secondary rounded-lg aspect-[2/3] mb-2"></div>
                        <div className="h-5 bg-secondary rounded w-full mb-1"></div>
                        <div className="h-4 bg-secondary rounded w-3/4 mx-auto"></div>
                    </div>
                ))}
              </div>
            </div>
            <div className="h-48 bg-secondary rounded-lg"></div>
            <div className="glass-panel p-6 rounded-lg">
                <div className="h-8 bg-secondary rounded w-1/3 mb-4"></div>
                <div className="h-12 bg-secondary rounded w-full"></div>
            </div>
        </div>
     </div>
    </div>
  );
};

export default DetailsPageSkeleton;