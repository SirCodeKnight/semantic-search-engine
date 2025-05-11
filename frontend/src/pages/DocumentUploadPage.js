import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useApi } from '../context/ApiContext';
import DocumentUploader from '../components/documents/DocumentUploader';
import DocumentForm from '../components/documents/DocumentForm';
import { TabGroup, Tab } from '@headlessui/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const DocumentUploadPage = () => {
  const navigate = useNavigate();
  const { uploadDocument, createDocument, crawlUrl } = useApi();
  const [activeTab, setActiveTab] = useState(0);

  // File upload mutation
  const uploadMutation = useMutation(
    (data) => uploadDocument(data.file, data.title, data.tags, data.metadata),
    {
      onSuccess: (data) => {
        toast.success('Document uploaded successfully');
        navigate(`/documents/${data.id}`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to upload document');
        console.error('Upload error:', error);
      },
    }
  );

  // Create document mutation
  const createMutation = useMutation(
    (data) => createDocument(data),
    {
      onSuccess: (data) => {
        toast.success('Document created successfully');
        navigate(`/documents/${data.id}`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to create document');
        console.error('Create error:', error);
      },
    }
  );

  // Crawl URL mutation
  const crawlMutation = useMutation(
    (data) => crawlUrl(data.url, data.title, data.tags, data.metadata),
    {
      onSuccess: (data) => {
        toast.success('URL crawling started');
        navigate(`/documents/${data.id}`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to crawl URL');
        console.error('Crawl error:', error);
      },
    }
  );

  // Handle file upload
  const handleUpload = (file, title, tags, metadata) => {
    uploadMutation.mutate({ file, title, tags, metadata });
  };

  // Handle document creation
  const handleCreate = (data) => {
    if (data.url) {
      // If URL is provided, use the crawl endpoint
      crawlMutation.mutate(data);
    } else {
      // Otherwise, create a document with the provided content
      createMutation.mutate(data);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link to="/documents" className="inline-flex items-center text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Documents
        </Link>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white mt-2">
          Add Document
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400">
          Upload a document file, enter content directly, or crawl a URL
        </p>
      </div>

      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow overflow-hidden">
        <TabGroup selectedIndex={activeTab} onChange={setActiveTab}>
          <div className="border-b border-secondary-200 dark:border-secondary-700">
            <nav className="flex -mb-px">
              <Tab className={({ selected }) => `
                px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap
                ${selected 
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200'}
              `}>
                Upload File
              </Tab>
              <Tab className={({ selected }) => `
                px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap
                ${selected 
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200'}
              `}>
                Add Content
              </Tab>
            </nav>
          </div>
          
          <div className="p-6">
            <TabGroup.Panels>
              <TabGroup.Panel>
                <DocumentUploader 
                  onUpload={handleUpload} 
                  isUploading={uploadMutation.isLoading}
                />
              </TabGroup.Panel>
              <TabGroup.Panel>
                <DocumentForm 
                  onSubmit={handleCreate} 
                  isSubmitting={createMutation.isLoading || crawlMutation.isLoading}
                />
              </TabGroup.Panel>
            </TabGroup.Panels>
          </div>
        </TabGroup>
      </div>
    </div>
  );
};

export default DocumentUploadPage;