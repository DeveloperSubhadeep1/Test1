import React from 'react';
import { BotIcon, MessageSquareIcon, TelegramIcon, UsersIcon } from './Icons';

const TelegramAd: React.FC = () => {
  return (
    <div className="bg-light-secondary dark:bg-secondary rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center md:text-left">
          <TelegramIcon className="h-12 w-12 text-blue-400 flex-shrink-0" />
          <div>
            <h2 className="text-2xl font-bold text-light-text dark:text-white">Join our Telegram Community!</h2>
            <p className="text-light-muted dark:text-muted">Get instant updates, request content, and more.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0 w-full sm:w-auto">
          <a href="https://t.me/the_hell_king_updates" target="_blank" rel="noopener noreferrer" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition-colors flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
            <UsersIcon className="h-5 w-5" />
            <span>Channel</span>
          </a>
          <a href="https://t.me/The_hell_king_movie_group" target="_blank" rel="noopener noreferrer" className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full transition-colors flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
            <MessageSquareIcon className="h-5 w-5" />
            <span>Group</span>
          </a>
          <a href="https://t.me/Hell_King_69_Bot" target="_blank" rel="noopener noreferrer" className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full transition-colors flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
            <BotIcon className="h-5 w-5" />
            <span>Bot</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default TelegramAd;