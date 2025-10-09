import React from 'react';

interface SortDropdownProps {
  sortOption: string;
  onSortChange: (value: string) => void;
}

const sortOptions = [
  { value: 'dateAdded_desc', label: 'Date Added (Newest)' },
  { value: 'dateAdded_asc', label: 'Date Added (Oldest)' },
  { value: 'title_asc', label: 'Title (A-Z)' },
  { value: 'title_desc', label: 'Title (Z-A)' },
  { value: 'rating_desc', label: 'Rating (High-Low)' },
  { value: 'rating_asc', label: 'Rating (Low-High)' },
];

const SortDropdown: React.FC<SortDropdownProps> = ({ sortOption, onSortChange }) => {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="sort-select" className="text-sm font-medium text-light-muted dark:text-muted">
        Sort by:
      </label>
      <select
        id="sort-select"
        value={sortOption}
        onChange={(e) => onSortChange(e.target.value)}
        className="bg-light-secondary dark:bg-secondary border border-light-border dark:border-gray-700 rounded-md py-1.5 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent"
      >
        {sortOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SortDropdown;