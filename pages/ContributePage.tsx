import React, { useState, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { usePageMetadata } from '../hooks/usePageMetadata';
import { useToast } from '../hooks/useToast';
import { addSupportTicket } from '../services/api';
import Turnstile from '../components/Turnstile';
import { LinkIcon, SpinnerIcon, FilmIcon } from '../components/Icons';
import { generateSlug } from '../utils';

const ContributePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // State from navigation
  const { contentTitle, tmdbId, type } = (location.state as { contentTitle?: string; tmdbId?: number; type?: 'movie' | 'tv' }) || {};

  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  usePageMetadata({
    title: 'Contribute a Link',
    description: `Help the community by suggesting a download link for ${contentTitle || 'content'}.`,
    path: '/contribute',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkLabel.trim() || !linkUrl.trim()) {
      addToast('Please fill out both the label and URL fields.', 'error');
      return;
    }
    
    // Simple URL validation
    try {
        new URL(linkUrl);
    } catch (_) {
        addToast('Please enter a valid URL.', 'error');
        return;
    }

    if (!contentTitle) {
        addToast('Cannot submit link without associated content.', 'error');
        return;
    }

    setIsSubmitting(true);
    
    try {
      await addSupportTicket({
        subject: 'Link Suggestion',
        contentTitle,
        message: `Label: ${linkLabel}\nURL: ${linkUrl}`,
        tmdbId,
        type,
      }, turnstileToken);
      
      addToast('Thank you for your contribution! The link has been submitted for approval.', 'success');
      
      // Navigate back to the details page after a short delay
      setTimeout(() => {
        if (tmdbId && type && contentTitle) {
            const slug = generateSlug(contentTitle);
            navigate(`/${type}/${tmdbId}-${slug}`);
        } else {
            navigate('/');
        }
      }, 1500);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        addToast(`Failed to submit link: ${errorMessage}`, 'error');
        if (window.turnstile) {
            window.turnstile.reset();
        }
        setTurnstileToken('');
        setIsSubmitting(false);
    }
  };

  if (!contentTitle || !tmdbId || !type) {
    return (
        <div className="text-center text-light-muted dark:text-muted text-lg mt-10 py-10 flex flex-col items-center">
            <FilmIcon className="h-16 w-16 mb-4" />
            <p className="font-bold text-xl text-light-text dark:text-white">How to Contribute</p>
            <p>To suggest a link, first find the movie or TV show you want to contribute to.</p>
            <p>Then, click the "Suggest a Link" button on its details page.</p>
            <Link to="/" className="mt-4 bg-light-accent dark:bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500 transition-colors">
                Go to Homepage
            </Link>
        </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Contribute a Link</h1>
      <p className="text-lg text-light-muted dark:text-muted mb-6">
        for <span className="font-bold text-light-text dark:text-white">{contentTitle}</span>
      </p>
      <div className="bg-light-secondary dark:bg-secondary p-8 rounded-lg shadow-lg">
        <p className="text-light-muted dark:text-muted mb-6">
          Found a working download link? Fill out the form below to share it with the community. Your contribution will be reviewed by an administrator.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="linkLabel" className="block text-sm font-medium text-light-muted dark:text-muted mb-2">
              Link Label
            </label>
            <input
              id="linkLabel"
              type="text"
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              className="w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent"
              placeholder="e.g., 1080p WEB-DL x265"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="linkUrl" className="block text-sm font-medium text-light-muted dark:text-muted mb-2">
              Download URL
            </label>
            <input
              id="linkUrl"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent"
              placeholder="https://example.com/download"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex justify-center pt-2">
            <Turnstile onSuccess={setTurnstileToken} />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !turnstileToken}
              className="group w-full flex items-center justify-center gap-2 bg-light-accent dark:bg-accent text-white font-bold py-3 px-4 rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                    <SpinnerIcon className="animate-spin h-5 w-5" />
                    <span>Submitting...</span>
                </>
              ) : (
                <>
                    <LinkIcon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                    <span>Submit for Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContributePage;