document.addEventListener('DOMContentLoaded', () => {
    const movieInput = document.getElementById('movieInput');
    const searchBtn = document.getElementById('searchBtn');
    const suggestionsGrid = document.getElementById('suggestionsGrid');

    searchBtn.addEventListener('click', async () => {
        const movie = movieInput.value.trim();
        if (!movie) {
            suggestionsGrid.innerHTML = `<p class="error">Please enter a movie name</p>`;
            return;
        }

        try {
            searchBtn.disabled = true;
            searchBtn.textContent = 'Loading...';
            suggestionsGrid.innerHTML = '<div class="loading">Finding similar movies...</div>';
            
            const response = await fetch('http://localhost:3000/api/suggest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ movie })
            });

            const data = await response.json();
            
            if (!response.ok || data.error) {
                throw new Error(data.error || 'Failed to get suggestions');
            }

            displaySuggestions(data.suggestions);
        } catch (error) {
            console.error('Error:', error);
            suggestionsGrid.innerHTML = `
                <p class="error">
                    Error getting suggestions. Please try again.<br>
                    <small>${error.message}</small>
                </p>`;
        } finally {
            searchBtn.disabled = false;
            searchBtn.textContent = 'Search';
        }
    });

    function createMovieCard(movie) {
        const card = document.createElement('div');
        card.className = 'movie-card';

        // Get poster URL or use placeholder
        const posterUrl = movie.poster_info?.poster_path || 'https://via.placeholder.com/500x750?text=No+Poster';

        card.innerHTML = `
            <div class="movie-poster">
                <img src="${posterUrl}" alt="${movie.title || 'Movie'} Poster" 
                     onerror="this.src='https://via.placeholder.com/500x750?text=No+Poster'">
            </div>
            <div class="movie-content">
                <div class="movie-header">
                    <h3>${movie.title || 'Unknown Title'}</h3>
                    ${movie.year ? `<span class="movie-year">(${movie.year})</span>` : ''}
                </div>
                ${movie.explanation ? `
                    <div class="movie-reason">
                        <p>${movie.explanation}</p>
                    </div>
                ` : ''}
            </div>`;

        return card;
    }

    function displaySuggestions(suggestions) {
        suggestionsGrid.innerHTML = '';
        
        if (!Array.isArray(suggestions) || suggestions.length === 0) {
            suggestionsGrid.innerHTML = '<p class="error">No suggestions found</p>';
            return;
        }

        const title = document.createElement('h2');
        title.textContent = 'Similar Movies';
        suggestionsGrid.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'movies-grid';

        suggestions.forEach(movie => {
            if (movie && movie.title) {
                const card = createMovieCard(movie);
                grid.appendChild(card);
            }
        });

        suggestionsGrid.appendChild(grid);
    }

    // Allow Enter key to trigger search
    movieInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
}); 