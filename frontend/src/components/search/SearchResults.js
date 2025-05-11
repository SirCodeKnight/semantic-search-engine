import React from 'react';
import { Link } from 'react-router-dom';
import { DocumentTextIcon, LinkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const SearchResults = ({ results, isLoading, searchTime }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
        <p className="mt-4 text-secondary-600 dark:text-secondary-400">Searching documents...</p>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-10">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-secondary-400" />
        <h3 className="mt-2 text-sm font-medium text-secondary-900 dark:text-secondary-100">No results found</h3>
        <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    );
  }

  // Function to highlight matched keywords in text
  const highlightMatches = (text, highlights) => {
    if (!highlights || highlights.length === 0 || !text) return text;
    
    // Simple highlighting for demo purposes
    // In a real app, you'd want to use a more sophisticated approach
    return text;
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-secondary-500 dark:text-secondary-400">
        Found {results.length} results in {searchTime.toFixed(3)} seconds
      </div>
      
      {results.map((result) => (
        <div 
          key={result.chunk_id} 
          className="bg-white dark:bg-secondary-800 p-4 rounded-lg shadow border border-secondary-200 dark:border-secondary-700 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
              <Link to={`/documents/${result.document_id}`} className="hover:text-primary-600 dark:hover:text-primary-400">
                {result.title}
              </Link>
            </h3>
            <div className="text-sm text-secondary-500 dark:text-secondary-400">
              Score: {(result.score * 100).toFixed(1)}%
            </div>
          </div>
          
          {result.url && (
            <div className="mt-1 flex items-center text-sm text-primary-600 dark:text-primary-400">
              <LinkIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              <a href={result.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
                {result.url}
              </a>
            </div>
          )}
          
          <div className="mt-2 text-sm text-secondary-600 dark:text-secondary-300">
            {result.content && (
              <p className="line-clamp-3">
                {highlightMatches(result.content, result.highlights)}
              </p>
            )}
          </div>
          
          {result.highlights && result.highlights.length > 0 && (
            <div className="mt-2 space-y-1">
              {result.highlights.map((highlight, index) => (
                <div key={index} className="text-sm bg-yellow-50 dark:bg-yellow-900/30 p-1 rounded">
                  <span dangerouslySetInnerHTML={{ __html: highlight.replace(/\b(search|query|terms)\b/gi, '<span class="highlight">$1</span>') }} />
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <div className="flex items-center text-secondary-500 dark:text-secondary-400">
              <ClockIcon className="h-4 w-4 mr-1" />
              {format(new Date(result.created_at), 'MMM d, yyyy')}
            </div>
            
            {result.tags && result.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {result.tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="px-2 py-0.5 rounded-full bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchResults;