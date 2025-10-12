import React from 'react';
import { Link } from 'react-router-dom';
import { CastMember } from '../types';
import { TMDB_IMAGE_BASE_URL } from '../constants';
import { UserIcon } from './Icons';
import { generateSlug } from '../utils';

interface CastCardProps {
  person: CastMember;
}

const CastCard: React.FC<CastCardProps> = ({ person }) => {
  const imageUrl = person.profile_path
    ? `${TMDB_IMAGE_BASE_URL}${person.profile_path}`
    : null;

  const slug = generateSlug(person.name);

  return (
    <Link to={`/person/${person.id}-${slug}`} className="block text-center group">
      <div className="bg-light-secondary dark:bg-secondary rounded-lg overflow-hidden mb-2 transform group-hover:scale-105 transition-transform duration-300 shadow-lg aspect-[2/3]">
        {imageUrl ? (
          <img src={imageUrl} alt={person.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-light-primary dark:bg-primary">
            <UserIcon className="w-16 h-16 text-light-muted dark:text-muted" />
          </div>
        )}
      </div>
      <p className="font-bold text-sm text-light-text dark:text-white group-hover:text-light-accent dark:group-hover:text-accent transition-colors truncate">{person.name}</p>
      <p className="text-xs text-light-muted dark:text-muted truncate">{person.character}</p>
    </Link>
  );
};

export default CastCard;