import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Plus, ThumbsUp, ChevronDown, Star, Check, Trash2, Heart, Eye, Clock, XCircle } from 'lucide-react';
import { Movie, GENRE_MAP, WatchlistCategory, WatchlistItem } from '../types';
import { getImageUrl, getMovieVideos } from '../services/tmdb';

interface MovieCardProps {
  movie: Movie;
  key?: React.Key;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<WatchlistCategory | null>(null);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const getListKey = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      return `myList_${user.username}`;
    }
    return 'myList';
  };

  useEffect(() => {
    const myList: WatchlistItem[] = JSON.parse(localStorage.getItem(getListKey()) || '[]');
    const item = myList.find((m) => m.movie.id === movie.id);
    setIsInList(!!item);
    setCurrentCategory(item ? item.category : null);
  }, [movie.id]);

  useEffect(() => {
    if (isHovered) {
      hoverTimeout.current = setTimeout(async () => {
        const video = await getMovieVideos(movie.id);
        if (video) setTrailerKey(video.key);
      }, 1000);
    } else {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
      setTrailerKey(null);
    }
    return () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };
  }, [isHovered, movie.id]);

  const updateWatchlist = (category: WatchlistCategory | null) => {
    const myList: WatchlistItem[] = JSON.parse(localStorage.getItem(getListKey()) || '[]');
    let newList;
    
    if (category === null) {
      newList = myList.filter((m) => m.movie.id !== movie.id);
      setIsInList(false);
      setCurrentCategory(null);
    } else {
      const newItem: WatchlistItem = { movie, category, timestamp: Date.now() };
      const existingIndex = myList.findIndex((m) => m.movie.id === movie.id);
      if (existingIndex > -1) {
        myList[existingIndex] = newItem;
      } else {
        myList.push(newItem);
      }
      newList = myList;
      setIsInList(true);
      setCurrentCategory(category);
    }
    
    localStorage.setItem(getListKey(), JSON.stringify(newList));
    window.dispatchEvent(new Event('myListUpdated'));
    setShowCategoryMenu(false);
  };

  const [matchPercentage, setMatchPercentage] = useState(98);

  useEffect(() => {
    const myList: WatchlistItem[] = JSON.parse(localStorage.getItem(getListKey()) || '[]');
    
    if (myList.length > 0) {
      // Calculate user's favorite genres
      const genreCounts: Record<number, number> = {};
      myList.forEach(item => {
        item.movie.genre_ids.forEach(id => {
          genreCounts[id] = (genreCounts[id] || 0) + 1;
        });
      });

      // Find how many of this movie's genres match user's favorites
      const matchingGenres = movie.genre_ids.filter(id => (genreCounts[id] || 0) > 0);
      
      // Calculate score: base 75% + bonus for matching genres
      let score = 75 + (matchingGenres.length * 5);
      
      // Add some slight randomness for "AI feel"
      score += Math.floor(Math.random() * 5);
      
      setMatchPercentage(Math.min(Math.max(score, 70), 99));
    } else {
      // Default random high match for new users
      setMatchPercentage(85 + Math.floor(Math.random() * 14));
    }
  }, [movie.id]);

  const getCategoryIcon = (cat: WatchlistCategory) => {
    switch (cat) {
      case 'Watch Later': return <Clock className="w-4 h-4" />;
      case 'Watched': return <Eye className="w-4 h-4" />;
      case 'Loved': return <Heart className="w-4 h-4" />;
      case 'Dropped': return <XCircle className="w-4 h-4" />;
    }
  };

  const categories: WatchlistCategory[] = ['Watch Later', 'Watched', 'Loved', 'Dropped'];

  return (
    <div
      className="relative flex-none w-[200px] md:w-[240px] aspect-[2/3] cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowCategoryMenu(false);
      }}
    >
      <img
        src={getImageUrl(movie.poster_path)}
        alt={movie.title}
        className="w-full h-full object-cover rounded-md transition-opacity duration-300"
      />

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 0 }}
            animate={{ scale: 1.1, opacity: 1, y: -50 }}
            exit={{ scale: 0.8, opacity: 0, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute inset-0 z-50 w-[300px] md:w-[320px] h-fit bg-netflix-dark rounded-lg overflow-hidden card-expand-shadow"
          >
            <div className="relative aspect-video">
              {trailerKey ? (
                <iframe
                  src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}`}
                  className="w-full h-full pointer-events-none"
                  title={movie.title}
                  allow="autoplay"
                />
              ) : (
                <img
                  src={getImageUrl(movie.backdrop_path)}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-netflix-dark to-transparent" />
              <div className="absolute bottom-4 left-4">
                <h3 className="text-lg font-bold drop-shadow-md">{movie.title}</h3>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${trailerKey}`, '_blank')}
                    className="w-8 h-8 flex items-center justify-center bg-white rounded-full hover:bg-zinc-300 transition-colors"
                  >
                    <Play className="w-4 h-4 fill-black text-black" />
                  </button>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                      className={`w-8 h-8 flex items-center justify-center border-2 rounded-full transition-colors ${
                        isInList ? 'border-netflix-red bg-netflix-red/20' : 'border-zinc-500 hover:border-white'
                      }`}
                    >
                      {isInList ? (currentCategory ? getCategoryIcon(currentCategory) : <Check className="w-4 h-4" />) : <Plus className="w-4 h-4" />}
                    </button>
                    
                    <AnimatePresence>
                      {showCategoryMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 10 }}
                          className="absolute bottom-full left-0 mb-2 bg-zinc-900 border border-zinc-800 rounded-lg p-2 shadow-2xl min-w-[140px]"
                        >
                          {categories.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => updateWatchlist(cat)}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded hover:bg-zinc-800 transition-colors ${
                                currentCategory === cat ? 'text-netflix-red font-bold' : 'text-zinc-400'
                              }`}
                            >
                              {getCategoryIcon(cat)}
                              {cat}
                            </button>
                          ))}
                          {isInList && (
                            <button
                              onClick={() => updateWatchlist(null)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded hover:bg-red-900/30 text-red-500 transition-colors border-t border-zinc-800 mt-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button className="w-8 h-8 flex items-center justify-center border-2 border-zinc-500 rounded-full hover:border-white transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                </div>
                <button className="w-8 h-8 flex items-center justify-center border-2 border-zinc-500 rounded-full hover:border-white transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm mb-2">
                <span className="text-green-500 font-bold">{matchPercentage}% Match</span>
                <span className="px-1 border border-zinc-500 text-[10px] rounded">HD</span>
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-zinc-300">{movie.vote_average.toFixed(1)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {movie.genre_ids.slice(0, 3).map(id => (
                  <span key={id} className="text-xs text-zinc-300">
                    {GENRE_MAP[id]}
                    {id !== movie.genre_ids[2] && <span className="ml-2 text-zinc-600">•</span>}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
