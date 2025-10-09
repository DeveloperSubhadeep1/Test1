
import { MovieSummary, TVSummary, MovieDetail, TVDetail } from '../types';

export const MOCK_MOVIES: { results: MovieSummary[] } = {
  results: [
    { id: 550, title: 'Fight Club', poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', release_date: '1999-10-15', vote_average: 8.4, overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.' },
    { id: 27205, title: 'Inception', poster_path: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', release_date: '2010-07-15', vote_average: 8.4, overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: "inception".' },
    { id: 155, title: 'The Dark Knight', poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', release_date: '2008-07-16', vote_average: 9.0, overview: 'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.' },
    { id: 680, title: 'Pulp Fiction', poster_path: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', release_date: '1994-09-10', vote_average: 8.9, overview: 'A burger-loving hit man, his philosophical partner, a drug-addled gangster\'s moll and a washed-up boxer converge in this sprawling, comedic crime caper. Their adventures unfurl in three stories that ingeniously trip back and forth in time.' },
    { id: 122, title: 'The Lord of the Rings: The Return of the King', poster_path: '/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', release_date: '2003-12-01', vote_average: 8.5, overview: 'Aragorn is revealed as the heir to the ancient kings of Gondor, and he, Gandalf and the other members of the broken fellowship struggle to save Gondor from Sauron\'s forces.' },
  ],
};

export const MOCK_TV: { results: TVSummary[] } = {
  results: [
    { id: 1399, name: 'Game of Thrones', poster_path: '/7WUHnWGx5DbuzAkn4T4jPpUWNii.jpg', first_air_date: '2011-04-17', vote_average: 8.4, overview: 'Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war. All while a very ancient evil awakens in the farthest north.' },
    { id: 1402, name: 'The Walking Dead', poster_path: '/xf9wuDcqlUPWABZNeDKPbieoBcw.jpg', first_air_date: '2010-10-31', vote_average: 8.1, overview: 'Sheriff\'s deputy Rick Grimes awakens from a coma to find a post-apocalyptic world dominated by flesh-eating zombies. He sets out to find his family and encounters many other survivors along the way.' },
    { id: 66732, name: 'Stranger Things', poster_path: '/49WJfeN0moxb9IPfGn8AIqMGskD.jpg', first_air_date: '2016-07-15', vote_average: 8.6, overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl.' },
    { id: 71446, name: 'The Mandalorian', poster_path: '/eU1i6eCXsJcsIeBSIwJulAyD12A.jpg', first_air_date: '2019-11-12', vote_average: 8.5, overview: 'After the fall of the Galactic Empire, lawlessness has spread throughout the galaxy. A lone gunfighter makes his way through the outer reaches, earning his keep as a bounty hunter.' },
  ],
};

export const MOCK_MOVIE_DETAILS: MovieDetail[] = [
    // FIX: Added missing vote_count property
    { ...MOCK_MOVIES.results[0], genres: [{id: 18, name: "Drama"}], runtime: 139, tagline: "Mischief. Mayhem. Soap.", vote_count: 24000 },
    // FIX: Added missing vote_count property
    { ...MOCK_MOVIES.results[1], genres: [{id: 28, name: "Action"}, {id: 878, name: "Science Fiction"}], runtime: 148, tagline: "Your mind is the scene of the crime.", vote_count: 30000 },
];

export const MOCK_TV_DETAILS: TVDetail[] = [
    // FIX: Added missing vote_count property
    { ...MOCK_TV.results[0], genres: [{id: 10765, name: "Sci-Fi & Fantasy"}, {id: 18, name: "Drama"}], episode_run_time: [60], tagline: "Winter is coming.", vote_count: 20000 },
    // FIX: Added missing vote_count property
    { ...MOCK_TV.results[2], genres: [{id: 10765, name: "Sci-Fi & Fantasy"}, {id: 9648, name: "Mystery"}], episode_run_time: [50], tagline: "The world is turning upside down.", vote_count: 15000 },
];
