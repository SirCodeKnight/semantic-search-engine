import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  DocumentTextIcon,
  CalendarIcon,
  TagIcon,
  LinkIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const DocumentCard = ({ document }) => {
  return (
    <div className="bg-white dark:bg-secondary-800 rounded-lg shadow overflow-hidden border border-secondary-200 dark:border-secondary-700 hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
            <Link to={`/documents/${document.id}`} className="hover:text-primary-600 dark:hover:text-primary-400">
              {document.title}
            </Link>
          </h3>
          <div className="flex items-center">
            {document.processed ? (
              document.error ? (
                <div className="flex items-center text-red-500 dark:text-red-400">
                  <ExclamationCircleIcon className="h-5 w-5 mr-1" />
                  <span className="text-xs">Error</span>
                </div>
              ) : (
                <div className="flex items-center text-green-500 dark:text-green-400">
                  <CheckCircleIcon className="h-5 w-5 mr-1" />
                  <span className="text-xs">{document.chunk_count} chunks</span>
                </div>
              )
            ) : (
              <div className="flex items-center text-yellow-500 dark:text-yellow-400">
                <svg className="animate-spin h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xs">Processing</span>
              </div>
            )}
          </div>
        </div>
        
        {document.url && (
          <div className="mt-1 flex items-center text-sm text-primary-600 dark:text-primary-400">
            <LinkIcon className="h-4 w-4 mr-1 flex-shrink-0" />
            <a href={document.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
              {document.url}
            </a>
          </div>
        )}
        
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <div className="flex items-center text-secondary-500 dark:text-secondary-400">
            <CalendarIcon className="h-4 w-4 mr-1" />
            {format(new Date(document.created_at), 'MMM d, yyyy')}
          </div>
          
          <div className="flex items-center text-secondary-500 dark:text-secondary-400">
            <DocumentTextIcon className="h-4 w-4 mr-1" />
            {document.processed ? `${document.chunk_count} chunks` : 'Processing...'}
          </div>
          
          {document.tags && document.tags.length > 0 && (
            <div className="flex items-center">
              <TagIcon className="h-4 w-4 mr-1 text-secondary-500 dark:text-secondary-400" />
              <div className="flex flex-wrap gap-1">
                {document.tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="px-2 py-0.5 rounded-full bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {document.error && (
          <div className="mt-2 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
            {document.error}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentCard;