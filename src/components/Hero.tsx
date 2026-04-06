import React, { useState, useEffect } from 'react';
import { Play, Info, Star, Sparkles, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Movie, GENRE_MAP, Mood, WatchlistItem } from '../types';
import { getImageUrl, getMovieVideos } from '../services/tmdb';

interface HeroProps {
  movies: Movie[];
  activeMood?: Mood | null;
  user: { username: string } | null;
}

export default function Hero({ movies, activeMood, user }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInList, setIsInList] = useState(false);

  const movie = movies[currentIndex];

  const getListKey = () => user ? `myList_${user.username}` : 'myList';

  useEffect(() => {
    if (!movie) return;
    const myList: WatchlistItem[] = JSON.parse(localStorage.getItem(getListKey()) || '[]');
    setIsInList(myList.some((m) => m.movie.id === movie.id));
  }, [movie?.id, user]);

  const toggleList = () => {
    const myList: WatchlistItem[] = JSON.parse(localStorage.getItem(getListKey()) || '[]');
    let newList;
    if (isInList) {
      newList = myList.filter((m) => m.movie.id !== movie.id);
      setIsInList(false);
    } else {
      myList.push({ movie, category: 'Watch Later', timestamp: Date.now() });
      newList = myList;
      setIsInList(true);
    }
    localStorage.setItem(getListKey(), JSON.stringify(newList));
    window.dispatchEvent(new Event('myListUpdated'));
  };

  const handlePlay = async (movieId: number) => {
    const video = await getMovieVideos(movieId);
    if (video) {
      window.open(`https://www.youtube.com/watch?v=${video.key}`, '_blank');
    }
  };

  useEffect(() => {
    if (movies.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(movies.length, 5));
    }, 8000);
    return () => clearInterval(interval);
  }, [movies]);

  if (movies.length === 0) return <div className="h-[85vh] bg-netflix-black animate-pulse" />;

  return (
    <div className="relative h-[85vh] w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={movie.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <img
            src={getImageUrl(movie.backdrop_path, 'original')}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 hero-gradient" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex flex-col justify-center px-4 md:px-12 mt-20">
        <motion.div
          key={`content-${movie.id}`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="max-w-2xl"
        >
          {activeMood && (
            <div className="flex items-center gap-2 text-netflix-red font-bold text-sm mb-4 bg-netflix-red/10 w-fit px-3 py-1 rounded-full border border-netflix-red/20 backdrop-blur-md">
              <Sparkles className="w-4 h-4" />
              <span>MATCHING YOUR {activeMood.toUpperCase()} MOOD</span>
            </div>
          )}
          {user && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-zinc-400 font-medium mb-2"
            >
              <span className="text-sm tracking-wide uppercase">Welcome back, {user.username}</span>
            </motion.div>
          )}
          <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
            {movie.title}
          </h1>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1 text-yellow-400">
              <Star className="w-5 h-5 fill-current" />
              <span className="font-bold text-white">{movie.vote_average.toFixed(1)}</span>
            </div>
            <span className="text-zinc-400">|</span>
            <span className="text-zinc-300">{movie.release_date.split('-')[0]}</span>
            <div className="flex gap-2">
              {movie.genre_ids.slice(0, 3).map(id => (
                <span key={id} className="px-2 py-0.5 bg-white/10 rounded text-xs backdrop-blur-sm">
                  {GENRE_MAP[id]}
                </span>
              ))}
            </div>
          </div>

          <p className="text-zinc-300 text-lg mb-8 line-clamp-3 drop-shadow-md">
            {movie.overview}
          </p>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => handlePlay(movie.id)}
              className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded font-bold hover:bg-white/80 transition-colors"
            >
              <Play className="w-6 h-6 fill-current" />
              Play
            </button>
            <button 
              onClick={toggleList}
              className={`flex items-center gap-2 px-8 py-3 rounded font-bold transition-colors backdrop-blur-md ${
                isInList ? 'bg-netflix-red text-white' : 'bg-zinc-500/50 text-white hover:bg-zinc-500/30'
              }`}
            >
              {isInList ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
              {isInList ? 'In My List' : 'Add to List'}
            </button>
            <button className="hidden md:flex items-center gap-2 px-8 py-3 bg-zinc-500/50 text-white rounded font-bold hover:bg-zinc-500/30 transition-colors backdrop-blur-md">
              <Info className="w-6 h-6" />
              More Info
            </button>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-10 right-12 flex gap-2">
        {movies.slice(0, 5).map((_, idx) => (
          <div
            key={idx}
            className={`h-1 transition-all duration-500 rounded-full ${
              idx === currentIndex ? 'w-8 bg-white' : 'w-2 bg-zinc-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
