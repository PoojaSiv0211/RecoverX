import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MovieRow from './components/MovieRow';
import Chatbot from './components/Chatbot';
import MoodSelector from './components/MoodSelector';
import TasteProfile from './components/TasteProfile';
import Randomizer from './components/Randomizer';
import { Movie, Mood, WatchlistItem, GENRE_MAP } from './types';
import { getTrending, getPopular, getTopRated, getByGenre, getByLanguage, getByMood, getAnime, searchMovies } from './services/tmdb';
import { Loader2, User, LogOut, Sparkles, Globe, Clock, Heart, Eye, XCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import MovieCard from './components/MovieCard';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [action, setAction] = useState<Movie[]>([]);
  const [horror, setHorror] = useState<Movie[]>([]);
  const [romance, setRomance] = useState<Movie[]>([]);
  const [korean, setKorean] = useState<Movie[]>([]);
  const [indian, setIndian] = useState<Movie[]>([]);
  const [japanese, setJapanese] = useState<Movie[]>([]);
  const [anime, setAnime] = useState<Movie[]>([]);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [moodMovies, setMoodMovies] = useState<Movie[]>([]);
  const [myList, setMyList] = useState<WatchlistItem[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [activeTab, setActiveTab] = useState('Home');
  const [searchQuery, setSearchQuery] = useState('');
  const [unexploredMovies, setUnexploredMovies] = useState<Movie[]>([]);
  const [timeBasedMovies, setTimeBasedMovies] = useState<Movie[]>([]);
  const [activeMood, setActiveMood] = useState<Mood | null>(null);

  useEffect(() => {
    if (myList.length > 0) {
      const likedGenres = new Set(myList.flatMap(i => i.movie.genre_ids));
      const allGenres = Object.keys(GENRE_MAP).map(Number);
      const unexplored = allGenres.filter(id => !likedGenres.has(id));
      
      if (unexplored.length > 0) {
        const randomGenre = unexplored[Math.floor(Math.random() * unexplored.length)];
        const fetchUnexplored = async () => {
          const movies = await getByGenre(randomGenre);
          setUnexploredMovies(movies);
        };
        fetchUnexplored();
      }
    }
  }, [myList]);

  useEffect(() => {
    const hour = new Date().getHours();
    let genreId;
    if (hour >= 5 && hour < 12) genreId = 35; // Morning: Comedy
    else if (hour >= 12 && hour < 18) genreId = 12; // Afternoon: Adventure
    else if (hour >= 18 && hour < 22) genreId = 53; // Evening: Thriller
    else genreId = 27; // Night: Horror

    const fetchTimeBased = async () => {
      const movies = await getByGenre(genreId);
      setTimeBasedMovies(movies);
    };
    fetchTimeBased();
  }, []);

  const getTimeMessage = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning! Start your day with some laughs.";
    if (hour >= 12 && hour < 18) return "Good Afternoon! Ready for an adventure?";
    if (hour >= 18 && hour < 22) return "Good Evening! Time for some thrills.";
    return "Late Night? How about something spooky?";
  };
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setUsernameInput(parsedUser.username);
      const savedList = JSON.parse(localStorage.getItem(`myList_${parsedUser.username}`) || '[]');
      setMyList(savedList);
    }

    const handleListUpdate = () => {
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (currentUser) {
        const updatedList = JSON.parse(localStorage.getItem(`myList_${currentUser.username}`) || '[]');
        setMyList(updatedList);
      }
    };

    window.addEventListener('myListUpdated', handleListUpdate);
    return () => window.removeEventListener('myListUpdated', handleListUpdate);
  }, []);

  useEffect(() => {
    if (myList.length > 0 && trending.length > 0) {
      const getAiRecs = async () => {
        try {
          const likedTitles = myList.map(m => m.movie.title).join(', ');
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ role: "user", parts: [{ text: `Based on these liked movies: ${likedTitles}, recommend 5 similar movies from this list: ${trending.map(m => m.title).join(', ')}. Return ONLY the titles as a comma separated list.` }] }]
          });
          
          const recTitles = response.text?.split(',').map(t => t.trim()) || [];
          const recs = trending.filter(m => recTitles.includes(m.title));
          setAiRecommendations(recs);
        } catch (err) {
          console.error('AI Rec error:', err);
        }
      };
      getAiRecs();
    }
  }, [myList, trending]);

  useEffect(() => {
    if (activeMood) {
      const fetchMood = async () => {
        const movies = await getByMood(activeMood);
        setMoodMovies(movies);
      };
      fetchMood();
    }
  }, [activeMood]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          trendingData,
          popularData,
          topRatedData,
          actionData,
          horrorData,
          romanceData,
          koreanData,
          indianData,
          japaneseData,
          animeData
        ] = await Promise.all([
          getTrending(),
          getPopular(),
          getTopRated(),
          getByGenre(28), // Action
          getByGenre(27), // Horror
          getByGenre(10749), // Romance
          getByLanguage('ko'), // Korean
          getByLanguage('hi'), // Indian (Hindi)
          getByLanguage('ja'), // Japanese
          getAnime() // Anime
        ]);

        setTrending(trendingData);
        setPopular(popularData);
        setTopRated(topRatedData);
        setAction(actionData);
        setHorror(horrorData);
        setRomance(romanceData);
        setKorean(koreanData);
        setIndian(indianData);
        setJapanese(japaneseData);
        setAnime(animeData);
      } catch (err) {
        console.error('Error fetching movies:', err);
        setError('Failed to load movies. Please check your TMDB API key.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput) {
      const newUser = { username: usernameInput };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      // Load user-specific list
      const savedList = JSON.parse(localStorage.getItem(`myList_${usernameInput}`) || '[]');
      setMyList(savedList);
      
      setShowLogin(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUsernameInput('');
    localStorage.removeItem('user');
  };

  const [vibeMovies, setVibeMovies] = useState<Movie[]>([]);

  useEffect(() => {
    if (searchQuery && (searchQuery.includes('vibe') || searchQuery.length > 10)) {
      const getVibeRecs = async () => {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ role: "user", parts: [{ text: `The user is searching for a movie with this vibe: "${searchQuery}". 
            Based on these available movies: ${trending.map(m => m.title).join(', ')}, 
            return ONLY the titles of 5 movies that match this vibe as a comma separated list.` }] }]
          });
          
          const recTitles = response.text?.split(',').map(t => t.trim()) || [];
          const recs = trending.filter(m => recTitles.includes(m.title));
          setVibeMovies(recs);
        } catch (err) {
          console.error('Vibe Rec error:', err);
        }
      };
      getVibeRecs();
    } else {
      setVibeMovies([]);
    }
  }, [searchQuery, trending]);

  useEffect(() => {
    if (searchQuery) {
      const fetchSearch = async () => {
        const results = await searchMovies(searchQuery);
        setSearchResults(results);
      };
      fetchSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const filteredMovies = (movies: Movie[]) => {
    if (!searchQuery) return movies;
    if (vibeMovies.length > 0) return vibeMovies;
    return movies.filter(m => 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.overview.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  if (showLogin || (!user && !loading)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-netflix-black p-4 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1574267432553-4b4628081c31?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover opacity-50"
            alt="Netflix Background"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/80" />
        </div>

        <div className="w-full max-w-md bg-black/75 p-12 rounded-lg border border-zinc-800/50 z-10 backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-white mb-8">Welcome to CineVision</h1>
          <p className="text-zinc-400 mb-8">Enter your name to start exploring movies.</p>
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Your Name"
                className="w-full bg-zinc-800/80 border-none rounded px-4 py-4 text-white placeholder-zinc-400 focus:ring-2 focus:ring-netflix-red transition-all"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-netflix-red text-white py-4 rounded font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-900/20"
            >
              Start Watching
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-netflix-black gap-4">
        <Loader2 className="w-12 h-12 text-netflix-red animate-spin" />
        <p className="text-zinc-500 font-medium animate-pulse">Loading CineVision AI...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-netflix-black p-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong</h2>
        <p className="text-zinc-400 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-netflix-red text-white rounded font-bold hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-black pb-20">
      <Navbar onTabChange={setActiveTab} onSearch={setSearchQuery} onLogout={handleLogout} activeTab={activeTab} user={user} />
      
      <div className="fixed top-4 right-20 z-50 flex items-center gap-4">
        <div className="flex items-center gap-2 text-white bg-black/50 px-4 py-2 rounded-full backdrop-blur-md border border-zinc-800">
          <User className="w-4 h-4" />
          <span className="text-sm font-medium">{user?.username}</span>
          <button onClick={handleLogout} className="ml-2 text-zinc-400 hover:text-netflix-red">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <main>
        {searchQuery ? (
          <div className="pt-32 px-4 md:px-12">
            <h2 className="text-2xl font-bold text-white mb-8">Search results for "{searchQuery}"</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {searchResults.length > 0 ? (
                searchResults.map(movie => (
                  <div key={movie.id} className="w-full">
                    <MovieCard movie={movie} />
                  </div>
                ))
              ) : (
                <p className="text-zinc-500">No results found for "{searchQuery}". Try searching for something else!</p>
              )}
            </div>
          </div>
        ) : (
          <>
            <Hero 
              movies={activeMood && moodMovies.length > 0 ? moodMovies : trending} 
              activeMood={activeMood} 
              user={user}
            />
            
            <div className="relative z-10 mt-8 md:mt-12">
              {activeTab === 'Home' && (
                <>
                  <MoodSelector onSelect={setActiveMood} activeMood={activeMood} />
                  
                  {activeMood && moodMovies.length > 0 && (
                    <MovieRow title={`Because you're feeling ${activeMood}`} movies={moodMovies} />
                  )}

                  <Randomizer movies={[...trending, ...popular]} />

                  {timeBasedMovies.length > 0 && (
                    <div className="relative">
                      <div className="absolute -top-6 left-4 md:left-12 flex items-center gap-2 text-zinc-400 font-bold">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-widest">{getTimeMessage()}</span>
                      </div>
                      <MovieRow title="Time-Based Picks" movies={timeBasedMovies} />
                    </div>
                  )}

                  {myList.length > 0 && (
                    <TasteProfile myList={myList} user={user} />
                  )}

                  {myList.length > 0 && (
                    <MovieRow title="My List" movies={myList.map(i => i.movie)} />
                  )}
                  
                  {aiRecommendations.length > 0 && (
                    <div className="relative">
                      <div className="absolute -top-6 left-4 md:left-12 flex items-center gap-2 text-netflix-red font-bold animate-pulse">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-widest">AI Recommended for you</span>
                      </div>
                      <MovieRow title="AI Picks" movies={aiRecommendations} />
                    </div>
                  )}

                  {unexploredMovies.length > 0 && (
                    <div className="relative">
                      <div className="absolute -top-6 left-4 md:left-12 flex items-center gap-2 text-purple-400 font-bold">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-widest">Try Something New</span>
                      </div>
                      <MovieRow title="Step Outside Your Comfort Zone" movies={unexploredMovies} />
                    </div>
                  )}

                  <MovieRow title="Trending Now" movies={trending} />
                  
                  <div className="relative">
                    <div className="absolute -top-6 left-4 md:left-12 flex items-center gap-2 text-blue-400 font-bold">
                      <Globe className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-widest">Global Cinema Discovery</span>
                    </div>
                    <MovieRow title="K-Drama & Korean Hits" movies={korean} />
                    <MovieRow title="Anime Appreciation" movies={anime} />
                    <MovieRow title="Indian Blockbusters" movies={indian} />
                    <MovieRow title="Japanese Cinema" movies={japanese} />
                  </div>

                  <MovieRow title="Popular on CineVision" movies={popular} />
                  <MovieRow title="Top Rated" movies={topRated} />
                  <MovieRow title="Action Packed" movies={action} />
                  <MovieRow title="Horror Hits" movies={horror} />
                  <MovieRow title="Romantic Getaways" movies={romance} />
                  <MovieRow title="Sci-Fi & Fantasy" movies={trending.filter(m => m.genre_ids.includes(878) || m.genre_ids.includes(14))} />
                  <MovieRow title="Documentaries" movies={trending.filter(m => m.genre_ids.includes(99))} />
                </>
              )}

              {activeTab === 'TV Shows' && (
                <MovieRow title="TV Shows" movies={popular.filter(m => m.genre_ids.includes(10770) || m.genre_ids.includes(80))} />
              )}

              {activeTab === 'Movies' && (
                <MovieRow title="Movies" movies={popular} />
              )}

              {activeTab === 'New & Popular' && (
                <MovieRow title="New & Popular" movies={trending} />
              )}

              {activeTab === 'My List' && (
                <div className="space-y-12">
                  <MovieRow title="Watch Later" movies={myList.filter(i => i.category === 'Watch Later').map(i => i.movie)} />
                  <MovieRow title="Watched" movies={myList.filter(i => i.category === 'Watched').map(i => i.movie)} />
                  <MovieRow title="Loved" movies={myList.filter(i => i.category === 'Loved').map(i => i.movie)} />
                  <MovieRow title="Dropped" movies={myList.filter(i => i.category === 'Dropped').map(i => i.movie)} />
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <Chatbot 
        movies={[...trending, ...popular, ...topRated]} 
        user={user} 
        onSearch={(q) => {
          setSearchQuery(q);
          setActiveTab('Home');
        }}
      />

      <footer className="mt-20 px-4 md:px-12 py-12 border-t border-zinc-800 text-zinc-500 text-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <ul className="space-y-2">
            <li className="hover:underline cursor-pointer">Audio Description</li>
            <li className="hover:underline cursor-pointer">Help Center</li>
            <li className="hover:underline cursor-pointer">Gift Cards</li>
          </ul>
          <ul className="space-y-2">
            <li className="hover:underline cursor-pointer">Media Center</li>
            <li className="hover:underline cursor-pointer">Investor Relations</li>
            <li className="hover:underline cursor-pointer">Jobs</li>
          </ul>
          <ul className="space-y-2">
            <li className="hover:underline cursor-pointer">Terms of Use</li>
            <li className="hover:underline cursor-pointer">Privacy</li>
            <li className="hover:underline cursor-pointer">Legal Notices</li>
          </ul>
          <ul className="space-y-2">
            <li className="hover:underline cursor-pointer">Cookie Preferences</li>
            <li className="hover:underline cursor-pointer">Corporate Information</li>
            <li className="hover:underline cursor-pointer">Contact Us</li>
          </ul>
        </div>
        <p>© 2026 CineVision AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
