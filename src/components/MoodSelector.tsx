import React from 'react';
import { Smile, Frown, Zap, Coffee, Heart } from 'lucide-react';
import { Mood } from '../types';
import { motion } from 'motion/react';

interface MoodSelectorProps {
  onSelect: (mood: Mood) => void;
  activeMood: Mood | null;
}

const moods: { type: Mood; icon: any; color: string }[] = [
  { type: 'Happy', icon: Smile, color: 'text-yellow-400' },
  { type: 'Sad', icon: Frown, color: 'text-blue-400' },
  { type: 'Thrill', icon: Zap, color: 'text-purple-400' },
  { type: 'Chill', icon: Coffee, color: 'text-green-400' },
  { type: 'Romantic', icon: Heart, color: 'text-pink-400' },
];

export default function MoodSelector({ onSelect, activeMood }: MoodSelectorProps) {
  return (
    <div className="px-4 md:px-12 mb-12">
      <h2 className="text-xl md:text-2xl font-bold mb-6 text-zinc-200">How are you feeling?</h2>
      <div className="flex flex-wrap gap-4">
        {moods.map(({ type, icon: Icon, color }) => (
          <motion.button
            key={type}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(type)}
            className={`flex items-center gap-3 px-6 py-3 rounded-full border transition-all ${
              activeMood === type
                ? `bg-white/10 border-white ${color}`
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            <Icon className={`w-5 h-5 ${activeMood === type ? color : ''}`} />
            <span className="font-medium">{type}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
