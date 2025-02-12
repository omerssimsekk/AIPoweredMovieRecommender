# AI-Powered Movie Recommendation App

A modern web application that provides intelligent movie recommendations using AI. When you input a movie you like, the app suggests 10 similar movies with detailed explanations of why they're similar, complete with movie posters and release years.

## Features

- **AI-Powered Recommendations**: Uses the Deepseek AI model to generate intelligent movie suggestions based on themes, plot elements, style, and atmosphere
- **Visual Movie Cards**: Displays movie suggestions with official posters from TMDB (The Movie Database)
- **Interactive UI**: 
  - Hover effects reveal detailed explanations
  - Responsive grid layout adapts to different screen sizes
  - Modern and clean design
- **Real-time Search**: Instantly get recommendations for any movie you input

## How It Works

1. **Input**: Enter the name of a movie you enjoy
2. **AI Analysis**: The Deepseek AI analyzes your movie choice and finds similar movies based on:
   - Thematic elements
   - Storytelling style
   - Visual atmosphere
   - Plot similarities
   - Genre elements
3. **Movie Information**: The app fetches official movie posters and details from TMDB
4. **Display**: Shows 10 movie recommendations with:
   - Movie poster
   - Title and release year
   - Detailed explanation of similarities (revealed on hover)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your API keys:
   ```
   DEEPSEEK_API_KEY=your_deepseek_api_key
   TMDB_API_KEY=your_tmdb_api_key
   PORT=3000
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Open `http://localhost:3000` in your browser

## Technologies Used

- **Frontend**:
  - HTML5
  - CSS3 (with modern animations and transitions)
  - JavaScript (Vanilla JS)
- **Backend**:
  - Node.js
  - Express.js
- **APIs**:
  - Deepseek AI API for movie recommendations
  - TMDB API for movie posters and information

## Dependencies

- express: ^4.18.2
- axios: ^1.6.2
- dotenv: ^16.4.1
- cors: ^2.8.5

## API Keys Required

- **Deepseek API Key**: For AI-powered movie recommendations
- **TMDB API Key**: For fetching movie posters and information

## Contributing

Feel free to submit issues and enhancement requests! 