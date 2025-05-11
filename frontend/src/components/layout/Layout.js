import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import {
  MagnifyingGlassIcon,
  DocumentIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';

const Layout = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Navigation items
  const navigation = [
    { name: 'Search', path: '/search', icon: MagnifyingGlassIcon },
    { name: 'Documents', path: '/documents', icon: DocumentIcon },
    { name: 'Chat', path: '/chat', icon: ChatBubbleLeftRightIcon },
    { name: 'Admin', path: '/admin', icon: Cog6ToothIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50 dark:bg-secondary-900">
      {/* Top navigation bar */}
      <header className="bg-white dark:bg-secondary-800 shadow-sm z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <button 
                  onClick={toggleSidebar}
                  className="md:hidden p-2 rounded-md text-secondary-400 hover:text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>
                <Link to="/" className="font-bold text-xl text-primary-600 dark:text-primary-400 ml-2 md:ml-0">
                  Semantic Search
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-secondary-400 hover:text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-700"
              >
                {theme === 'dark' ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Mobile sidebar */}
        <div 
          className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
            sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="absolute inset-0 bg-secondary-900 opacity-75" onClick={closeSidebar}></div>
          <div className="absolute inset-y-0 left-0 max-w-xs w-full bg-white dark:bg-secondary-800 shadow-xl">
            <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-200 dark:border-secondary-700">
              <div className="font-bold text-xl text-primary-600 dark:text-primary-400">
                Semantic Search
              </div>
              <button
                onClick={closeSidebar}
                className="p-2 rounded-md text-secondary-400 hover:text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <nav className="mt-4 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200'
                        : 'text-secondary-600 dark:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-700'
                    }`}
                    onClick={closeSidebar}
                  >
                    <item.icon className={`mr-3 flex-shrink-0 h-6 w-6 ${
                      isActive 
                        ? 'text-primary-500 dark:text-primary-300' 
                        : 'text-secondary-400 dark:text-secondary-300'
                    }`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="w-64 flex flex-col">
            <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-secondary-800 border-r border-secondary-200 dark:border-secondary-700">
              <div className="flex-1 flex flex-col pt-5 pb-4">
                <nav className="mt-5 flex-1 px-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          isActive
                            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200'
                            : 'text-secondary-600 dark:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-700'
                        }`}
                      >
                        <item.icon className={`mr-3 flex-shrink-0 h-5 w-5 ${
                          isActive 
                            ? 'text-primary-500 dark:text-primary-300' 
                            : 'text-secondary-400 dark:text-secondary-300'
                        }`} />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-secondary-200 dark:border-secondary-700 p-4">
                <div className="flex-shrink-0 w-full group block">
                  <div className="flex items-center">
                    <div className="ml-3">
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">
                        Semantic Search Engine
                      </p>
                      <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                        v1.0.0
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <main className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;