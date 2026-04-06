import React, { useMemo, useState } from 'react';
import { Movie, GENRE_MAP, WatchlistItem } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Sparkles, TrendingUp, Award, Brain, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';

const COLORS = ['#E50914', '#B81D24', '#831010', '#560D0D', '#330808'];

interface TasteProfileProps {
  myList: WatchlistItem[];
  user: { username: string } | null;
}

export default function TasteProfile({ myList, user }: TasteProfileProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const genreStats = useMemo(() => {
    const stats: Record<string, number> = {};
    myList.forEach(item => {
      item.movie.genre_ids.forEach(id => {
        const name = GENRE_MAP[id];
        if (name) stats[name] = (stats[name] || 0) + 1;
      });
    });
    return Object.entries(stats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [myList]);

  const topGenre = genreStats[0]?.name || 'None';

  const analyzePersonality = async () => {
    if (myList.length === 0 || isAnalyzing) return;
    
    setIsAnalyzing(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
      
      const ai = new GoogleGenAI({ apiKey });
      const lovedMovies = myList.filter(i => i.category === 'Loved').map(i => i.movie.title);
      const watchedMovies = myList.filter(i => i.category === 'Watched').map(i => i.movie.title);
      
      const prompt = `Based on these movies I loved: [${lovedMovies.join(', ')}] and these I've watched: [${watchedMovies.join(', ')}], what does my movie taste say about my personality? 
      Be creative, slightly witty, and insightful. Start with "Based on your cinematic DNA...". 
      Keep it under 80 words.`;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      setAnalysis(response.text || "You have a truly unique cinematic soul that defies simple categorization.");
    } catch (error) {
      console.error('Error analyzing personality:', error);
      setAnalysis("Your taste is so complex even our AI is still processing its brilliance!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (myList.length === 0) return null;

  return (
    <div className="px-4 md:px-12 mb-12">
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          <div className="flex-1 w-full">
            <div className="flex items-center gap-3 text-netflix-red mb-4">
              <Sparkles className="w-6 h-6" />
              <h2 className="text-2xl font-bold">{user?.username}'s Taste Profile</h2>
            </div>
            
            <p className="text-zinc-400 mb-8 max-w-md">
              We've analyzed your watch history and preferences. You seem to have a strong affinity for{' '}
              <span className="text-white font-bold">{topGenre}</span> movies.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
                <div className="text-sm text-zinc-400">Top Genre</div>
                <div className="text-lg font-bold text-white">{topGenre}</div>
              </div>
              <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                <Award className="w-5 h-5 text-yellow-500 mb-2" />
                <div className="text-sm text-zinc-400">Movies in List</div>
                <div className="text-lg font-bold text-white">{myList.length}</div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={analyzePersonality}
                disabled={isAnalyzing}
                className="flex items-center gap-2 bg-netflix-red text-white px-6 py-3 rounded-full font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
                {analysis ? 'Re-Analyze My Personality' : 'Analyze My Personality'}
              </button>

              <AnimatePresence>
                {analysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-800/30 border border-netflix-red/20 p-6 rounded-2xl relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-netflix-red" />
                    <p className="text-zinc-200 italic leading-relaxed relative z-10">
                      "{analysis}"
                    </p>
                    <Sparkles className="absolute -bottom-2 -right-2 w-12 h-12 text-netflix-red/10 group-hover:text-netflix-red/20 transition-colors" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="w-full lg:w-[350px] flex flex-col items-center">
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genreStats.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {genreStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#181818', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {genreStats.slice(0, 5).map((stat, i) => (
                <div key={stat.name} className="flex items-center gap-2 text-xs text-zinc-400">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {stat.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
