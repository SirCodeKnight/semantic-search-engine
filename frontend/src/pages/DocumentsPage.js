import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../context/ApiContext';
import DocumentCard from '../components/documents/DocumentCard';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const DocumentsPage = () => {
  const { getDocuments, reindexDocuments } = useApi();
  
  const { data: documents, isLoading, error, refetch } = useQuery(
    ['documents'],
    () => getDocuments(),
    {
      refetchInterval: 5000, // Refetch every 5 seconds to see processing status
    }
  );

  const handleReindex = async () => {
    try {
      await reindexDocuments();
      toast.success('Reindexing started. This may take a while.');
      refetch();
    } catch (error) {
      toast.error('Failed to start reindexing. Please try again.');
      console.error('Reindex error:', error);
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Documents
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Manage and upload documents to the search engine
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleReindex}
            className="btn-outline flex items-center"
          >
            <ArrowPathIcon className="h-5 w-5 mr-1" />
            Reindex
          </button>
          <Link to="/documents/upload" className="btn-primary flex items-center">
            <PlusIcon className="h-5 w-5 mr-1" />
            Add Document
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md mb-6">
          <p className="text-red-600 dark:text-red-400">
            Error: {error.message || 'Failed to load documents. Please try again.'}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : documents && documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-secondary-800 rounded-lg shadow">
          <svg
            className="mx-auto h-12 w-12 text-secondary-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-secondary-900 dark:text-secondary-100">No documents</h3>
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
            Get started by adding a new document
          </p>
          <div className="mt-6">
            <Link
              to="/documents/upload"
              className="btn-primary inline-flex items-center"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add Document
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;