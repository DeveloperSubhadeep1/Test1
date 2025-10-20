import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { apiResetPassword } from '../services/api';
import { useToast } from '../hooks/useToast';
import { usePageMetadata } from '../hooks/usePageMetadata';
import { FilmIcon, EyeIcon, EyeOffIcon, SpinnerIcon } from '../components/Icons';

const ResetPasswordPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const email = (location.state as { email?: string })?.email;

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  usePageMetadata({
    title: 'Reset Password',
    description: 'Enter your verification code and new password.',
    path: '/reset-password',
  });
  
  useEffect(() => {
    if (!email) {
      addToast('No email provided. Please start the password reset process again.', 'error');
      navigate('/forgot-password');
    }
  }, [email, navigate, addToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    if (otp.length !== 6) {
        addToast('Please enter a 6-digit OTP.', 'error');
        return;
    }

    setLoading(true);
    try {
      const result = await apiResetPassword(email, otp, newPassword);
      addToast(result.message, 'success');
      navigate('/login');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'An unexpected error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return null; // Redirecting...
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md bg-light-secondary dark:bg-secondary p-8 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <FilmIcon className="h-12 w-12 mx-auto text-light-accent dark:text-accent" />
          <h1 className="text-2xl font-bold mt-2">Set new password</h1>
           <p className="text-xs text-light-muted dark:text-muted mt-2 text-center">
                Enter the 6-digit code sent to <span className="font-semibold text-light-text dark:text-white">{email}</span>.
            </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-light-muted dark:text-muted">Verification Code</label>
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              className="w-full text-center tracking-[1em] text-xl font-bold bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent"
              required
              disabled={loading}
              autoComplete="one-time-code"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-light-muted dark:text-muted">New Password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-md p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent"
                required
                minLength={6}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="group absolute inset-y-0 right-0 pr-3 flex items-center text-light-muted dark:text-muted hover:text-light-text dark:hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" /> : <EyeIcon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />}
              </button>
            </div>
          </div>
           <div>
            <label className="block text-sm font-medium text-light-muted dark:text-muted">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent"
              required
              minLength={6}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-light-accent dark:bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500 transition-colors disabled:bg-gray-500"
            disabled={loading}
          >
            {loading ? <SpinnerIcon className="animate-spin h-5 w-5 mx-auto" /> : 'Reset Password'}
          </button>
        </form>
         <p className="text-center text-sm text-light-muted dark:text-muted mt-6">
          <Link to="/forgot-password" className="font-semibold text-light-accent dark:text-accent hover:underline">
            Didn't get a code?
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;