import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiSendResetOtp } from '../services/api';
import { useToast } from '../hooks/useToast';
import { usePageMetadata } from '../hooks/usePageMetadata';
import { FilmIcon, SpinnerIcon } from '../components/Icons';
import Turnstile from '../components/Turnstile';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const { addToast } = useToast();
  const navigate = useNavigate();

  usePageMetadata({
    title: 'Forgot Password',
    description: 'Reset your CineStream account password.',
    path: '/forgot-password',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await apiSendResetOtp(email, turnstileToken);
      addToast(result.message, 'success');
      navigate('/reset-password', { state: { email } });
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'An unexpected error occurred.', 'error');
      if (window.turnstile) {
        window.turnstile.reset();
      }
      setTurnstileToken('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md bg-light-secondary dark:bg-secondary p-8 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <FilmIcon className="h-12 w-12 mx-auto text-light-accent dark:text-accent" />
          <h1 className="text-2xl font-bold mt-2">Reset your password</h1>
          <p className="text-sm text-light-muted dark:text-muted mt-2">
            Enter your email and we'll send you a code to get back into your account.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-light-muted dark:text-muted">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent"
              required
              disabled={loading}
              placeholder="you@example.com"
            />
          </div>
          <div className="flex justify-center pt-2">
            <Turnstile onSuccess={setTurnstileToken} />
          </div>
          <button
            type="submit"
            className="w-full bg-light-accent dark:bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !turnstileToken}
          >
            {loading ? <SpinnerIcon className="animate-spin h-5 w-5 mx-auto" /> : 'Send Reset Code'}
          </button>
        </form>
        <p className="text-center text-sm text-light-muted dark:text-muted mt-6">
          Remembered your password?{' '}
          <Link to="/login" className="font-semibold text-light-accent dark:text-accent hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;