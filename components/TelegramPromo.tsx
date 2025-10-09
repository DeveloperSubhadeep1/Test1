
import React from 'react';
import { TelegramIcon } from './Icons';

const TelegramPromo: React.FC = () => {
  return (
    <div className="bg-secondary border border-gray-700 rounded-lg p-6 my-4 w-full max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-white">Join Our Telegram Community!</h2>
          <p className="text-muted mt-1">Get the latest updates, join discussions, and request content.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 md:mt-0">
          <a href="https://t.me/The_hell_king_movie_group" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full sm:w-auto bg-accent/90 hover:bg-accent text-white font-bold py-2 px-4 rounded-full transition-colors duration-300 space-x-2">
            <TelegramIcon className="h-5 w-5" />
            <span>Movie Group</span>
          </a>
          <a href="https://t.me/the_hell_king_updates" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300 space-x-2">
             <TelegramIcon className="h-5 w-5" />
            <span>Updates Channel</span>
          </a>
          <a href="https://t.me/Hell_King_69_Bot" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300 space-x-2">
             <TelegramIcon className="h-5 w-5" />
            <span>Our Bot</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default TelegramPromo;
