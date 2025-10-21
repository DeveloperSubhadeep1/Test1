import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { WatchlistProvider } from './context/WatchlistContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { CollectionProvider } from './context/CollectionContext';
import { HistoryProvider } from './context/HistoryContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import DetailsPage from './pages/DetailsPage';
import SearchResultsPage from './pages/SearchResultsPage';
import AdminPage from './pages/AdminPage';
import FavoritesPage from './pages/FavoritesPage';
import WatchlistPage from './pages/WatchlistPage';
import PersonPage from './pages/PersonPage';
import ProfilePage from './pages/ProfilePage';
import SupportPage from './pages/SupportPage';
import NotFoundPage from './pages/NotFoundPage';
import GenresPage from './pages/GenresPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';
import CollectionsListPage from './pages/CollectionsListPage';
import CollectionDetailsPage from './pages/CollectionDetailsPage';
import ContributePage from './pages/ContributePage';
import WatchTrailerPage from './pages/WatchTrailerPage';
import WatchOnlinePage from './pages/WatchOnlinePage';
import UrlParserPage from './pages/UrlParserPage';

const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on navigation
  useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);
  
  // Define page types for layout variations
  const isImmersivePage = location.pathname.startsWith('/movie/') || location.pathname.startsWith('/tv/');
  const isOverlayPage = location.pathname.startsWith('/watch/') || location.pathname.startsWith('/trailer');

  // Determine which layout components to show
  const showHeader = !isOverlayPage; // Show header everywhere except on full-screen video/trailer overlays
  const showFooter = !isImmersivePage && !isOverlayPage; // Show footer only on standard pages
  const useStandardContainer = !isImmersivePage && !isOverlayPage; // Apply container and padding only to standard pages

  return (
    <div className={useStandardContainer ? 'bg-light-primary dark:bg-primary text-light-text dark:text-gray-200' : 'text-light-text dark:text-gray-200'}>
      {/* Sidebar is available on any page with a header */}
      {showHeader && (
        <div
          className={`fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out ${ isSidebarOpen ? 'translate-x-0' : '-translate-x-full' }`}
          role="dialog"
          aria-modal="true"
          aria-hidden={!isSidebarOpen}
        >
          <div 
              className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ease-in-out ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
              onClick={() => setIsSidebarOpen(false)} 
              aria-hidden="true"
          ></div>
          <div className="relative h-full">
            <Sidebar onLinkClick={() => setIsSidebarOpen(false)} onClose={() => setIsSidebarOpen(false)} />
          </div>
        </div>
      )}
      
      <div className="flex flex-col min-h-screen">
        {showHeader && <Header onMenuClick={() => setIsSidebarOpen(true)} />}
        
        <main className={useStandardContainer ? "flex-grow container py-8" : "flex-grow"}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
            <Route path="/watchlist" element={<ProtectedRoute><WatchlistPage /></ProtectedRoute>} />
            <Route path="/collections" element={<ProtectedRoute><CollectionsListPage /></ProtectedRoute>} />
            <Route path="/collection/:id" element={<CollectionDetailsPage />} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/contribute" element={<ProtectedRoute><ContributePage /></ProtectedRoute>} />
            <Route path="/genres" element={<GenresPage />} />
            <Route path="/url-parser" element={<UrlParserPage />} />
            <Route path="/search/:query" element={<SearchResultsPage />} />
            <Route path="/movie/:slug" element={<DetailsPage type="movie" />} />
            <Route path="/tv/:slug" element={<DetailsPage type="tv" />} />
            <Route path="/person/:slug" element={<PersonPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            {/* NEW ROUTES */}
            <Route path="/trailer" element={<WatchTrailerPage />} />
            <Route path="/watch/:type/:slug" element={<WatchOnlinePage />} />
            
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        
        {showFooter && <Footer />}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <FavoritesProvider>
            <WatchlistProvider>
              <CollectionProvider>
                <NotificationsProvider>
                  <HistoryProvider>
                    <HashRouter>
                      <AppLayout />
                    </HashRouter>
                  </HistoryProvider>
                </NotificationsProvider>
              </CollectionProvider>
            </WatchlistProvider>
          </FavoritesProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;