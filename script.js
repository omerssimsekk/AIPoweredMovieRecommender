document.addEventListener('DOMContentLoaded', () => {
    const movieInput = document.getElementById('movieInput');
    const searchBtn = document.getElementById('searchBtn');
    const suggestionsGrid = document.getElementById('suggestionsGrid');
    const inputMovie = document.getElementById('inputMovie');

    searchBtn.addEventListener('click', async () => {
        const movie = movieInput.value.trim();
        if (!movie) return;

        try {
            searchBtn.disabled = true;
            searchBtn.textContent = 'Loading...';
            
            const response = await fetch('http://localhost:3000/api/suggest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ movie })
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Display the suggestions
            displaySuggestions(data.suggestions);
        } catch (error) {
            console.error('Error:', error);
            suggestionsGrid.innerHTML = `<p class="error">Error getting suggestions. Please try again.</p>`;
        } finally {
            searchBtn.disabled = false;
            searchBtn.textContent = 'Search';
        }
    });

    function displaySuggestions(suggestions) {
        // Clear previous suggestions
        suggestionsGrid.innerHTML = '';
        
        // Parse the suggestions from the AI response and create movie cards
        const moviesList = suggestions.split('\n\n').filter(s => s.trim());
        
        moviesList.forEach(movie => {
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.innerHTML = `
                <div class="movie-content">
                    <h3>${movie}</h3>
                </div>
            `;
            suggestionsGrid.appendChild(card);
        });
    }

    // Allow Enter key to trigger search
    movieInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
}); 