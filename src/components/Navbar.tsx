import React, { useState, useEffect } from 'react';
import { Search, Bell, User, LogOut, Trash2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavbarProps {
  onTabChange: (tab: string) => void;
  onSearch: (query: string) => void;
  onLogout: () => void;
  activeTab: string;
  user: { username: string } | null;
}

export default function Navbar({ onTabChange, onSearch, onLogout, activeTab, user }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch(value);
  };

  const tabs = ['Home', 'TV Shows', 'Movies', 'New & Popular', 'My List'];

  return (
    <nav className={cn(
      "fixed top-0 w-full z-50 transition-colors duration-300 px-4 md:px-12 py-4 flex items-center justify-between",
      isScrolled ? "bg-netflix-black" : "bg-transparent bg-gradient-to-b from-black/70 to-transparent"
    )}>
      <div className="flex items-center gap-8">
        <h1 
          className="text-netflix-red text-2xl md:text-3xl font-bold tracking-tighter uppercase cursor-pointer"
          onClick={() => onTabChange('Home')}
        >
          CineVision
        </h1>
        <ul className="hidden lg:flex items-center gap-5 text-sm font-medium text-zinc-300">
          {tabs.map((tab) => (
            <li
              key={tab}
              onClick={() => onTabChange(tab)}
              className={cn(
                "cursor-pointer hover:text-zinc-300 transition-colors",
                activeTab === tab ? "text-white font-bold" : "text-zinc-400"
              )}
            >
              {tab}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-5 text-white">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 absolute left-3 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Titles, people, genres"
            className="bg-black/50 border border-zinc-700 rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white transition-all w-40 md:w-64"
          />
        </div>
        <Bell className="w-5 h-5 cursor-pointer hover:text-zinc-400 transition-colors" />
        <div className="group relative">
          <div className="w-8 h-8 bg-zinc-800 rounded overflow-hidden cursor-pointer">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
          </div>
          <div className="absolute right-0 top-full pt-2 hidden group-hover:block">
            <div className="bg-black/90 border border-zinc-800 p-2 rounded shadow-xl min-w-[150px]">
              <div className="px-3 py-2 border-b border-zinc-800 mb-2">
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Account</p>
                <p className="text-sm font-bold text-white truncate">{user?.username || 'Guest'}</p>
              </div>
              <div className="flex items-center gap-2 p-2 hover:bg-zinc-800 rounded cursor-pointer transition-colors">
                <User className="w-4 h-4" />
                <span className="text-sm">Profile Settings</span>
              </div>
              <div 
                onClick={() => {
                  if (user) {
                    localStorage.removeItem(`myList_${user.username}`);
                    window.dispatchEvent(new Event('myListUpdated'));
                  }
                }}
                className="flex items-center gap-2 p-2 hover:bg-zinc-800 rounded cursor-pointer transition-colors text-zinc-500 hover:text-white"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Clear My Data</span>
              </div>
              <div 
                onClick={onLogout}
                className="flex items-center gap-2 p-2 hover:bg-zinc-800 rounded cursor-pointer transition-colors text-netflix-red"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
