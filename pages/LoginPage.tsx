import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { usePageMetadata } from '../hooks/usePageMetadata';
import { FilmIcon, EyeIcon, EyeOffIcon } from '../components/Icons';
import Turnstile from '../components/Turnstile';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  usePageMetadata({
    title: 'Login',
    description: 'Log in to your CineStream account.',
    path: '/login',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(username, password, turnstileToken);
    setLoading(false);
    if (success) {
      navigate(from, { replace: true });
    } else {
        if (window.turnstile) {
            window.turnstile.reset();
        }
        setTurnstileToken('');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md bg-light-secondary dark:bg-secondary p-8 rounded-lg shadow-lg">
        <div className="text-center mb-6">
            <FilmIcon className="h-12 w-12 mx-auto text-light-accent dark:text-accent" />
            <h1 className="text-2xl font-bold mt-2">Log in to CineStream</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-light-muted dark:text-muted">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-light-muted dark:text-muted">Password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-md p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="group absolute inset-y-0 right-0 pr-3 flex items-center text-light-muted dark:text-muted hover:text-light-text dark:hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                ) : (
                  <EyeIcon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                )}
              </button>
            </div>
             <div className="text-right mt-2">
                <Link to="/forgot-password" className="text-sm font-semibold text-light-accent dark:text-accent hover:underline">
                    Forgot Password?
                </Link>
            </div>
          </div>
          <div className="flex justify-center pt-2">
              <Turnstile onSuccess={setTurnstileToken} />
          </div>
          <button
            type="submit"
            className="w-full bg-light-accent dark:bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !turnstileToken}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p className="text-center text-sm text-light-muted dark:text-muted mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-light-accent dark:text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;