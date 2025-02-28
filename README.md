# CineMatch - AI Movie Recommendations

CineMatch is an AI-powered movie recommendation web application that uses Google's Gemini 1.5 Flash API to suggest similar movies based on your input. The application provides detailed information about each suggested movie, including posters, trailers, cast information, and more.

![CineMatch Screenshot](https://via.placeholder.com/800x450?text=CineMatch+Screenshot)

## Features

- 🎬 AI-powered movie recommendations using Google's Gemini 1.5 Flash
- 🔍 Search for any movie to find similar titles
- 🌟 Detailed movie information including posters, backdrops, and ratings
- 📱 Responsive design that works on desktop and mobile devices
- 🎥 Direct links to trailers and TMDB pages
- 🎞️ Scrolling ticker of popular movies for quick access
- ✨ Beautiful animations and modern UI

## Installation

### Prerequisites

- Node.js (v14 or higher)
- API Keys:
  - [Google Gemini API Key](https://ai.google.dev/)
  - [TMDB API Key](https://www.themoviedb.org/documentation/api)

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/cinematch.git
   cd cinematch
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   TMDB_API_KEY=your_tmdb_api_key
   PORT=3000
   ```

4. Start the server:
   ```
   npm start
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Usage

1. **Browse Popular Movies**: The scrolling ticker at the top displays popular movies. Click on any movie to see details or search for similar titles.

2. **Search for Movies**:
   - Enter a movie title in the search box
   - Click "Find Movies" or press Enter
   - The app will display your searched movie and AI-suggested similar movies

3. **Interact with Movie Cards**:
   - Hover over any movie card to see a brief overview and action buttons
   - Click on "Details" to see comprehensive information about a movie
   - Click on "Trailer" to watch the movie trailer on YouTube

4. **Movie Details**:
   - The details modal shows the movie poster, backdrop, overview, cast, and more
   - You can see why the AI recommended this movie
   - Access external links to TMDB and YouTube



## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js, Express
- **APIs**:
  - Google Gemini 2.0 Flash API for AI recommendations
  - TMDB API for movie data and images
- **Libraries**:
  - @google/generative-ai
  - axios
  - dotenv
  - cors

## Development

To run the application in development mode with automatic restarts:

```
npm run dev
```

## License

MIT

## Acknowledgements

- Movie data provided by [The Movie Database (TMDB)](https://www.themoviedb.org/)
- AI recommendations powered by [Google Gemini](https://ai.google.dev/)
- Icons by [Font Awesome](https://fontawesome.com/) 