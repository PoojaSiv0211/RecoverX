import axios from 'axios';
import { Movie } from '../types';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY || 'YOUR_TMDB_API_KEY'; // User should provide this

const tmdb = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: API_KEY,
  },
});

export const getTrending = async (): Promise<Movie[]> => {
  const { data } = await tmdb.get('/trending/movie/week');
  return data.results.filter((m: Movie) => m.poster_path && m.backdrop_path);
};

export const getPopular = async (): Promise<Movie[]> => {
  const { data } = await tmdb.get('/movie/popular');
  return data.results.filter((m: Movie) => m.poster_path && m.backdrop_path);
};

export const getTopRated = async (): Promise<Movie[]> => {
  const { data } = await tmdb.get('/movie/top_rated');
  return data.results.filter((m: Movie) => m.poster_path && m.backdrop_path);
};

export const getByGenre = async (genreId: number): Promise<Movie[]> => {
  const { data } = await tmdb.get('/discover/movie', {
    params: {
      with_genres: genreId,
      sort_by: 'popularity.desc',
    },
  });
  return data.results.filter((m: Movie) => m.poster_path && m.backdrop_path);
};

export const getAnime = async (): Promise<Movie[]> => {
  const { data } = await tmdb.get('/discover/tv', {
    params: {
      with_genres: '16', // Animation
      with_origin_country: 'JP',
      sort_by: 'popularity.desc',
    },
  });
  // Map TV results to Movie type for compatibility
  return data.results
    .filter((m: any) => m.poster_path && m.backdrop_path)
    .map((m: any) => ({
      ...m,
      title: m.name, // TV shows use 'name' instead of 'title'
      genre_ids: m.genre_ids || [],
    }));
};

export const searchMovies = async (query: string): Promise<Movie[]> => {
  const { data } = await tmdb.get('/search/multi', {
    params: {
      query,
    },
  });
  return data.results
    .filter((m: any) => (m.media_type === 'movie' || m.media_type === 'tv') && m.poster_path && m.backdrop_path)
    .map((m: any) => ({
      ...m,
      title: m.title || m.name,
      genre_ids: m.genre_ids || [],
    }));
};

export const getByLanguage = async (language: string): Promise<Movie[]> => {
  const { data } = await tmdb.get('/discover/movie', {
    params: {
      with_original_language: language,
      sort_by: 'popularity.desc',
    },
  });
  return data.results.filter((m: Movie) => m.poster_path && m.backdrop_path);
};

export const getByMood = async (mood: string): Promise<Movie[]> => {
  const moodMap: Record<string, number[]> = {
    'Happy': [35, 10751, 14], // Comedy, Family, Fantasy
    'Sad': [18, 10749], // Drama, Romance
    'Thrill': [53, 27, 80, 9648], // Thriller, Horror, Crime, Mystery
    'Chill': [16, 99, 10402], // Animation, Documentary, Music
    'Romantic': [10749, 18], // Romance, Drama
  };

  const { data } = await tmdb.get('/discover/movie', {
    params: {
      with_genres: moodMap[mood]?.join(','),
      sort_by: 'popularity.desc',
    },
  });
  return data.results.filter((m: Movie) => m.poster_path && m.backdrop_path);
};

export const getRecommendations = async (movieId: number): Promise<Movie[]> => {
  const { data } = await tmdb.get(`/movie/${movieId}/recommendations`);
  return data.results.filter((m: Movie) => m.poster_path && m.backdrop_path);
};

export const getMovieVideos = async (movieId: number) => {
  try {
    const { data } = await tmdb.get(`/movie/${movieId}/videos`);
    const trailer = data.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
    const teaser = data.results.find((v: any) => v.type === 'Teaser' && v.site === 'YouTube');
    return trailer || teaser || data.results[0];
  } catch (error) {
    return null;
  }
};

export const getImageUrl = (path: string, size: 'w500' | 'original' = 'w500') => {
  if (!path) return '';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};
