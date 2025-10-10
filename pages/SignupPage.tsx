import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { usePageMetadata } from '../hooks/usePageMetadata';
import { useToast } from '../hooks/useToast';
import { FilmIcon } from '../components/Icons';

const SignupPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useContext(AuthContext);
  const { addToast } = useToast();
  const navigate = useNavigate();

  usePageMetadata({
    title: 'Sign Up',
    description: 'Create a new account on CineStream.',
    path: '/signup',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await signup(username, password);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      addToast(result.message, 'error');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md bg-light-secondary dark:bg-secondary p-8 rounded-lg shadow-lg">
        <div className="text-center mb-6">
            <FilmIcon className="h-12 w-12 mx-auto text-light-accent dark:text-accent" />
            <h1 className="text-2xl font-bold mt-2">Create your CineStream account</h1>
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
              minLength={3}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-light-muted dark:text-muted">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent"
              required
              minLength={6}
              disabled={loading}
            />
             <p className="text-xs text-light-muted dark:text-muted mt-1">Must be at least 6 characters long.</p>
          </div>
          <button
            type="submit"
            className="w-full bg-light-accent dark:bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500 transition-colors disabled:bg-gray-500"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <p className="text-center text-sm text-light-muted dark:text-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-light-accent dark:text-accent hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
