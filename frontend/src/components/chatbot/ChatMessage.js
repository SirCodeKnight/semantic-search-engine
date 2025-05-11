import React from 'react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`relative max-w-xl px-4 py-2 rounded-lg shadow ${
          isUser
            ? 'bg-primary-500 text-white'
            : 'bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100'
        }`}
      >
        <div className="mb-1 flex justify-between items-center">
          <span className={`text-xs font-medium ${isUser ? 'text-primary-100' : 'text-secondary-500 dark:text-secondary-400'}`}>
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className={`text-xs ${isUser ? 'text-primary-200' : 'text-secondary-400 dark:text-secondary-500'}`}>
            {format(new Date(message.created_at), 'h:mm a')}
          </span>
        </div>
        
        <div className={`prose ${isUser ? 'prose-invert' : 'dark:prose-invert'} max-w-none prose-sm`}>
          <ReactMarkdown>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;