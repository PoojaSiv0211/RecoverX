import React, { useState } from 'react';
import { Dice5, Loader2, Play, Info } from 'lucide-react';
import { Movie } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { getImageUrl } from '../services/tmdb';

interface RandomizerProps {
  movies: Movie[];
}

export default function Randomizer({ movies }: RandomizerProps) {
  const [randomMovie, setRandomMovie] = useState<Movie | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const pickRandom = () => {
    if (movies.length === 0) return;
    setIsSpinning(true);
    setTimeout(() => {
      const random = movies[Math.floor(Math.random() * movies.length)];
      setRandomMovie(random);
      setIsSpinning(false);
    }, 1500);
  };

  return (
    <div className="px-4 md:px-12 mb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-zinc-200">What Should I Watch Tonight?</h2>
          <p className="text-zinc-500 text-sm mt-1">Can't decide? Let us pick for you.</p>
        </div>
        <button
          onClick={pickRandom}
          disabled={isSpinning}
          className="flex items-center gap-2 px-6 py-3 bg-netflix-red text-white rounded-full font-bold hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
        >
          {isSpinning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Dice5 className="w-5 h-5" />}
          Roll the Dice
        </button>
      </div>

      <AnimatePresence mode="wait">
        {randomMovie && !isSpinning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative h-[400px] rounded-2xl overflow-hidden group"
          >
            <img
              src={getImageUrl(randomMovie.backdrop_path, 'original')}
              alt={randomMovie.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            
            <div className="absolute bottom-8 left-8 max-w-xl">
              <div className="flex items-center gap-2 text-netflix-red font-bold text-sm mb-2">
                <Dice5 className="w-4 h-4" />
                <span>YOUR RANDOM PICK</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">{randomMovie.title}</h3>
              <p className="text-zinc-300 line-clamp-2 mb-6">{randomMovie.overview}</p>
              
              <div className="flex gap-4">
                <button className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded font-bold hover:bg-zinc-200 transition-colors">
                  <Play className="w-5 h-5 fill-current" />
                  Play Now
                </button>
                <button className="flex items-center gap-2 px-6 py-2 bg-zinc-500/50 text-white rounded font-bold hover:bg-zinc-500/30 transition-colors backdrop-blur-md">
                  <Info className="w-5 h-5" />
                  More Info
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
