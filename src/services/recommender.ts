import { Movie } from '../types';

/**
 * Simple TF-IDF based similarity for movie recommendations.
 * In a real production app, this would be computed on the backend.
 * For this demo, we use a client-side implementation.
 */

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
}

function getTermFrequency(tokens: string[]): Record<string, number> {
  const tf: Record<string, number> = {};
  tokens.forEach(token => {
    tf[token] = (tf[token] || 0) + 1;
  });
  return tf;
}

export function getRecommendations(targetMovie: Movie, allMovies: Movie[]): Movie[] {
  const targetTokens = tokenize(`${targetMovie.title} ${targetMovie.overview} ${targetMovie.genre_ids.join(' ')}`);
  const targetTf = getTermFrequency(targetTokens);

  const scores = allMovies
    .filter(m => m.id !== targetMovie.id)
    .map(movie => {
      const movieTokens = tokenize(`${movie.title} ${movie.overview} ${movie.genre_ids.join(' ')}`);
      const movieTf = getTermFrequency(movieTokens);

      // Cosine similarity (simplified)
      let dotProduct = 0;
      Object.keys(targetTf).forEach(term => {
        if (movieTf[term]) {
          dotProduct += targetTf[term] * movieTf[term];
        }
      });

      const targetMag = Math.sqrt(Object.values(targetTf).reduce((sum, val) => sum + val * val, 0));
      const movieMag = Math.sqrt(Object.values(movieTf).reduce((sum, val) => sum + val * val, 0));

      const similarity = dotProduct / (targetMag * movieMag || 1);
      return { movie, similarity };
    });

  return scores
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10)
    .map(s => s.movie);
}
