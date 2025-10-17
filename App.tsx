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
import WatchOnlinePage from './pages/WatchOnlinePage';

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

  return (
    <div className="bg-light-primary dark:bg-primary text-light-text dark:text-gray-200">
      {/* Sidebar (Off-canvas) */}
      <div
        className={`fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isSidebarOpen}
      >
        <div className="absolute inset-0 bg-black/60" onClick={() => setIsSidebarOpen(false)} aria-hidden="true"></div>
        <div className="relative h-full">
          <Sidebar onLinkClick={() => setIsSidebarOpen(false)} onClose={() => setIsSidebarOpen(false)} />
        </div>
      </div>
      
      {/* Main Content Wrapper */}
      <div className="flex flex-col min-h-screen">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-grow container py-8">
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
            <Route path="/search/:query" element={<SearchResultsPage />} />
            <Route path="/movie/:slug" element={<DetailsPage type="movie" />} />
            <Route path="/tv/:slug" element={<DetailsPage type="tv" />} />
            <Route path="/watch/:type/:slug" element={<WatchOnlinePage />} />
            <Route path="/person/:slug" element={<PersonPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
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
