import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const SearchFilters = ({ tags, onFilterChange, activeFilters = {} }) => {
  const [filters, setFilters] = useState(activeFilters);

  const handleTagClick = (tag) => {
    const newFilters = { ...filters };
    
    // If tag is already in filters, remove it, otherwise add it
    if (newFilters.tags && newFilters.tags.includes(tag)) {
      newFilters.tags = newFilters.tags.filter(t => t !== tag);
      if (newFilters.tags.length === 0) {
        delete newFilters.tags;
      }
    } else {
      newFilters.tags = [...(newFilters.tags || []), tag];
    }
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  // Check if any filters are active
  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
          Filter by tags:
        </span>
        
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filters.tags && filters.tags.includes(tag)
                ? 'bg-primary-500 text-white'
                : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-300 dark:hover:bg-secondary-600'
            }`}
          >
            {tag}
          </button>
        ))}
        
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center px-3 py-1 text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Clear filters
            <XMarkIcon className="h-4 w-4 ml-1" />
          </button>
        )}
      </div>
      
      {hasActiveFilters && (
        <div className="mt-3 text-sm text-secondary-600 dark:text-secondary-400">
          <span>Active filters: </span>
          {filters.tags && (
            <span className="mr-2">
              Tags: {filters.tags.join(', ')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchFilters;