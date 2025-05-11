import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../context/ApiContext';
import SearchBar from '../components/search/SearchBar';
import SearchFilters from '../components/search/SearchFilters';
import SearchResults from '../components/search/SearchResults';

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { searchDocuments, recordQuery, getDocuments } = useApi();
  
  // Parse query params
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  const initialFilters = queryParams.get('filters') ? JSON.parse(decodeURIComponent(queryParams.get('filters'))) : {};
  
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState(initialFilters);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [allTags, setAllTags] = useState([]);

  // Load all tags for filters
  const { data: documents } = useQuery(['documents'], () => getDocuments(0, 1000), {
    onSuccess: (data) => {
      // Extract unique tags from all documents
      const tags = data.reduce((acc, doc) => {
        if (doc.tags && doc.tags.length > 0) {
          doc.tags.forEach(tag => {
            if (!acc.includes(tag)) {
              acc.push(tag);
            }
          });
        }
        return acc;
      }, []);
      setAllTags(tags);
    }
  });

  // Perform search when query or filters change
  const { data: searchResults, isLoading, error } = useQuery(
    ['search', query, filters],
    () => searchDocuments(query, filters),
    {
      enabled: searchPerformed && query.trim().length > 0,
      keepPreviousData: true,
      onSuccess: () => {
        // Record successful query for suggestions
        if (query.trim().length > 0) {
          recordQuery(query.trim());
        }
      }
    }
  );

  // Update search parameters in URL
  useEffect(() => {
    if (searchPerformed) {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (Object.keys(filters).length > 0) {
        params.set('filters', encodeURIComponent(JSON.stringify(filters)));
      }
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }
  }, [query, filters, searchPerformed, navigate, location.pathname]);

  // Initialize search from URL params
  useEffect(() => {
    if (initialQuery) {
      setSearchPerformed(true);
    }
  }, [initialQuery]);

  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
    setSearchPerformed(true);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    if (searchPerformed) {
      // Only trigger search if a search has already been performed
      setSearchPerformed(true);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
          Semantic Search
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400">
          Search documents using natural language and find semantically related content.
        </p>
      </div>

      <div className="mb-6">
        <SearchBar onSearch={handleSearch} initialQuery={query} />
      </div>

      {allTags.length > 0 && (
        <SearchFilters 
          tags={allTags} 
          onFilterChange={handleFilterChange} 
          activeFilters={filters} 
        />
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md mb-6">
          <p className="text-red-600 dark:text-red-400">
            Error: {error.message || 'Failed to perform search. Please try again.'}
          </p>
        </div>
      )}

      {searchPerformed ? (
        <SearchResults 
          results={searchResults?.results || []} 
          isLoading={isLoading} 
          searchTime={searchResults?.search_time || 0} 
        />
      ) : (
        <div className="text-center py-12">
          <p className="text-secondary-500 dark:text-secondary-400">
            Enter a search query to find documents.
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;