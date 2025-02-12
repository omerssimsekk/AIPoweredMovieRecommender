const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const TMDB_API_URL = 'https://api.themoviedb.org/3';

// Validate API key
if (!DEEPSEEK_API_KEY) {
    console.error('ERROR: DEEPSEEK_API_KEY is not set in .env file');
    process.exit(1);
}

// Step 1: Get movie suggestions from Deepseek
async function getMovieSuggestions(movie) {
    const response = await axios.post(DEEPSEEK_API_URL, {
        model: "deepseek-chat",
        messages: [
            {
                role: "system",
                content: "You are a movie recommendation expert. Provide exactly 10 similar movies. Format each suggestion as: Title (YEAR) - [detailed explanation focusing on similarities in themes, style, plot elements, or atmosphere]. Keep explanations concise and focused."
            },
            {
                role: "user",
                content: `Suggest 10 movies similar to: ${movie}. Format each as: Title (YEAR) - [explanation of similarities]`
            }
        ],
        temperature: 0.7,
        max_tokens: 1500
    }, {
        headers: {
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from Deepseek API');
    }

    return response.data.choices[0].message.content;
}

// Step 2: Get movie poster from TMDB
async function getMoviePoster(movieTitle, year) {
    try {
        const searchResponse = await axios.get(`${TMDB_API_URL}/search/movie`, {
            params: {
                api_key: TMDB_API_KEY,
                query: movieTitle,
                year: year
            }
        });

        if (searchResponse.data.results && searchResponse.data.results.length > 0) {
            const movie = searchResponse.data.results[0];
            return {
                poster_path: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
                title: movie.title,
                release_date: movie.release_date,
                overview: movie.overview
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching movie poster:', error);
        return null;
    }
}

// Parse the AI response into structured data
function parseMovieSuggestions(content) {
    // Remove markdown formatting and clean up the text
    content = content.replace(/\*\*/g, '').replace(/\*/g, '');
    
    // Split by numbered lines or newlines
    const lines = content.split(/\d+\.\s*|\n/).filter(line => line.trim());
    const suggestions = [];

    for (const line of lines) {
        // Match title, year, and explanation with a more flexible pattern
        const match = line.match(/([^(]+)\s*\((\d{4})\)\s*[-–]\s*(.+)/);
        if (match) {
            let explanation = match[3].trim();
            // Remove "Here's why it's similar to [movie]:" if present
            explanation = explanation.replace(/^Here's why it's similar to [^:]+:\s*/i, '');
            
            suggestions.push({
                title: match[1].trim(),
                year: match[2],
                explanation: explanation
            });
        }
    }

    return suggestions;
}

app.post('/api/suggest', async (req, res) => {
    try {
        const { movie } = req.body;
        console.log('Searching for movies similar to:', movie);

        // Step 1: Get suggestions from Deepseek
        const aiResponse = await getMovieSuggestions(movie);
        console.log('AI Response:', aiResponse);

        // Parse the suggestions
        const suggestions = parseMovieSuggestions(aiResponse);
        console.log('Parsed suggestions:', suggestions);

        if (suggestions.length === 0) {
            throw new Error('No valid movie suggestions found');
        }

        // Step 2: Get posters for each suggestion
        const enrichedSuggestions = await Promise.all(
            suggestions.map(async (suggestion) => {
                const posterInfo = await getMoviePoster(suggestion.title, suggestion.year);
                return {
                    ...suggestion,
                    poster_info: posterInfo
                };
            })
        );

        // Step 3: Send the response
        res.json({ suggestions: enrichedSuggestions });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('API Key format valid:', DEEPSEEK_API_KEY.startsWith('sk-'));
}); 