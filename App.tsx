import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { WatchlistProvider } from './context/WatchlistContext';
import { ToastProvider } from './context/ToastContext';
import { ProfileProvider } from './context/ProfileContext';
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

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <FavoritesProvider>
          <WatchlistProvider>
            <ProfileProvider>
              <HashRouter>
                <div className="flex flex-col min-h-screen bg-primary">
                  <Header />
                  <main className="flex-grow container mx-auto px-4 py-8">
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/favorites" element={<FavoritesPage />} />
                      <Route path="/watchlist" element={<WatchlistPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/support" element={<SupportPage />} />
                      <Route path="/search/:query" element={<SearchResultsPage />} />
                      <Route path="/movie/:slug" element={<DetailsPage type="movie" />} />
                      <Route path="/tv/:slug" element={<DetailsPage type="tv" />} />
                      <Route path="/person/:slug" element={<PersonPage />} />
                      <Route path="/admin" element={<AdminPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              </HashRouter>
            </ProfileProvider>
          </WatchlistProvider>
        </FavoritesProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;