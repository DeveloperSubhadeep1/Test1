
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import DetailsPage from './pages/DetailsPage';
import SearchResultsPage from './pages/SearchResultsPage';
import AdminPage from './pages/AdminPage';
import FavoritesPage from './pages/FavoritesPage';
import PersonPage from './pages/PersonPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <HashRouter>
          <div className="flex flex-col min-h-screen bg-primary">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/search/:query" element={<SearchResultsPage />} />
                <Route path="/movie/:id" element={<DetailsPage type="movie" />} />
                <Route path="/tv/:id" element={<DetailsPage type="tv" />} />
                <Route path="/person/:id" element={<PersonPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </HashRouter>
      </FavoritesProvider>
    </AuthProvider>
  );
};

export default App;
