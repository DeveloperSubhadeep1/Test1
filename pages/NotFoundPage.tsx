import React from 'react';
import { Link } from 'react-router-dom';
import { FilmIcon } from '../components/Icons';
import { usePageMetadata } from '../hooks/usePageMetadata';

const NotFoundPage: React.FC = () => {

  usePageMetadata({
    title: 'Page Not Found (404)',
    description: 'The page you were looking for could not be found.',
    path: '/404'
  });

  return (
    <div className="text-center py-20">
      <FilmIcon className="h-24 w-24 mx-auto text-light-muted dark:text-muted mb-4" />
      <h1 className="text-6xl font-bold text-light-accent dark:text-accent">404</h1>
      <h2 className="text-3xl font-semibold mt-2 mb-4">Page Not Found</h2>
      <p className="text-light-muted dark:text-muted mb-8">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <Link
        to="/"
        className="bg-light-accent dark:bg-accent text-white font-bold py-3 px-6 rounded-md hover:bg-blue-500 transition-colors"
      >
        Go Back to Home
      </Link>
    </div>
  );
};

export default NotFoundPage;