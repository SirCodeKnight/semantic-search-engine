import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { XMarkIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

const DocumentForm = ({ onSubmit, initialData = null, isSubmitting }) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    defaultValues: initialData || {
      title: '',
      content: '',
      url: '',
      tags: [],
      metadata: {}
    }
  });

  const [tags, setTags] = useState(initialData?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [metadataKeys, setMetadataKeys] = useState(
    initialData?.metadata ? Object.keys(initialData.metadata) : []
  );
  const [newMetadataKey, setNewMetadataKey] = useState('');
  const [newMetadataValue, setNewMetadataValue] = useState('');

  // Handle form submission
  const processSubmit = (data) => {
    // Add tags to the form data
    data.tags = tags;
    
    // Add metadata to the form data
    data.metadata = {};
    metadataKeys.forEach(key => {
      data.metadata[key] = data[`metadata_${key}`];
      delete data[`metadata_${key}`];
    });
    
    onSubmit(data);
  };

  // Handle tag management
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      setValue('tags', updatedTags);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    setValue('tags', updatedTags);
  };

  // Handle metadata management
  const addMetadata = () => {
    if (newMetadataKey.trim() && !metadataKeys.includes(newMetadataKey.trim())) {
      const updatedKeys = [...metadataKeys, newMetadataKey.trim()];
      setMetadataKeys(updatedKeys);
      setValue(`metadata_${newMetadataKey.trim()}`, newMetadataValue);
      setNewMetadataKey('');
      setNewMetadataValue('');
    }
  };

  const removeMetadata = (keyToRemove) => {
    const updatedKeys = metadataKeys.filter(key => key !== keyToRemove);
    setMetadataKeys(updatedKeys);
  };

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
          Title<span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          className={`mt-1 input ${errors.title ? 'border-red-500' : ''}`}
          {...register('title', { required: 'Title is required' })}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="url" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
          URL (Optional)
        </label>
        <input
          id="url"
          type="text"
          className={`mt-1 input ${errors.url ? 'border-red-500' : ''}`}
          placeholder="https://example.com/document"
          {...register('url')}
        />
        <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
          Add a URL to crawl content from a webpage
        </p>
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
          Content (Optional)
        </label>
        <textarea
          id="content"
          rows={8}
          className={`mt-1 input ${errors.content ? 'border-red-500' : ''}`}
          placeholder="Enter document content here..."
          {...register('content')}
        ></textarea>
        <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
          Add content directly or leave empty if providing a URL
        </p>
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
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
          Metadata
        </label>
        <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            type="text"
            className="input"
            placeholder="Key"
            value={newMetadataKey}
            onChange={(e) => setNewMetadataKey(e.target.value)}
          />
          <div className="flex">
            <input
              type="text"
              className="input"
              placeholder="Value"
              value={newMetadataValue}
              onChange={(e) => setNewMetadataValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMetadata())}
            />
            <button
              type="button"
              onClick={addMetadata}
              className="ml-2 p-2 rounded-md bg-primary-500 text-white hover:bg-primary-600"
            >
              <PlusCircleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {metadataKeys.length > 0 && (
          <div className="mt-4 space-y-3">
            {metadataKeys.map((key) => (
              <div key={key} className="flex items-center">
                <div className="w-1/3 text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  {key}:
                </div>
                <div className="w-2/3 flex">
                  <input
                    type="text"
                    className="input"
                    {...register(`metadata_${key}`)}
                    defaultValue={initialData?.metadata?.[key] || ''}
                  />
                  <button
                    type="button"
                    onClick={() => removeMetadata(key)}
                    className="ml-2 p-2 rounded-md bg-red-500 text-white hover:bg-red-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            'Save Document'
          )}
        </button>
      </div>
    </form>
  );
};

export default DocumentForm;