import React, { useState } from 'react';
import { usePageMetadata } from '../hooks/usePageMetadata';
import { useToast } from '../hooks/useToast';
import { addSupportTicket } from '../services/api';
import Turnstile from '../components/Turnstile';

const SupportPage: React.FC = () => {
  const { addToast } = useToast();
  
  const [subject, setSubject] = useState('Missing Download Link');
  const [contentTitle, setContentTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  usePageMetadata({
    title: 'Support & Feedback',
    description: 'Contact our support team for help or to provide feedback about CineStream.',
    path: '/support',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      addToast('Please enter a message.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await addSupportTicket({
        subject,
        contentTitle: (subject === 'Missing Download Link' || subject === 'Link Suggestion') ? contentTitle : '',
        message,
      }, turnstileToken);
      addToast('Thank you for your feedback! We have received your message.', 'success');
      
      // Reset form fields
      setSubject('Missing Download Link');
      setContentTitle('');
      setMessage('');
      if (window.turnstile) {
        window.turnstile.reset();
      }
      setTurnstileToken('');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        addToast(`Failed to submit feedback: ${errorMessage}`, 'error');
        if (window.turnstile) {
            window.turnstile.reset();
        }
        setTurnstileToken('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 border-l-4 border-light-accent dark:border-accent pl-4">Support & Feedback</h1>
      <div className="bg-light-secondary dark:bg-secondary p-8 rounded-lg shadow-lg">
        <p className="text-light-muted dark:text-muted mb-6">
          Encountered an issue, such as a missing download link for a movie or TV show? Have a suggestion? Fill out the form below to let us know. We appreciate your help in making CineStream better!
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-light-muted dark:text-muted mb-2">
              What is this about?
            </label>
            <select
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent"
              aria-label="Subject of feedback"
            >
              <option>Link Suggestion</option>
              <option>Missing Download Link</option>
              <option>Incorrect Information</option>
              <option>Bug Report</option>
              <option>General Feedback</option>
              <option>Other</option>
            </select>
          </div>

          {(subject === 'Missing Download Link' || subject === 'Link Suggestion') && (
             <div>
                <label htmlFor="contentTitle" className="block text-sm font-medium text-light-muted dark:text-muted mb-2">
                    Movie / TV Show Title (if applicable)
                </label>
                <input
                    id="contentTitle"
                    type="text"
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                    placeholder="e.g., Inception (2010)"
                    className="w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent"
                />
            </div>
          )}

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-light-muted dark:text-muted mb-2">
              Message
            </label>
            <textarea
              id="message"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-light-primary dark:bg-primary border border-light-border dark:border-gray-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-accent"
              placeholder={subject === 'Link Suggestion' 
                ? "Please use the 'Suggest a Link' button on a movie/TV page to contribute links. For other suggestions, please provide details here." 
                : "Please provide as much detail as possible..."}
              required
              aria-required="true"
            />
          </div>
          
          <div className="flex justify-center pt-2">
            <Turnstile onSuccess={setTurnstileToken} />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !turnstileToken}
              className="w-full bg-light-accent dark:bg-accent text-white font-bold py-3 px-4 rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupportPage;