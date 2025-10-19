
import React from 'react';

const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => <div className={`glass-panel p-4 rounded-lg animate-pulse ${className}`} />;

export const DashboardSkeleton: React.FC = () => (
    <>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} className="h-28" />
            ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
            <SkeletonCard className="xl:col-span-1 h-96" />
            <SkeletonCard className="xl:col-span-2 h-96" />
        </div>
    </>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 10, cols = 5 }) => (
    <div className="hidden md:block glass-panel rounded-lg shadow overflow-x-auto animate-pulse">
        <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs uppercase text-muted">
                <tr>
                    {Array.from({ length: cols }).map((_, i) => (
                        <th key={i} scope="col" className="px-6 py-4 border-b border-glass-border">
                            <div className="h-4 bg-secondary rounded w-3/4"></div>
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: rows }).map((_, i) => (
                    <tr key={i} className="border-b border-glass-border">
                        {Array.from({ length: cols }).map((_, j) => (
                            <td key={j} className="px-6 py-4">
                                <div className="h-5 bg-secondary rounded w-full"></div>
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export const CardListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
    <div className="space-y-4 md:hidden animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} className="h-32" />
        ))}
    </div>
);

export const TicketSkeleton: React.FC = () => (
    <div className="space-y-4 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-panel p-4 rounded-lg shadow-lg border-l-2 border-danger">
              <div className="flex justify-between items-start">
                <div>
                  <div className="h-5 bg-secondary rounded w-48 mb-2"></div>
                  <div className="h-4 bg-secondary rounded w-32 mb-2"></div>
                  <div className="h-3 bg-secondary rounded w-40"></div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="h-9 w-9 bg-secondary rounded-full"></div>
                  <div className="h-9 w-9 bg-secondary rounded-full"></div>
                </div>
              </div>
              <div className="space-y-2 mt-3">
                <div className="h-4 bg-secondary rounded w-full"></div>
                <div className="h-4 bg-secondary rounded w-5/6"></div>
              </div>
            </div>
        ))}
    </div>
);


export const DatabaseSkeleton: React.FC = () => (
    <div className="glass-panel p-6 rounded-lg flex flex-col items-center justify-center min-h-[50vh] animate-pulse">
        <div className="h-8 bg-secondary rounded w-64 mb-4"></div>
        <div className="h-56 w-56 bg-secondary rounded-full mb-4"></div>
        <div className="h-7 bg-secondary rounded w-48"></div>
    </div>
);
