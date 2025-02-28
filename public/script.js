document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const movieInput = document.getElementById('movieInput');
    const searchBtn = document.getElementById('searchBtn');
    const suggestionsGrid = document.getElementById('suggestionsGrid');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const resultsContainer = document.getElementById('resultsContainer');
    const searchedMovie = document.getElementById('searchedMovie');
    const resultsCount = document.getElementById('resultsCount');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const movieDetailModal = document.getElementById('movieDetailModal');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.getElementById('closeModal');
    const apiNotification = document.getElementById('apiNotification');
    const closeNotification = document.getElementById('closeNotification');
    const tickerContent = document.getElementById('tickerContent');

    // Animation timing for staggered card appearance
    let cardDelay = 0;
    
    // Initialize
    initializeApp();
    
    function initializeApp() {
        console.log('🎬 CineMatch app initialized');
        
        // Add event listeners
        searchBtn.addEventListener('click', handleSearch);
        movieInput.addEventListener('keypress', handleEnterKey);
        closeModal.addEventListener('click', hideMovieModal);
        
        // Add input animations
        movieInput.addEventListener('focus', () => {
            movieInput.parentElement.classList.add('focused');
        });
        
        movieInput.addEventListener('blur', () => {
            movieInput.parentElement.classList.remove('focused');
        });
        
        // Add search button hover effect
        searchBtn.addEventListener('mouseenter', () => {
            searchBtn.classList.add('pulse');
        });
        
        searchBtn.addEventListener('mouseleave', () => {
            searchBtn.classList.remove('pulse');
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === movieDetailModal) {
                hideMovieModal();
            }
        });
        
        // Add escape key listener for modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && movieDetailModal.classList.contains('show')) {
                hideMovieModal();
            }
        });
        
        // API notification close button
        if (closeNotification) {
            closeNotification.addEventListener('click', () => {
                apiNotification.style.display = 'none';
                // Add some padding to the top of the app container to account for the fixed header
                document.querySelector('.app-container').style.paddingTop = '0';
            });
        }
        
        // Check if we need to show API notification
        checkApiStatus();
        
        // Load popular movies for the ticker
        loadPopularMovies();
    }
    
    // Load popular movies for the ticker
    async function loadPopularMovies() {
        try {
            const response = await fetch('http://localhost:3000/api/popular');
            
            if (!response.ok) {
                throw new Error('Failed to fetch popular movies');
            }
            
            const data = await response.json();
            
            if (data && data.results && data.results.length > 0) {
                populateMovieTicker(data.results.slice(0, 10));
            }
        } catch (error) {
            console.error('Error loading popular movies:', error);
            // Create some fallback movies for the ticker
            const fallbackMovies = [
                { 
                    title: "The Shawshank Redemption", 
                    vote_average: 9.3,
                    poster_path: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
                    id: 278
                },
                { 
                    title: "The Godfather", 
                    vote_average: 9.2,
                    poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
                    id: 238
                },
                { 
                    title: "The Dark Knight", 
                    vote_average: 9.0,
                    poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
                    id: 155
                },
                { 
                    title: "Pulp Fiction", 
                    vote_average: 8.9,
                    poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
                    id: 680
                },
                { 
                    title: "Fight Club", 
                    vote_average: 8.8,
                    poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
                    id: 550
                },
                { 
                    title: "Inception", 
                    vote_average: 8.8,
                    poster_path: "/8IB2e4r4oVhHnANbnm7O3Tj6tF8.jpg",
                    id: 27205
                },
                { 
                    title: "Interstellar", 
                    vote_average: 8.6,
                    poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
                    id: 157336
                },
                { 
                    title: "The Matrix", 
                    vote_average: 8.7,
                    poster_path: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
                    id: 603
                }
            ];
            populateMovieTicker(fallbackMovies);
        }
    }
    
    // Populate the movie ticker with popular movies
    function populateMovieTicker(movies) {
        if (!tickerContent) return;
        
        console.log('Populating ticker with movies:', movies);
        
        // Clear existing content
        tickerContent.innerHTML = '';
        
        // Create ticker items
        movies.forEach(movie => {
            const tickerItem = document.createElement('div');
            tickerItem.className = 'ticker-item';
            
            // Ensure we have a valid poster URL
            let posterUrl;
            if (movie.poster_path) {
                // If it's a full URL already, use it as is
                if (movie.poster_path.startsWith('http')) {
                    posterUrl = movie.poster_path;
                } else {
                    // Otherwise, prepend the TMDB base URL
                    posterUrl = `https://image.tmdb.org/t/p/w92${movie.poster_path}`;
                }
            } else {
                // Fallback image if no poster path
                posterUrl = 'https://via.placeholder.com/40x60?text=No+Poster';
            }
                
            tickerItem.innerHTML = `
                <div class="ticker-poster">
                    <img src="${posterUrl}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/40x60?text=No+Image'">
                </div>
                <div class="ticker-info">
                    <span class="ticker-title">${movie.title}</span>
                    <span class="ticker-rating">
                        <i class="fas fa-star"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                    </span>
                </div>
            `;
            
            // Add click event to show movie details
            tickerItem.addEventListener('click', () => {
                // If we have the movie data, show details
                if (movie.id) {
                    fetchMovieDetails(movie.id).then(details => {
                        if (details) {
                            showMovieDetails(details);
                        } else {
                            // If details fetch fails, just search for the movie
                            movieInput.value = movie.title;
                            handleSearch();
                        }
                    }).catch(err => {
                        console.error('Error fetching movie details:', err);
                        // Fallback to search
                        movieInput.value = movie.title;
                        handleSearch();
                    });
                }
                // Otherwise, search for the movie
                else {
                    movieInput.value = movie.title;
                    handleSearch();
                }
            });
            
            tickerContent.appendChild(tickerItem);
        });
        
        // Duplicate items for seamless scrolling
        const tickerItems = tickerContent.querySelectorAll('.ticker-item');
        tickerItems.forEach(item => {
            const clone = item.cloneNode(true);
            // Add the same click event to the clone
            clone.addEventListener('click', () => {
                const title = clone.querySelector('.ticker-title').textContent;
                movieInput.value = title;
                handleSearch();
            });
            tickerContent.appendChild(clone);
        });
    }
    
    // Fetch movie details by ID
    async function fetchMovieDetails(movieId) {
        try {
            const response = await fetch(`http://localhost:3000/api/movie/${movieId}`);
            
            if (!response.ok) {
                console.error('Failed to fetch movie details');
                return null;
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching movie details:', error);
            return null;
        }
    }
    
    // Check API status
    async function checkApiStatus() {
        try {
            const response = await fetch('http://localhost:3000/api/status');
            const data = await response.json();
            
            if (data.geminiApiValid === false) {
                // Show the notification
                apiNotification.style.display = 'flex';
                // Add some padding to the top of the app container to account for the fixed notification
                document.querySelector('.app-container').style.paddingTop = apiNotification.offsetHeight + 'px';
            } else {
                // Hide the notification
                apiNotification.style.display = 'none';
            }
        } catch (error) {
            console.error('Failed to check API status:', error);
            // Don't show the notification by default since we know the key is valid
            apiNotification.style.display = 'none';
        }
    }
    
    async function handleSearch() {
        const title = movieInput.value.trim();
        if (!title) {
            shakeInput();
            return;
        }

        try {
            console.log('🔍 Starting search for:', title);
            
            // Show loading state
            showLoading(true);
            
            const response = await fetch('http://localhost:3000/api/suggest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title })
            });

            console.log('📡 API Response Status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ API Error:', errorData);
                throw new Error(errorData.error || 'Failed to get movie suggestions');
            }

            const data = await response.json();
            console.log('✅ API Response Data:', data);
            
            // Update UI with results
            displayResults(data.searchedMovie, data.suggestions);

        } catch (error) {
            console.error('❌ Error during search:', error);
            showError(error);
        } finally {
            showLoading(false);
        }
    }
    
    function handleEnterKey(e) {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    }
    
    function shakeInput() {
        movieInput.classList.add('shake');
        setTimeout(() => movieInput.classList.remove('shake'), 600);
    }
    
    function showLoading(show) {
        searchBtn.disabled = show;
        if (show) {
            loadingOverlay.classList.add('show');
            searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
            startLoadingAnimation();
        } else {
            loadingOverlay.classList.remove('show');
            searchBtn.innerHTML = '<i class="fas fa-search"></i> Search';
            stopLoadingAnimation();
        }
    }
    
    let loadingInterval;
    function startLoadingAnimation() {
        const dots = document.querySelector('.dots');
        let count = 0;
        loadingInterval = setInterval(() => {
            count = (count + 1) % 4;
            dots.textContent = '.'.repeat(count);
        }, 300);
    }
    
    function stopLoadingAnimation() {
        clearInterval(loadingInterval);
    }
    
    function displayResults(movie, suggestions) {
        // Reset animation delay counter
        cardDelay = 0;
        
        // Hide welcome message and show results
        welcomeMessage.style.display = 'none';
        resultsContainer.style.display = 'block';
        
        // Check if we have valid suggestions
        if (!suggestions || suggestions.length === 0) {
            resultsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>No similar movies found. Please try another movie.</p>
                </div>
            `;
            return;
        }
        
        // Update results header with searched movie title
        document.querySelector('.results-header h2').textContent = 'You Searched For:';
        
        // Format year
        const year = movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';
        
        // Format rating if available
        const ratingHTML = movie.vote_average 
            ? `<div class="movie-rating"><i class="fas fa-star"></i> ${movie.vote_average.toFixed(1)}</div>` 
            : '';
        
        // Better poster handling with proper fallback
        const posterUrl = movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=No+Poster+Available';
        
        // Update searched movie information with new design
        searchedMovie.innerHTML = `
            <div class="searched-movie-poster">
                <img src="${posterUrl}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/500x750?text=Image+Not+Available'">
                ${ratingHTML}
            </div>
            <div class="searched-movie-info">
                <h2>${movie.title} (${year})</h2>
                <p>${movie.overview || 'No overview available.'}</p>
            </div>
            <div class="searched-movie-overlay">
                <p class="searched-movie-description">${movie.overview || 'No overview available.'}</p>
                <div class="searched-movie-actions">
                    ${movie.trailerKey ? `
                        <a href="https://www.youtube.com/watch?v=${movie.trailerKey}" target="_blank" class="movie-btn trailer-btn">
                            <i class="fas fa-play"></i> Watch Trailer
                        </a>
                    ` : ''}
                    <button class="movie-btn info-btn" id="searchedMovieDetails">
                        <i class="fas fa-info-circle"></i> More Details
                    </button>
                </div>
            </div>
        `;
        
        // Add event listener for the details button
        const detailsBtn = document.getElementById('searchedMovieDetails');
        if (detailsBtn) {
            detailsBtn.addEventListener('click', () => showMovieDetails(movie));
        }
        
        // Update results count with a more descriptive message
        resultsCount.textContent = `We Found ${suggestions.length} Similar Movies`;
        
        // Clear previous results
        suggestionsGrid.innerHTML = '';
        
        // Create and append movie cards with staggered animations
        suggestions.forEach((movie, index) => {
            const card = createMovieCard(movie);
            
            // Set staggered animation delay (cap at a reasonable maximum)
            const delay = Math.min(index * 0.1, 0.8);
            card.style.animationDelay = `${delay}s`;
            
            suggestionsGrid.appendChild(card);
        });
    }
    
    function createMovieCard(movie) {
        // Increment delay for staggered animation
        cardDelay += 0.08;
        
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.style.animationDelay = `${cardDelay}s`;
        
        // Format year
        const year = movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';
        
        // Format genres if available
        const genreHTML = movie.genre_ids && movie.genre_ids.length > 0 
            ? `<div class="movie-genres">${movie.genre_ids.slice(0, 3).map(genre => 
                `<span class="genre-tag">${genre}</span>`).join('')}</div>` 
            : '';
            
        // Format rating if available
        const ratingHTML = movie.vote_average 
            ? `<div class="movie-rating"><i class="fas fa-star"></i> ${movie.vote_average.toFixed(1)}</div>` 
            : '';
        
        // Better poster handling with proper fallback
        const posterUrl = movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=No+Poster+Available';

        // Truncate overview text to prevent overflow
        const truncatedOverview = movie.overview 
            ? (movie.overview.length > 150 ? movie.overview.substring(0, 150) + '...' : movie.overview)
            : 'No overview available.';

        card.innerHTML = `
            <div class="movie-poster">
                <img src="${posterUrl}" 
                     alt="${movie.title} Poster"
                     onerror="this.src='https://via.placeholder.com/500x750?text=Image+Not+Available'">
                ${ratingHTML}
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <span class="movie-year">(${year})</span>
                ${genreHTML}
            </div>
            <div class="movie-overlay">
                <p class="movie-description">${truncatedOverview}</p>
                <div class="movie-actions">
                    ${movie.trailerKey ? `
                        <a href="https://www.youtube.com/watch?v=${movie.trailerKey}" target="_blank" class="movie-btn trailer-btn">
                            <i class="fas fa-play"></i> Trailer
                        </a>
                    ` : ''}
                    <button class="movie-btn info-btn" data-movie-index="${movie.id}">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </div>
            </div>
        `;
        
        // Add event listener for the details button
        const infoBtn = card.querySelector('.info-btn');
        if (infoBtn) {
            infoBtn.addEventListener('click', () => showMovieDetails(movie));
        }
        
        return card;
    }

    function showMovieDetails(movie) {
        console.log('📋 Showing details for:', movie.title);
        
        // Format runtime as hours and minutes
        let runtimeStr = 'N/A';
        if (movie.runtime) {
            const hours = Math.floor(movie.runtime / 60);
            const minutes = movie.runtime % 60;
            runtimeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        }
        
        // Better poster and backdrop handling with proper fallback
        const posterUrl = movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=No+Poster+Available';
            
        const backdropUrl = movie.backdrop_path 
            ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`            : posterUrl;
        
        // Format genres with better styling
        const genresHTML = movie.genre_ids && movie.genre_ids.length > 0 
            ? `<div class="modal-genres">${movie.genre_ids.map(genre => 
                `<span class="genre-tag">${genre}</span>`).join('')}</div>` 
            : '';
        
        // Format rating with stars
        const ratingHTML = movie.vote_average 
            ? `<span><i class="fas fa-star" style="color: #ffd700;"></i> ${movie.vote_average.toFixed(1)}/10</span>` 
            : 'N/A';
            
        // Prepare modal content
        modalBody.innerHTML = `
            <div class="modal-header" style="background-image: url('${backdropUrl}')">
                <div class="modal-header-content">
                    <h2>${movie.title} <span>(${movie.release_date ? movie.release_date.substring(0, 4) : 'N/A'})</span></h2>
                    ${genresHTML}
                </div>
            </div>
            <div class="modal-info">
                <div class="modal-poster">
                    <img src="${posterUrl}" 
                         alt="${movie.title} Poster"
                         onerror="this.src='https://via.placeholder.com/500x750?text=Image+Not+Available'">
                </div>
                <div class="modal-details">
                    <h3>Overview</h3>
                    <p class="modal-description">${movie.overview || 'No overview available.'}</p>
                    
                    <h3>Why it's similar</h3>
                    <p class="modal-description">${movie.reason || 'This movie shares similar themes, genres, or style with your search.'}</p>
                    
                    <div class="modal-metadata">
                        <p><strong>Director:</strong> ${movie.director || 'N/A'}</p>
                        <p><strong>Runtime:</strong> ${runtimeStr}</p>
                        <p><strong>Rating:</strong> ${ratingHTML}</p>
                        <p><strong>Release Date:</strong> ${movie.release_date || 'N/A'}</p>
                    </div>
                    
                    <h3>Cast</h3>
                    <p class="modal-description">${movie.cast && movie.cast.length > 0 ? movie.cast.join(', ') : 'Cast information not available'}</p>
                    
                    <div class="modal-actions">
                        ${movie.trailerKey ? `
                            <a href="https://www.youtube.com/watch?v=${movie.trailerKey}" target="_blank" class="movie-btn trailer-btn">
                                <i class="fab fa-youtube"></i> Watch Trailer
                            </a>
                        ` : ''}
                        <a href="https://www.themoviedb.org/movie/${movie.id}" target="_blank" class="movie-btn info-btn">
                            <i class="fas fa-external-link-alt"></i> View on TMDB
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        // Show modal with animation
        movieDetailModal.classList.add('show');
        setTimeout(() => {
            modalBody.querySelector('.modal-header').classList.add('show');
        }, 100);
    }
    
    function hideMovieModal() {
        movieDetailModal.classList.remove('show');
    }
    
    function showError(error) {
        resultsContainer.style.display = 'block';
        welcomeMessage.style.display = 'none';
        
        resultsContainer.innerHTML = `
            <div class="error-container">
                <div class="error-icon">
                    <i class="fas fa-film"></i>
                </div>
                <h3>No Suggestions Found</h3>
                <p>${error.message || 'We couldn\'t find any suggestions right now. Please try again with a different movie.'}</p>
                ${error.details ? `
                    <div class="error-details">
                        <p>Error Details: ${typeof error.details === 'string' ? error.details : JSON.stringify(error.details)}</p>
                    </div>
                ` : ''}
                <button class="try-again-btn" onclick="document.getElementById('movieInput').focus()">
                    <i class="fas fa-search"></i> Try Another Movie
                </button>
            </div>
        `;
        
        searchedMovie.innerHTML = '';
        resultsCount.textContent = '0';
    }
    
    // Helper function to escape HTML and prevent XSS
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}); 
