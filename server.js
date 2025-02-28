const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const PORT = process.env.PORT || 3000;
const DEBUG = true;

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Debug logging function
function debugLog(message, data = null) {
  if (DEBUG) {
    if (data) {
      console.log(`🔍 DEBUG: ${message}`, data);
    } else {
      console.log(`🔍 DEBUG: ${message}`);
    }
  }
}

// Log environment variables on startup
debugLog('Server starting with environment variables:');
debugLog('GEMINI_API_KEY', GEMINI_API_KEY ? 'Set ✓' : 'Missing ❌');
debugLog('TMDB_API_KEY', TMDB_API_KEY ? 'Set ✓' : 'Missing ❌');
debugLog('PORT', PORT);

// Helper function to search for a movie using TMDB API
async function searchMovie(title, year = '') {
  try {
    debugLog(`🎬 Searching for movie: "${title}" ${year ? `(${year})` : ''}`);
    
    // Handle common movie titles that might need special treatment
    let searchTitle = title.trim();
    
    // Special case for popular movies that might have many versions/sequels
    const popularMovies = {
      'matrix': { id: 603, title: 'The Matrix', year: '1999' },
      'the matrix': { id: 603, title: 'The Matrix', year: '1999' },
      'star wars': { id: 11, title: 'Star Wars', year: '1977' },
      'lord of the rings': { id: 120, title: 'The Lord of the Rings: The Fellowship of the Ring', year: '2001' },
      'godfather': { id: 238, title: 'The Godfather', year: '1972' },
      'inception': { id: 27205, title: 'Inception', year: '2010' },
      'pulp fiction': { id: 680, title: 'Pulp Fiction', year: '1994' },
      'fight club': { id: 550, title: 'Fight Club', year: '1999' }
    };
    
    // Check if we have a direct match for a popular movie
    const lowerTitle = searchTitle.toLowerCase();
    if (popularMovies[lowerTitle]) {
      debugLog(`📌 Found exact match for popular movie: ${popularMovies[lowerTitle].title}`);
      // Get the movie directly by ID
      const detailsUrl = `${TMDB_BASE_URL}/movie/${popularMovies[lowerTitle].id}?api_key=${TMDB_API_KEY}`;
      const response = await axios.get(detailsUrl);
      debugLog(`✅ Retrieved details for popular movie: ${response.data.title}`);
      return response.data;
    }
    
    let searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchTitle)}&include_adult=false`;
    
    if (year) {
      searchUrl += `&year=${year}`;
      debugLog(`Adding year parameter: ${year}`);
    }
    
    debugLog(`TMDB Search URL: ${searchUrl}`);
    
    const response = await axios.get(searchUrl);
    debugLog(`TMDB Search Results Count: ${response.data.results.length}`);
    
    if (response.data.results.length > 0) {
      // Try to find an exact match first (case insensitive)
      const exactMatches = response.data.results.filter(movie => 
        movie.title.toLowerCase() === searchTitle.toLowerCase() ||
        (movie.original_title && movie.original_title.toLowerCase() === searchTitle.toLowerCase())
      );
      
      // If we have exact matches and a year, filter by year too
      let bestMatches = exactMatches;
      if (exactMatches.length > 0 && year) {
        const yearMatches = exactMatches.filter(movie => 
          movie.release_date && movie.release_date.substring(0, 4) === year
        );
        if (yearMatches.length > 0) {
          bestMatches = yearMatches;
        }
      }
      
      // If we have exact matches, use the first one
      if (bestMatches.length > 0) {
        const movie = bestMatches[0];
        debugLog(`Found exact match: ${movie.title} (${movie.release_date?.substring(0, 4) || 'N/A'})`);
        return movie;
      }
      
      // Otherwise use the first result
      const movie = response.data.results[0];
      debugLog(`Found movie: ${movie.title} (${movie.release_date?.substring(0, 4) || 'N/A'})`);
      return movie;
    } else {
      debugLog(`❌ No movies found for: "${searchTitle}" ${year ? `(${year})` : ''}`);
      return null;
    }
  } catch (error) {
    debugLog(`❌ Error searching for movie: ${error.message}`);
    console.error('Error searching for movie:', error);
    return null;
  }
}

// Helper function to get movie details from TMDB
async function getMovieDetails(movieId) {
  try {
    debugLog(`Getting details for movie ID: ${movieId}`);
    
    const detailsUrl = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`;
    const response = await axios.get(detailsUrl);
    
    debugLog(`Successfully retrieved details for: ${response.data.title}`);
    return response.data;
  } catch (error) {
    debugLog(`❌ Error getting movie details: ${error.message}`);
    console.error('Error getting movie details:', error);
    return null;
  }
}

// Helper function to check if Gemini API key is valid
async function isGeminiApiKeyValid() {
  if (!GEMINI_API_KEY) {
    return false;
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    await model.generateContent("Test");
    return true;
  } catch (error) {
    debugLog(`❌ Gemini API key validation failed: ${error.message}`);
    return false;
  }
}

// API status endpoint
app.get('/api/status', async (req, res) => {
  try {
    const geminiApiValid = await isGeminiApiKeyValid();
    
    return res.json({
      status: 'ok',
      geminiApiValid,
      tmdbApiValid: !!TMDB_API_KEY
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'error',
      message: error.message
    });
  }
});

// Endpoint to get popular movies for the ticker
app.get('/api/popular', async (req, res) => {
  try {
    debugLog('📝 Fetching popular movies for ticker');
    
    const url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
    const response = await axios.get(url);
    
    // Add trailer keys to the movies
    const moviesWithTrailers = await Promise.all(
      response.data.results.slice(0, 10).map(async (movie) => {
        try {
          const videosUrl = `${TMDB_BASE_URL}/movie/${movie.id}/videos?api_key=${TMDB_API_KEY}`;
          const videosResponse = await axios.get(videosUrl);
          const trailers = videosResponse.data.results.filter(
            video => video.type === 'Trailer' && video.site === 'YouTube'
          );
          
          if (trailers.length > 0) {
            movie.trailerKey = trailers[0].key;
          }
        } catch (error) {
          debugLog(`Error fetching trailer for movie ${movie.id}: ${error.message}`);
        }
        
        return movie;
      })
    );
    
    debugLog(`✅ Found ${moviesWithTrailers.length} popular movies`);
    
    return res.json({
      results: moviesWithTrailers
    });
  } catch (error) {
    debugLog(`❌ Error fetching popular movies: ${error.message}`);
    return res.status(500).json({ 
      error: 'Failed to fetch popular movies',
      message: error.message
    });
  }
});

// Endpoint to get movie details by ID
app.get('/api/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    debugLog(`📝 Fetching details for movie ID: ${id}`);
    
    const movieDetails = await getMovieDetails(id);
    
    if (!movieDetails) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    // Format the response
    const formattedMovie = {
      id: movieDetails.id,
      title: movieDetails.title,
      poster_path: movieDetails.poster_path,
      backdrop_path: movieDetails.backdrop_path,
      overview: movieDetails.overview,
      release_date: movieDetails.release_date,
      vote_average: movieDetails.vote_average,
      runtime: movieDetails.runtime,
      genre_ids: movieDetails.genres.map(g => g.name),
      director: movieDetails.credits.crew.find(person => person.job === 'Director')?.name || 'Unknown',
      cast: movieDetails.credits.cast.slice(0, 5).map(actor => actor.name)
    };
    
    // Add trailer if available
    const trailers = movieDetails.videos.results.filter(
      video => video.type === 'Trailer' && video.site === 'YouTube'
    );
    
    if (trailers.length > 0) {
      formattedMovie.trailerKey = trailers[0].key;
    }
    
    debugLog(`✅ Successfully retrieved details for: ${formattedMovie.title}`);
    
    return res.json(formattedMovie);
  } catch (error) {
    debugLog(`❌ Error fetching movie details: ${error.message}`);
    return res.status(500).json({ 
      error: 'Failed to fetch movie details',
      message: error.message
    });
  }
});

// Endpoint to suggest similar movies
app.post('/api/suggest', async (req, res) => {
  const { title, year } = req.body;
  
  debugLog(`📝 Received request for movie suggestions:`, { title, year });
  
  if (!title) {
    debugLog('❌ Missing title in request');
    return res.status(400).json({ error: 'Movie title is required' });
  }
  
  try {
    // Search for the movie
    const movie = await searchMovie(title, year);
    
    if (!movie) {
      debugLog(`❌ Could not find movie: "${title}" ${year ? `(${year})` : ''}`);
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    debugLog(`🎬 Found movie: ${movie.title} (${movie.release_date?.substring(0, 4) || 'N/A'})`);
    
    // Get movie details for better context
    const movieDetails = await getMovieDetails(movie.id);
    
    if (!movieDetails) {
      debugLog(`❌ Could not get details for movie: ${movie.title}`);
      return res.status(500).json({ error: 'Failed to get movie details' });
    }
    
    // Extract relevant information for the prompt
    const genres = movieDetails.genres.map(g => g.name).join(', ');
    const director = movieDetails.credits.crew.find(person => person.job === 'Director')?.name || 'Unknown';
    const cast = movieDetails.credits.cast.slice(0, 5).map(actor => actor.name).join(', ');
    const overview = movieDetails.overview;
    
    // Create prompt for Gemini
    const prompt = `You are a movie recommendation expert. Based on the movie "${movie.title}" (${movie.release_date?.substring(0, 4) || 'N/A'}), which is a ${genres} film directed by ${director} starring ${cast}, with the following overview: "${overview}", suggest 10 similar fictional movies that fans would enjoy.

IMPORTANT: Suggest only movies that are in the same genre and style as "${movie.title}". Do NOT suggest documentaries unless the original movie is a documentary. Match the tone, themes, and type of the original movie.

For each movie, provide:
1. Title
2. Year of release (just the year)
3. Director
4. Brief reason why it's similar (2-3 sentences explaining specific similarities in plot, themes, style, or tone)

Format your response as a JSON array with objects containing these fields: title, year, director, reason.
Example format:
[
  {
    "title": "Movie Title",
    "year": "2020",
    "director": "Director Name",
    "reason": "Brief reason for recommendation"
  }
]

Only respond with the JSON array, no other text.`;

    debugLog('🤖 Gemini Prompt:', prompt);
    
    let suggestions = [];
    
    try {
      // Try to call Gemini API
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      debugLog('🤖 Gemini Raw Response:', responseText);
      
      // Parse the JSON response
      try {
        // Extract JSON from the response if it's wrapped in markdown code blocks
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                          responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText;
        suggestions = JSON.parse(jsonStr);
        
        debugLog(`✅ Successfully parsed ${suggestions.length} suggestions from Gemini`);
      } catch (parseError) {
        throw new Error(`Failed to parse Gemini response: ${parseError.message}`);
      }
    } catch (geminiError) {
      // Fallback: If Gemini API fails, use TMDB similar movies API
      debugLog(`⚠️ Gemini API failed: ${geminiError.message}. Using TMDB similar movies as fallback.`);
      
      try {
        // Get similar movies from TMDB
        const similarUrl = `${TMDB_BASE_URL}/movie/${movie.id}/similar?api_key=${TMDB_API_KEY}`;
        const similarResponse = await axios.get(similarUrl);
        const similarMovies = similarResponse.data.results.slice(0, 10);
        
        debugLog(`✅ Found ${similarMovies.length} similar movies from TMDB`);
        
        // Format similar movies to match our expected format
        suggestions = await Promise.all(similarMovies.map(async (similarMovie) => {
          // Get details for each similar movie to get director
          const details = await getMovieDetails(similarMovie.id);
          const director = details?.credits?.crew?.find(person => person.job === 'Director')?.name || 'Unknown';
          
          return {
            title: similarMovie.title,
            year: similarMovie.release_date?.substring(0, 4) || 'N/A',
            director: director,
            reason: `Similar to ${movie.title} in genre and style. ${similarMovie.overview?.substring(0, 100)}...`
          };
        }));
        
        debugLog(`✅ Successfully created ${suggestions.length} suggestions from TMDB similar movies`);
      } catch (tmdbError) {
        debugLog(`❌ TMDB similar movies fallback also failed: ${tmdbError.message}`);
        throw new Error(`Failed to get movie suggestions: ${geminiError.message}. Fallback also failed.`);
      }
    }
    
    // Validate suggestions format
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      debugLog('❌ Invalid suggestions format or empty array');
      return res.status(500).json({ 
        error: 'Invalid suggestions format or no suggestions found'
      });
    }
    
    // Process each suggested movie to get TMDB data
    debugLog(`🔍 Processing ${suggestions.length} movie suggestions`);
    
    const processedMovies = [];
    const failedMovies = [];
    
    for (const suggestion of suggestions) {
      try {
        if (!suggestion.title) {
          debugLog('❌ Suggestion missing title:', suggestion);
          failedMovies.push({
            ...suggestion,
            error: 'Missing title'
          });
          continue;
        }
        
        debugLog(`🎬 Processing suggestion: ${suggestion.title} (${suggestion.year || 'N/A'})`);
        
        // Search for the suggested movie in TMDB
        const tmdbMovie = await searchMovie(suggestion.title, suggestion.year);
        
        if (!tmdbMovie) {
          debugLog(`❌ Could not find TMDB data for: ${suggestion.title}`);
          failedMovies.push({
            ...suggestion,
            error: 'Not found in TMDB'
          });
          continue;
        }
        
        // Get full details for the movie
        const tmdbDetails = await getMovieDetails(tmdbMovie.id);
        
        if (!tmdbDetails) {
          debugLog(`❌ Could not get details for: ${suggestion.title}`);
          failedMovies.push({
            ...suggestion,
            error: 'Failed to get TMDB details'
          });
          continue;
        }
        
        // Combine AI suggestion with TMDB data
        const processedMovie = {
          ...suggestion,
          id: tmdbMovie.id,
          poster_path: tmdbMovie.poster_path,
          backdrop_path: tmdbMovie.backdrop_path,
          overview: tmdbMovie.overview,
          release_date: tmdbMovie.release_date,
          vote_average: tmdbMovie.vote_average,
          genre_ids: tmdbDetails.genres.map(g => g.name),
          runtime: tmdbDetails.runtime,
          trailerKey: tmdbDetails.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key || null,
          cast: tmdbDetails.credits?.cast?.slice(0, 5).map(actor => actor.name) || []
        };
        
        debugLog(`✅ Successfully processed: ${suggestion.title}`);
        processedMovies.push(processedMovie);
      } catch (movieError) {
        debugLog(`❌ Error processing movie ${suggestion.title}: ${movieError.message}`);
        failedMovies.push({
          ...suggestion,
          error: movieError.message
        });
      }
    }
    
    // Log summary of processing
    debugLog(`📊 Processing summary: ${processedMovies.length} successful, ${failedMovies.length} failed`);
    
    if (processedMovies.length === 0) {
      debugLog('❌ No movies were successfully processed');
      return res.status(500).json({ 
        error: 'Failed to process any movie suggestions',
        failedMovies
      });
    }
    
    // Return the processed suggestions
    return res.json({
      searchedMovie: {
        title: movie.title,
        year: movie.release_date?.substring(0, 4) || 'N/A',
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        overview: movie.overview,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        genre_ids: movieDetails.genres.map(g => g.name),
        id: movie.id
      },
      suggestions: processedMovies,
      failedSuggestions: failedMovies.length > 0 ? failedMovies : undefined
    });
    
  } catch (error) {
    debugLog(`❌ Server error: ${error.message}`);
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      message: error.message,
      stack: DEBUG ? error.stack : undefined
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🎬 Visit http://localhost:${PORT} to use the movie suggestion app`);
}); 