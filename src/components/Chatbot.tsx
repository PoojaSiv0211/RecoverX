import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, Sparkles, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { Movie } from '../types';
import { getImageUrl, getMovieVideos, searchMovies, getByLanguage } from '../services/tmdb';

const LANGUAGE_MAP: Record<string, string> = {
  'tamil': 'ta',
  'hindi': 'hi',
  'telugu': 'te',
  'malayalam': 'ml',
  'kannada': 'kn',
  'korean': 'ko',
  'japanese': 'ja',
  'spanish': 'es',
  'french': 'fr',
  'german': 'de',
  'italian': 'it',
  'chinese': 'zh',
  'punjabi': 'pa',
  'marathi': 'mr',
  'bengali': 'bn',
  'gujarati': 'gu',
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatbotProps {
  movies: Movie[];
  user: { username: string } | null;
  onSearch: (query: string) => void;
}

export default function Chatbot({ movies, user, onSearch }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSearchClick = (content: string) => {
    // Try to extract movie names from quotes or just use the first few words
    const match = content.match(/"([^"]+)"/);
    const query = match ? match[1] : content.split(':')[1]?.split(',')[0]?.trim() || content.slice(0, 20);
    onSearch(query);
    setIsOpen(false);
  };

  useEffect(() => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `Hi ${user?.username || 'there'}! I'm your CineVision AI assistant. I can recommend movies from ANY language (Tamil, Spanish, Korean, etc.) and tell you where to watch them. What are you in the mood for?`,
        timestamp: new Date(),
      },
    ]);
  }, [user?.username]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getLocalRecommendation = async (query: string) => {
    const q = query.toLowerCase();
    
    // 1. Check for language keywords
    for (const [langName, langCode] of Object.entries(LANGUAGE_MAP)) {
      if (q.includes(langName)) {
        try {
          const results = await getByLanguage(langCode);
          if (results.length > 0) {
            const recs = results.slice(0, 3).map(m => `"${m.title}"`).join(', ');
            return `I found some great ${langName} movies for you: ${recs}. You can find more by searching "${langName}" in the main search bar!`;
          }
        } catch (err) {
          console.error(`Language search error for ${langName}:`, err);
        }
      }
    }

    // 2. Try general search
    try {
      const results = await searchMovies(query);
      if (results.length > 0) {
        const recs = results.slice(0, 3).map(m => `"${m.title}"`).join(', ');
        return `I found some matches for you: ${recs}. You can search for these in the main search bar to see more details!`;
      }
    } catch (err) {
      console.error('Fallback search error:', err);
    }
    
    // 3. Last resort: filter current movies
    const filtered = movies.filter(m => 
      m.title.toLowerCase().includes(q) || 
      m.overview.toLowerCase().includes(q)
    );
    if (filtered.length > 0) {
      const recs = filtered.slice(0, 3).map(m => `"${m.title}"`).join(', ');
      return `I found some movies in our current view: ${recs}.`;
    }
    return "I couldn't find any specific matches, but try searching for specific languages like 'Tamil', 'Spanish', or 'Korean' in the main search bar!";
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: [
          {
            role: "user",
            parts: [{ text: `You are a movie and anime expert assistant for CineVision AI. 
            The user is asking: "${input}". 
            
            CRITICAL: You MUST recommend movies from ALL languages (Tamil, Hindi, Telugu, Malayalam, Korean, Japanese, etc.) based on the user's request. Do not limit yourself to English movies.
            
            CRITICAL: You MUST wrap movie and anime titles in double quotes (e.g., "Leo", "Naruto") so the user can easily search for them.
            
            CRITICAL: You MUST be extremely appreciative of anime. If the user mentions anime, praise their taste and tell them which iconic anime character they "match" with based on their vibe or request.
            
            Provide movie and anime recommendations, tell them which OTT platform (Netflix, Prime, Disney+, etc.) they might be available on, and be helpful. 
            Keep responses concise and engaging. 
            If you can't find specific info, give general recommendations.` }]
          }
        ],
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || await getLocalRecommendation(input),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling Gemini:', error);
      const fallbackContent = await getLocalRecommendation(input);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `(Local Fallback) ${fallbackContent}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-netflix-red text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50 group"
      >
        <MessageCircle className="w-6 h-6 group-hover:hidden" />
        <Sparkles className="w-6 h-6 hidden group-hover:block animate-pulse" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[350px] md:w-[400px] h-[500px] bg-netflix-dark border border-zinc-800 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-netflix-black">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-netflix-red rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">CineVision AI</h3>
                  <span className="text-[10px] text-green-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Online
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm relative group/msg ${
                      msg.role === 'user'
                        ? 'bg-netflix-red text-white rounded-tr-none'
                        : 'bg-zinc-800 text-zinc-200 rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                    {msg.role === 'assistant' && msg.id !== '1' && (
                      <button
                        onClick={() => handleSearchClick(msg.content)}
                        className="absolute -right-10 top-0 p-2 bg-zinc-800 text-zinc-400 rounded-full opacity-0 group-hover/msg:opacity-100 transition-opacity hover:text-white"
                        title="Search for this"
                      >
                        <Search className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 p-3 rounded-2xl rounded-tl-none">
                    <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-zinc-800 bg-netflix-black">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about movies or OTTs..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-netflix-red transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="w-10 h-10 bg-netflix-red text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
