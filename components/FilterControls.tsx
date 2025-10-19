import React, { useState, useMemo } from 'react';
import { FilterIcon } from './Icons';

interface FilterControlsProps {
  filters: {
    type: string;
    year: string;
    rating: number;
  };
  onFilterChange: (name: keyof FilterControlsProps['filters'], value: string | number) => void;
  onReset: () => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({ filters, onFilterChange, onReset }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 1950;
    const yearOptions = [];
    for (let year = currentYear; year >= startYear; year--) {
      yearOptions.push(year);
    }
    return yearOptions;
  }, []);

  const TypeButton: React.FC<{ value: string; label: string }> = ({ value, label }) => {
    const isActive = filters.type === value;
    return (
      <button
        onClick={() => onFilterChange('type', value)}
        className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${
          isActive ? 'bg-light-accent dark:bg-accent text-white' : 'bg-light-primary dark:bg-primary text-light-muted dark:text-muted hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        {label}
      </button>
    );
  };
  
  return (
    <div className="bg-light-secondary dark:bg-secondary p-4 rounded-lg mb-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex md:hidden items-center justify-between w-full text-lg font-bold text-light-text dark:text-white"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            <span>Filters</span>
        </div>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      <div className={`${isOpen ? 'block animate-fade-in' : 'hidden'} md:flex md:flex-col lg:flex-row lg:items-center gap-6 mt-4 md:mt-0`}>
        {/* Type Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm font-medium text-light-muted dark:text-muted shrink-0">Type:</label>
          <div className="flex items-center space-x-2 bg-light-primary dark:bg-primary p-1 rounded-full">
            <TypeButton value="all" label="All" />
            <TypeButton value="movie" label="Movies" />
            <TypeButton value="tv" label="TV Shows" />
          </div>
        </div>

        {/* Year Filter */}
        <div className="flex items-center gap-2">
            <label htmlFor="year-filter" className="text-sm font-medium text-light-muted dark:text-muted shrink-0">Year:</label>
            <select
                id="year-filter"
                value={filters.year}
                onChange={(e) => onFilterChange('year', e.target.value)}
                className="bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-md py-1.5 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent"
            >
                <option value="">All</option>
                {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                ))}
            </select>
        </div>

        {/* Rating Filter */}
        <div className="flex items-center gap-3 lg:w-48">
             <label htmlFor="rating-filter" className="text-sm font-medium text-light-muted dark:text-muted shrink-0">Rating:</label>
            <div className="flex-grow flex items-center gap-2">
                <input
                    id="rating-filter"
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={filters.rating}
                    onChange={(e) => onFilterChange('rating', parseFloat(e.target.value))}
                    className="w-full h-2 bg-light-primary dark:bg-primary rounded-lg appearance-none cursor-pointer accent-light-accent dark:accent-accent"
                />
                <span className="text-sm font-bold text-light-text dark:text-white w-8 text-center">{filters.rating.toFixed(1)}</span>
            </div>
        </div>
        
        <button
          onClick={onReset}
          className="text-sm text-light-accent dark:text-accent hover:underline lg:ml-auto"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default FilterControls;