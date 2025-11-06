import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import Login from './components/Login';
import Signup from './components/Signup';
import Payments from './components/Payments';
import UserProfile from './components/UserProfile';
import EmployeePortal from './components/EmployeePortal';
import ErrorBoundary from './components/ErrorBoundary';
import { AppProvider, useAuth, useUI } from './contexts/AppProvider';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastProvider } from './contexts/ToastContext';
import { OfflineProvider } from './contexts/OfflineContext';
import ToastNotifications from './components/ui/ToastNotifications';
import NotificationCenter from './components/NotificationCenter';
import { OfflineIndicator, OfflineStatusBar } from './components/ui/OfflineIndicator';
import NotFoundPage from './pages/NotFoundPage';
import ServerErrorPage from './pages/ServerErrorPage';
import NetworkErrorPage from './pages/NetworkErrorPage';
import OfflinePage from './pages/OfflinePage';
import { useNotificationErrorHandler } from './hooks/useNotificationErrorHandler';
import { useFocusVisible, useScreenReader } from './hooks/useAccessibility';
import { useOfflineStatus } from './hooks/useOfflineStatus';
import { register as registerSW } from './utils/serviceWorker';
import './utils/globalErrorHandler'; // Initialize global error handler
import './App.css';  // Basic styles

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Employee Route Component (requires employee role)
const EmployeeRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  if (user?.role !== 'employee') {
    return <Navigate to="/payments" replace />;
  }
  
  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/payments" replace />;
  }
  
  return children;
};

// Main App Routes Component
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const { announceNavigation } = useScreenReader();
  const { isOnline } = useOfflineStatus();
  
  // Initialize accessibility features
  useFocusVisible();
  
  // Initialize notification error handler
  useNotificationErrorHandler();

  // Redirect to offline page if offline and trying to access protected routes
  useEffect(() => {
    if (!isOnline && isAuthenticated && window.location.pathname === '/payments') {
      window.location.href = '/offline';
    }
  }, [isOnline, isAuthenticated]);

  // Handle route changes for screen readers
  useEffect(() => {
    const path = window.location.pathname;
    let pageName = 'Banking Application';
    
    switch (path) {
      case '/':
        pageName = 'Login Page';
        break;
      case '/signup':
        pageName = 'Sign Up Page';
        break;
      case '/payments':
        pageName = 'Payments Dashboard';
        break;
      case '/employee':
        pageName = 'Employee Portal';
        break;
      case '/profile':
        pageName = 'User Profile Page';
        break;
      default:
        pageName = 'Banking Application';
    }
    
    announceNavigation(pageName);
  }, [window.location.pathname, announceNavigation]);

  return (
    <div className="App min-h-screen bg-neutral-50">
      {/* Skip to main content link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50 focus:z-50"
        onClick={(e) => {
          e.preventDefault();
          const mainContent = document.getElementById('main-content');
          if (mainContent) {
            mainContent.focus();
            mainContent.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      >
        Skip to main content
      </a>

      {/* Offline Status Bar */}
      <OfflineStatusBar />

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Notification Bell - only show when authenticated */}
      {isAuthenticated && (
        <div className="fixed top-4 right-4 z-40">
          <button
            onClick={() => setShowNotificationCenter(true)}
            className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg bg-white shadow-lg"
            aria-label="Open notifications"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>
      )}

      {/* Site banner for accessibility */}
      <header role="banner" className="sr-only" aria-label="Application banner" />

      <main id="main-content" role="main" tabIndex="-1" className="focus:outline-none">
        <Routes>
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } 
          />
          <Route 
            path="/payments" 
            element={
              <ProtectedRoute>
                <Payments />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/employee" 
            element={
              <EmployeeRoute>
                <EmployeePortal />
              </EmployeeRoute>
            }
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          {/* Error Pages */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="/500" element={<ServerErrorPage />} />
          <Route path="/network-error" element={<NetworkErrorPage />} />
          <Route path="/offline" element={<OfflinePage />} />
          {/* Catch all route - redirect to 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Toast Notifications */}
      <ToastNotifications />
      
      {/* Notification Center - handled internally */}
      
      {/* Sonner Toast (backup) */}
      <Toaster 
        position="top-right"
        richColors
        closeButton
        duration={5000}
      />
    </div>
  );
};

function App() {
  // Register service worker
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      registerSW({
        onSuccess: (registration) => {
          console.log('Service Worker registered successfully:', registration);
        },
        onUpdate: (registration) => {
          console.log('Service Worker updated:', registration);
          // You could show a notification here about the update
        }
      });
    }
  }, []);

  return (
    <ErrorBoundary fallbackMessage="Something went wrong with the banking application. Please refresh the page or contact support.">
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <OfflineProvider>
            <NotificationProvider>
              <ToastProvider>
                <Router>
                  <AppRoutes />
                </Router>
              </ToastProvider>
            </NotificationProvider>
          </OfflineProvider>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;