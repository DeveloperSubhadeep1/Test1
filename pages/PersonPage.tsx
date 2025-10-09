
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPersonDetails, getPersonCredits } from '../services/api';
import { PersonDetails, PersonCredit } from '../types';
import { TMDB_IMAGE_BASE_URL } from '../constants';
import { useToast } from '../hooks/useToast';
import { usePageMetadata } from '../hooks/usePageMetadata';
import Spinner from '../components/Spinner';
import MovieCard from '../components/MovieCard';
import { UserIcon } from '../components/Icons';

const PersonPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [credits, setCredits] = useState<PersonCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const profilePath = person?.profile_path ? `${TMDB_IMAGE_BASE_URL}${person.profile_path}` : undefined;

  usePageMetadata({
    title: person?.name || 'Loading...',
    description: `View the biography and filmography for ${person?.name || 'this person'}.`,
    path: `/person/${id}`,
    imageUrl: profilePath,
  });

  useEffect(() => {
    const fetchPersonData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const personId = parseInt(id, 10);
        const [personData, creditsData] = await Promise.all([
          getPersonDetails(personId),
          getPersonCredits(personId),
        ]);
        setPerson(personData);
        setCredits(creditsData.cast.slice(0, 18));
      } catch (error) {
        console.error('Failed to fetch person data:', error);
        addToast("Could not load the person's details. Please try again.", 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchPersonData();
  }, [id, addToast]);

  if (loading) return <Spinner />;
  if (!person) return <p>Person not found.</p>;

  const profileUrl = person.profile_path
    ? `${TMDB_IMAGE_BASE_URL}${person.profile_path}`
    : null;

  return (
    <div className="space-y-12">
      <section className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/4 flex-shrink-0">
            <div className="aspect-[2/3] bg-secondary rounded-lg overflow-hidden shadow-2xl">
                {profileUrl ? (
                    <img src={profileUrl} alt={person.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary">
                        <UserIcon className="w-24 h-24 text-muted" />
                    </div>
                )}
            </div>
        </div>
        <div className="md:w-3/4">
          <h1 className="text-4xl font-bold text-white">{person.name}</h1>
          <p className="text-muted mt-1">{person.known_for_department}</p>
          {person.biography && (
            <>
              <h2 className="text-xl font-semibold mt-6 mb-2">Biography</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {person.biography}
              </p>
            </>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 border-l-4 border-accent pl-4">Known For</h2>
        {credits.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {credits.map(item => (
              <MovieCard key={`${item.media_type}-${item.id}`} item={item} type={item.media_type} />
            ))}
          </div>
        ) : (
          <p className="text-muted">No notable credits found.</p>
        )}
      </section>
    </div>
  );
};

export default PersonPage;