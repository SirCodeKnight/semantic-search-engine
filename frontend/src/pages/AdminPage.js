import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../context/ApiContext';
import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  TagIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AdminPage = () => {
  const queryClient = useQueryClient();
  const { getStats, resetSystem, reindexDocuments } = useApi();
  
  // Get system statistics
  const { data: stats, isLoading, error, refetch } = useQuery(
    ['stats'],
    () => getStats(),
    {
      refetchInterval: 10000, // Refetch every 10 seconds
    }
  );

  // Reset system mutation
  const resetMutation = useMutation(
    () => resetSystem(),
    {
      onSuccess: () => {
        toast.success('System reset initiated. This may take a while.');
        refetch();
        queryClient.invalidateQueries(['documents']);
      },
      onError: (error) => {
        toast.error('Failed to reset system. Please try again.');
        console.error('Reset error:', error);
      },
    }
  );

  // Reindex documents mutation
  const reindexMutation = useMutation(
    () => reindexDocuments(),
    {
      onSuccess: () => {
        toast.success('Reindexing initiated. This may take a while.');
        refetch();
        queryClient.invalidateQueries(['documents']);
      },
      onError: (error) => {
        toast.error('Failed to reindex documents. Please try again.');
        console.error('Reindex error:', error);
      },
    }
  );

  // Handle system reset with confirmation
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the system? This will delete all documents, chunks, and vectors. This action cannot be undone.')) {
      resetMutation.mutate();
    }
  };

  // Handle reindex with confirmation
  const handleReindex = () => {
    if (window.confirm('Are you sure you want to reindex all documents? This will regenerate all chunks and embeddings.')) {
      reindexMutation.mutate();
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400">
          Manage and monitor your semantic search engine
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md mb-6">
          <p className="text-red-600 dark:text-red-400">
            Error: {error.message || 'Failed to load statistics. Please try again.'}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow p-5">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300">
                  <DocumentTextIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">
                    Documents
                  </p>
                  <p className="text-2xl font-semibold text-secondary-900 dark:text-white">
                    {stats.document_count}
                  </p>
                </div>
              </div>
              <div className="mt-2 text-xs text-secondary-500 dark:text-secondary-400">
                {stats.processed_count} processed
              </div>
            </div>
            
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow p-5">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">
                    Chunks
                  </p>
                  <p className="text-2xl font-semibold text-secondary-900 dark:text-white">
                    {stats.chunk_count}
                  </p>
                </div>
              </div>
              <div className="mt-2 text-xs text-secondary-500 dark:text-secondary-400">
                {stats.vector_count} vectors stored
              </div>
            </div>
            
            {stats.error_count > 0 && (
              <div className="bg-white dark:bg-secondary-800 rounded-lg shadow p-5">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300">
                    <ExclamationTriangleIcon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">
                      Errors
                    </p>
                    <p className="text-2xl font-semibold text-secondary-900 dark:text-white">
                      {stats.error_count}
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-red-500 dark:text-red-400">
                  Documents with processing errors
                </div>
              </div>
            )}
          </div>
          
          {/* Recent documents */}
          {stats.recent_documents && stats.recent_documents.length > 0 && (
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow overflow-hidden">
              <div className="px-4 py-3 border-b border-secondary-200 dark:border-secondary-700">
                <h2 className="text-lg font-medium text-secondary-900 dark:text-white">
                  Recent Documents
                </h2>
              </div>
              <ul className="divide-y divide-secondary-200 dark:divide-secondary-700">
                {stats.recent_documents.map((doc) => (
                  <li key={doc.id} className="px-4 py-3">
                    <Link to={`/documents/${doc.id}`} className="block hover:bg-secondary-50 dark:hover:bg-secondary-700/50 -mx-4 -my-3 px-4 py-3">
                      <div className="flex justify-between">
                        <div className="text-sm font-medium text-primary-600 dark:text-primary-400">
                          {doc.title}
                        </div>
                        <div className="text-xs text-secondary-500 dark:text-secondary-400">
                          {format(new Date(doc.created_at), 'MMM d, yyyy')}
                        </div>
                      </div>
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="mt-1 flex items-center">
                          <TagIcon className="h-3 w-3 text-secondary-400 dark:text-secondary-500 mr-1" />
                          <div className="text-xs text-secondary-500 dark:text-secondary-400">
                            {doc.tags.join(', ')}
                          </div>
                        </div>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="px-4 py-3 bg-secondary-50 dark:bg-secondary-700/30 text-center">
                <Link
                  to="/documents"
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-medium"
                >
                  View all documents
                </Link>
              </div>
            </div>
          )}
          
          {/* Top tags */}
          {stats.top_tags && stats.top_tags.length > 0 && (
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow overflow-hidden">
              <div className="px-4 py-3 border-b border-secondary-200 dark:border-secondary-700">
                <h2 className="text-lg font-medium text-secondary-900 dark:text-white">
                  Top Tags
                </h2>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {stats.top_tags.map((tag) => (
                    <Link
                      key={tag._id}
                      to={`/documents?tag=${encodeURIComponent(tag._id)}`}
                      className="px-3 py-1 bg-secondary-100 dark:bg-secondary-700 text-secondary-800 dark:text-secondary-200 rounded-full text-sm flex items-center"
                    >
                      {tag._id}
                      <span className="ml-1 bg-secondary-200 dark:bg-secondary-600 text-secondary-700 dark:text-secondary-300 rounded-full px-2 py-0.5 text-xs">
                        {tag.count}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Admin actions */}
          <div className="bg-white dark:bg-secondary-800 rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-secondary-200 dark:border-secondary-700">
              <h2 className="text-lg font-medium text-secondary-900 dark:text-white">
                System Actions
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-700/30 rounded-md">
                <div>
                  <h3 className="text-sm font-medium text-secondary-900 dark:text-white">
                    Reindex Documents
                  </h3>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                    Regenerate all document chunks and embeddings
                  </p>
                </div>
                <button
                  onClick={handleReindex}
                  disabled={reindexMutation.isLoading}
                  className="btn-primary flex items-center text-sm py-1"
                >
                  {reindexMutation.isLoading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                  )}
                  Reindex
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-md border border-red-200 dark:border-red-900/30">
                <div>
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Reset System
                  </h3>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Delete all documents, chunks, and vectors - cannot be undone
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  disabled={resetMutation.isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm py-1 px-3 rounded-md flex items-center"
                >
                  {resetMutation.isLoading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <TrashIcon className="h-4 w-4 mr-1" />
                  )}
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-secondary-500 dark:text-secondary-400">
            No statistics available
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminPage;