import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentArrowUpIcon, XMarkIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

const DocumentUploader = ({ onUpload, isUploading }) => {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [metadataItems, setMetadataItems] = useState([{ key: '', value: '' }]);
  const [file, setFile] = useState(null);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/html': ['.html', '.htm'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10485760, // 10 MB
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        // Use file name as title if not set
        if (!title) {
          setTitle(acceptedFiles[0].name.split('.')[0]);
        }
      }
    },
  });

  // Handle tag management
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Handle metadata management
  const addMetadataItem = () => {
    setMetadataItems([...metadataItems, { key: '', value: '' }]);
  };

  const removeMetadataItem = (index) => {
    const updated = [...metadataItems];
    updated.splice(index, 1);
    setMetadataItems(updated);
  };

  const updateMetadataItem = (index, field, value) => {
    const updated = [...metadataItems];
    updated[index][field] = value;
    setMetadataItems(updated);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!file) {
      alert('Please select a file to upload');
      return;
    }
    
    // Prepare metadata
    const metadata = {};
    metadataItems.forEach(item => {
      if (item.key.trim()) {
        metadata[item.key.trim()] = item.value;
      }
    });
    
    onUpload(file, title || file.name, tags, metadata);
  };

  return (
    <div className="space-y-6">
      <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        isDragActive 
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
          : 'border-secondary-300 dark:border-secondary-700 hover:border-primary-400 dark:hover:border-primary-600'
      }`}>
        <input {...getInputProps()} />
        <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-secondary-400 dark:text-secondary-500" />
        
        {file ? (
          <div className="mt-2">
            <p className="text-secondary-900 dark:text-secondary-100 font-medium">{file.name}</p>
            <p className="text-sm text-secondary-500 dark:text-secondary-400">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="mt-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="mt-2">
            <p className="text-secondary-900 dark:text-secondary-100 font-medium">
              {isDragActive ? 'Drop the file here' : 'Drag & drop a document file here'}
            </p>
            <p className="text-sm text-secondary-500 dark:text-secondary-400">
              or click to select a file
            </p>
            <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
              Supported formats: PDF, TXT, HTML, DOC, DOCX (Max: 10MB)
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
            Document Title<span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            className="mt-1 input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
            Tags
          </label>
          <div className="mt-1 flex items-center">
            <input
              type="text"
              className="input"
              placeholder="Add a tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <button
              type="button"
              onClick={addTag}
              className="ml-2 p-2 rounded-md bg-primary-500 text-white hover:bg-primary-600"
            >
              <PlusCircleIcon className="h-5 w-5" />
            </button>
          </div>
          
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center bg-secondary-100 dark:bg-secondary-700 text-secondary-800 dark:text-secondary-200 rounded-full px-3 py-1"
                >
                  <span className="text-sm">{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Metadata
          </label>
          
          {metadataItems.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                className="input w-1/3"
                placeholder="Key"
                value={item.key}
                onChange={(e) => updateMetadataItem(index, 'key', e.target.value)}
              />
              <input
                type="text"
                className="input w-2/3"
                placeholder="Value"
                value={item.value}
                onChange={(e) => updateMetadataItem(index, 'value', e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeMetadataItem(index)}
                className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addMetadataItem}
            className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium flex items-center"
          >
            <PlusCircleIcon className="h-4 w-4 mr-1" />
            Add Metadata Field
          </button>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUploading || !file}
            className="btn-primary"
          >
            {isUploading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            ) : (
              'Upload Document'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentUploader;