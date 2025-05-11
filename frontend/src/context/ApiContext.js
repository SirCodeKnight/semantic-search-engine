import React, { createContext, useContext } from 'react';
import axios from 'axios';

const ApiContext = createContext();

export const useApi = () => useContext(ApiContext);

export const ApiProvider = ({ children }) => {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const apiKey = process.env.REACT_APP_API_KEY || '';

  const api = axios.create({
    baseURL: apiUrl,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
  });

  const apiFile = axios.create({
    baseURL: apiUrl,
    headers: {
      'X-API-Key': apiKey,
    },
  });

  // Search endpoints
  const searchDocuments = async (query, filters = {}, limit = 10, offset = 0, minScore = 0.0) => {
    const response = await api.post('/search', {
      query,
      filters,
      limit,
      offset,
      min_score: minScore,
      include_content: true,
    });
    return response.data;
  };

  const getSuggestions = async (prefix, limit = 5) => {
    const response = await api.post('/search/suggest', {
      prefix,
      limit,
    });
    return response.data.suggestions;
  };

  const recordQuery = async (query) => {
    await api.post(`/search/record-query?query=${encodeURIComponent(query)}`);
  };

  // Document endpoints
  const getDocuments = async (skip = 0, limit = 100, tag = null) => {
    const params = { skip, limit };
    if (tag) params.tag = tag;
    const response = await api.get('/documents', { params });
    return response.data;
  };

  const getDocument = async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  };

  const createDocument = async (document) => {
    const response = await api.post('/documents', document);
    return response.data;
  };

  const updateDocument = async (id, document) => {
    const response = await api.put(`/documents/${id}`, document);
    return response.data;
  };

  const deleteDocument = async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  };

  const uploadDocument = async (file, title = null, tags = [], metadata = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    formData.append('tags', JSON.stringify(tags));
    formData.append('metadata', JSON.stringify(metadata));

    const response = await apiFile.post('/documents/upload', formData);
    return response.data;
  };

  const crawlUrl = async (url, title = null, tags = [], metadata = {}) => {
    const response = await api.post('/documents/crawl', {
      url,
      title,
      tags,
      metadata,
    });
    return response.data;
  };

  // Chat endpoints
  const getConversations = async (skip = 0, limit = 20) => {
    const response = await api.get('/chat/conversations', {
      params: { skip, limit },
    });
    return response.data;
  };

  const getConversation = async (id) => {
    const response = await api.get(`/chat/conversations/${id}`);
    return response.data;
  };

  const deleteConversation = async (id) => {
    const response = await api.delete(`/chat/conversations/${id}`);
    return response.data;
  };

  const sendChatMessage = async (message, conversationId = null, contextWindow = 5) => {
    const response = await api.post('/chat', {
      message,
      conversation_id: conversationId,
      context_window: contextWindow,
    });
    return response.data;
  };

  // Admin endpoints
  const getStats = async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  };

  const resetSystem = async () => {
    const response = await api.post('/admin/reset');
    return response.data;
  };

  const reindexDocuments = async () => {
    const response = await api.post('/admin/reindex');
    return response.data;
  };

  // Embeddings endpoints
  const createEmbedding = async (text) => {
    const response = await api.post('/embeddings', { text });
    return response.data.embedding;
  };

  const createBatchEmbeddings = async (texts) => {
    const response = await api.post('/embeddings/batch', { texts });
    return response.data.embeddings;
  };

  const value = {
    apiUrl,
    // Search
    searchDocuments,
    getSuggestions,
    recordQuery,
    // Documents
    getDocuments,
    getDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    uploadDocument,
    crawlUrl,
    // Chat
    getConversations,
    getConversation,
    deleteConversation,
    sendChatMessage,
    // Admin
    getStats,
    resetSystem,
    reindexDocuments,
    // Embeddings
    createEmbedding,
    createBatchEmbeddings,
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};