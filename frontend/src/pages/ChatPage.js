import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../context/ApiContext';
import ChatMessage from '../components/chatbot/ChatMessage';
import ChatInput from '../components/chatbot/ChatInput';
import ChatSources from '../components/chatbot/ChatSources';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ChatPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const { getConversations, getConversation, sendChatMessage, deleteConversation } = useApi();
  
  const [selectedConversationId, setSelectedConversationId] = useState(id || null);
  const [sources, setSources] = useState([]);

  // Get all conversations
  const { data: conversations } = useQuery(
    ['conversations'],
    () => getConversations(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Get selected conversation
  const {
    data: conversation,
    isLoading: conversationLoading,
    error: conversationError,
  } = useQuery(
    ['conversation', selectedConversationId],
    () => getConversation(selectedConversationId),
    {
      enabled: !!selectedConversationId,
      refetchInterval: 5000, // Refetch every 5 seconds in case of updates
    }
  );

  // Send message mutation
  const messageMutation = useMutation(
    (message) => sendChatMessage(message, selectedConversationId),
    {
      onSuccess: (data) => {
        // If this is a new conversation, update the selected conversation ID
        if (!selectedConversationId) {
          setSelectedConversationId(data.conversation_id);
          navigate(`/chat/${data.conversation_id}`, { replace: true });
        }
        
        // Update sources
        setSources(data.sources || []);
        
        // Invalidate queries to refetch data
        queryClient.invalidateQueries(['conversations']);
        queryClient.invalidateQueries(['conversation', data.conversation_id]);
      },
      onError: (error) => {
        toast.error('Failed to send message. Please try again.');
        console.error('Send message error:', error);
      },
    }
  );

  // Delete conversation mutation
  const deleteMutation = useMutation(
    (conversationId) => deleteConversation(conversationId),
    {
      onSuccess: () => {
        toast.success('Conversation deleted');
        
        // Reset selected conversation and navigate to chat page
        setSelectedConversationId(null);
        navigate('/chat', { replace: true });
        
        // Invalidate conversations query
        queryClient.invalidateQueries(['conversations']);
      },
      onError: (error) => {
        toast.error('Failed to delete conversation. Please try again.');
        console.error('Delete conversation error:', error);
      },
    }
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation?.messages]);

  // Handle send message
  const handleSendMessage = (message) => {
    messageMutation.mutate(message);
  };

  // Handle new conversation
  const handleNewConversation = () => {
    setSelectedConversationId(null);
    setSources([]);
    navigate('/chat', { replace: true });
  };

  // Handle select conversation
  const handleSelectConversation = (conversationId) => {
    setSelectedConversationId(conversationId);
    setSources([]);
    navigate(`/chat/${conversationId}`, { replace: true });
  };

  // Handle delete conversation
  const handleDeleteConversation = (e, conversationId) => {
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      deleteMutation.mutate(conversationId);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-150px)]">
      {/* Conversations sidebar */}
      <div className="md:col-span-1 bg-white dark:bg-secondary-800 rounded-lg shadow overflow-hidden flex flex-col h-full">
        <div className="p-3 border-b border-secondary-200 dark:border-secondary-700 flex justify-between items-center">
          <h2 className="text-lg font-medium text-secondary-900 dark:text-white">
            Conversations
          </h2>
          <button
            onClick={handleNewConversation}
            className="p-1 rounded-md text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {!conversations || conversations.length === 0 ? (
            <div className="text-center py-6 text-secondary-500 dark:text-secondary-400 text-sm">
              No conversations yet
            </div>
          ) : (
            <ul className="space-y-1">
              {conversations.map((conv) => (
                <li key={conv.id}>
                  <button
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full text-left px-3 py-2 rounded-md ${
                      selectedConversationId === conv.id
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium truncate">{conv.title}</span>
                      <button
                        onClick={(e) => handleDeleteConversation(e, conv.id)}
                        className="p-1 rounded-full text-secondary-400 hover:text-red-500 dark:text-secondary-500 dark:hover:text-red-400"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
                      {conv.messages.length} messages
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Chat area */}
      <div className="md:col-span-3 bg-white dark:bg-secondary-800 rounded-lg shadow overflow-hidden flex flex-col h-full">
        {/* Chat header */}
        <div className="p-3 border-b border-secondary-200 dark:border-secondary-700">
          <h2 className="text-lg font-medium text-secondary-900 dark:text-white">
            {selectedConversationId && conversation
              ? conversation.title
              : 'New Conversation'}
          </h2>
        </div>
        
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 bg-secondary-50 dark:bg-secondary-900">
          {conversationLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : conversationError ? (
            <div className="text-center py-6 text-red-500 dark:text-red-400">
              Error loading conversation: {conversationError.message}
            </div>
          ) : !selectedConversationId || !conversation || conversation.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="mt-2 text-lg font-medium text-secondary-900 dark:text-white">
                Start a new conversation
              </h3>
              <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400 max-w-sm text-center">
                Ask me anything about the documents you've added to the search engine.
              </p>
            </div>
          ) : (
            <>
              {conversation.messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Sources area, if available */}
        {sources.length > 0 && <ChatSources sources={sources} />}
        
        {/* Input area */}
        <ChatInput onSendMessage={handleSendMessage} isLoading={messageMutation.isLoading} />
      </div>
    </div>
  );
};

export default ChatPage;