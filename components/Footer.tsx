import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-light-secondary dark:bg-secondary mt-12 border-t border-light-border dark:border-gray-800">
      <div className="container py-6">
        <div className="text-center text-light-muted dark:text-muted text-sm">
          <div className="flex justify-center space-x-6 mb-4">
              <Link to="/support" className="hover:text-light-accent dark:hover:text-accent transition-colors">Support</Link>
          </div>
          <p className="font-bold mb-2">Disclaimer</p>
          <p className="max-w-3xl mx-auto">
            This site only links to external download sources. We do not host any content on our servers. The site owner is not responsible for content hosted elsewhere. Please consult local laws regarding digital content consumption.
          </p>
          <p className="mt-4">&copy; {new Date().getFullYear()} CineStream. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;