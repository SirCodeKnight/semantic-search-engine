import React from 'react';
import { DocumentTextIcon, LinkIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const ChatSources = ({ sources }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="bg-secondary-50 dark:bg-secondary-800 border-t border-secondary-200 dark:border-secondary-700 p-3">
      <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
        Sources ({sources.length})
      </h3>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {sources.map((source) => (
          <div 
            key={source.chunk_id} 
            className="p-2 bg-white dark:bg-secondary-700 rounded-md border border-secondary-200 dark:border-secondary-600 text-sm"
          >
            <div className="flex items-start justify-between">
              <Link 
                to={`/documents/${source.document_id}`}
                className="font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center"
              >
                <DocumentTextIcon className="h-4 w-4 mr-1" />
                {source.title}
              </Link>
              <span className="text-xs text-secondary-500 dark:text-secondary-400">
                {Math.round(source.score * 100)}% match
              </span>
            </div>
            <p className="mt-1 text-secondary-600 dark:text-secondary-300 text-sm">
              {source.content_snippet}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatSources;