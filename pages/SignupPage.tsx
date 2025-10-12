import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { usePageMetadata } from '../hooks/usePageMetadata';
import { useToast } from '../hooks/useToast';
import { FilmIcon, EyeIcon, EyeOffIcon, SpinnerIcon } from '../components/Icons';
import Turnstile from '../components/Turnstile';

const SignupPage: React.FC = () => {
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const { sendOtp, verifyAndSignup } = useContext(AuthContext);
  const { addToast } = useToast();
  const navigate = useNavigate();

  usePageMetadata({
    title: 'Sign Up',
    description: 'Create a new account on CineStream.',
    path: '/signup',
  });

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await sendOtp(username, email, password, turnstileToken);
    setLoading(false);

    if (result.success) {
      addToast(result.message, 'success');
      setStep('otp');
    } else {
      addToast(result.message, 'error');
      if (window.turnstile) {
          window.turnstile.reset();
      }
      setTurnstileToken('');
    }
  };
  
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
        addToast('Please enter a 6-digit OTP.', 'error');
        return;
    }
    setLoading(true);
    const result = await verifyAndSignup(username.trim(), otp, password);
    setLoading(false);
    
    if (result.success) {
        navigate('/');
    } else {
        addToast(result.message, 'error');
        if(result.message.includes('log in manually')) {
            navigate('/login');
        }
    }
  };

  const renderDetailsForm = () => (
    <form onSubmit={handleDetailsSubmit} className="space-y-4">
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
            <label className="block text-sm font-medium text-light-muted dark:text-muted">Email</label>
            <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
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
                minLength={6}
                disabled={loading}
                />
                 <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-light-muted dark:text-muted hover:text-light-text dark:hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
            </div>
            <p className="text-xs text-light-muted dark:text-muted mt-1">Must be at least 6 characters long.</p>
        </div>
        <div className="flex justify-center pt-2">
            <Turnstile onSuccess={setTurnstileToken} />
        </div>
        <button
            type="submit"
            className="w-full bg-light-accent dark:bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !turnstileToken}
        >
            {loading ? <SpinnerIcon className="animate-spin h-5 w-5 mx-auto" /> : 'Continue'}
        </button>
    </form>
  );

  const renderOtpForm = () => (
    <form onSubmit={handleOtpSubmit} className="space-y-4">
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
            <p className="text-xs text-light-muted dark:text-muted mt-2 text-center">
                Enter the 6-digit code sent to <span className="font-semibold text-light-text dark:text-white">{email}</span>.
            </p>
        </div>
        <button
            type="submit"
            className="w-full bg-light-accent dark:bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500 transition-colors disabled:bg-gray-500"
            disabled={loading}
        >
            {loading ? <SpinnerIcon className="animate-spin h-5 w-5 mx-auto" /> : 'Verify & Create Account'}
        </button>
        <button
            type="button"
            onClick={() => setStep('details')}
            className="w-full text-center text-sm text-light-muted dark:text-muted hover:underline"
            disabled={loading}
        >
            Go back
        </button>
    </form>
  );

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md bg-light-secondary dark:bg-secondary p-8 rounded-lg shadow-lg">
        <div className="text-center mb-6">
            <FilmIcon className="h-12 w-12 mx-auto text-light-accent dark:text-accent" />
            <h1 className="text-2xl font-bold mt-2">
                {step === 'details' ? 'Create your account' : 'Check your email'}
            </h1>
        </div>
        {step === 'details' ? renderDetailsForm() : renderOtpForm()}
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