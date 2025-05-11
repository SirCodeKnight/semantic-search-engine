import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../context/ApiContext';
import DocumentForm from '../components/documents/DocumentForm';
import { format } from 'date-fns';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  CalendarIcon,
  DocumentTextIcon,
  LinkIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const DocumentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getDocument, updateDocument, deleteDocument } = useApi();
  
  const [isEditing, setIsEditing] = useState(false);

  // Get document details
  const { data: document, isLoading, error } = useQuery(
    ['document', id],
    () => getDocument(id),
    {
      refetchInterval: (data) => {
        // Refetch every 5 seconds if document is still processing
        return data && !data.processed ? 5000 : false;
      },
    }
  );

  // Update document mutation
  const updateMutation = useMutation(
    (data) => updateDocument(id, data),
    {
      onSuccess: () => {
        toast.success('Document updated successfully');
        setIsEditing(false);
        // Invalidate document query to fetch updated data
        queryClient.invalidateQueries(['document', id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to update document');
        console.error('Update error:', error);
      },
    }
  );

  // Delete document mutation
  const deleteMutation = useMutation(
    () => deleteDocument(id),
    {
      onSuccess: () => {
        toast.success('Document deleted successfully');
        // Navigate back to documents list
        navigate('/documents');
        // Invalidate documents query to update the list
        queryClient.invalidateQueries(['documents']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to delete document');
        console.error('Delete error:', error);
      },
    }
  );

  // Handle document update
  const handleUpdate = (data) => {
    updateMutation.mutate(data);
  };

  // Handle document delete with confirmation
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
        <p className="text-red-600 dark:text-red-400">
          Error: {error.message || 'Failed to load document. Please try again.'}
        </p>
        <Link to="/documents" className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Documents
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/documents" className="inline-flex items-center text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Documents
        </Link>
      </div>

      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow overflow-hidden">
        {isEditing ? (
          <div className="p-6">
            <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4">
              Edit Document
            </h2>
            <DocumentForm
              initialData={document}
              onSubmit={handleUpdate}
              isSubmitting={updateMutation.isLoading}
            />
            <button
              onClick={() => setIsEditing(false)}
              className="mt-4 text-secondary-600 hover:text-secondary-500 dark:text-secondary-400 dark:hover:text-secondary-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div>
            <div className="p-6 border-b border-secondary-200 dark:border-secondary-700 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
                  {document.title}
                </h1>
                {document.url && (
                  <div className="mt-1 flex items-center text-sm text-primary-600 dark:text-primary-400">
                    <LinkIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                    <a href={document.url} target="_blank" rel="noopener noreferrer" className="hover:underline break-all">
                      {document.url}
                    </a>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 bg-secondary-100 dark:bg-secondary-700 rounded-md"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-md"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                    Document Information
                  </h2>
                  <div className="bg-secondary-50 dark:bg-secondary-700/50 rounded-md p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center text-sm text-secondary-500 dark:text-secondary-400 mb-2">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          Created: {format(new Date(document.created_at), 'PPP')}
                        </div>
                        {document.created_at !== document.updated_at && (
                          <div className="flex items-center text-sm text-secondary-500 dark:text-secondary-400 mb-2">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Updated: {format(new Date(document.updated_at), 'PPP')}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center text-sm text-secondary-500 dark:text-secondary-400 mb-2">
                          <DocumentTextIcon className="h-4 w-4 mr-1" />
                          Status: {document.processed 
                            ? <span className="text-green-500 dark:text-green-400">Processed</span>
                            : <span className="text-yellow-500 dark:text-yellow-400">Processing</span>}
                        </div>
                        <div className="flex items-center text-sm text-secondary-500 dark:text-secondary-400">
                          <DocumentTextIcon className="h-4 w-4 mr-1" />
                          Chunks: {document.chunk_count}
                        </div>
                      </div>
                    </div>
                    
                    {/* Error message */}
                    {document.error && (
                      <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-500 dark:text-red-400 flex items-start">
                        <ExclamationCircleIcon className="h-5 w-5 mr-1 flex-shrink-0 mt-0.5" />
                        <span>{document.error}</span>
                      </div>
                    )}
                    
                    {/* Tags */}
                    {document.tags && document.tags.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center text-sm text-secondary-700 dark:text-secondary-300 mb-1">
                          <TagIcon className="h-4 w-4 mr-1" />
                          Tags:
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {document.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 rounded-full text-xs bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Metadata */}
                    {document.metadata && Object.keys(document.metadata).length > 0 && (
                      <div className="mt-4 pt-3 border-t border-secondary-200 dark:border-secondary-700">
                        <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                          Metadata
                        </h3>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                          {Object.entries(document.metadata).map(([key, value]) => (
                            <div key={key} className="text-sm">
                              <dt className="text-secondary-500 dark:text-secondary-400">{key}:</dt>
                              <dd className="text-secondary-900 dark:text-secondary-100 break-words">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-1">
                <h2 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                  Actions
                </h2>
                <div className="bg-secondary-50 dark:bg-secondary-700/50 rounded-md p-4 space-y-3">
                  <Link
                    to={`/search?q=${encodeURIComponent(document.title)}`}
                    className="block w-full text-center px-4 py-2 border border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors"
                  >
                    Search Similar Documents
                  </Link>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="block w-full text-center px-4 py-2 border border-secondary-500 text-secondary-500 hover:bg-secondary-50 dark:hover:bg-secondary-900/20 rounded-md transition-colors"
                  >
                    Edit Document
                  </button>
                  <button
                    onClick={handleDelete}
                    className="block w-full text-center px-4 py-2 border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    Delete Document
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentDetailPage;