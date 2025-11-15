# Lingo.dev Localization Demo

This is a simple Node.js web application that demonstrates how to use the Lingo.dev JavaScript SDK for real-time text translation.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Get your API key from [Lingo.dev](https://lingo.dev/app)

3. Update the `.env` file with your API key:
   ```
   LINGODOTDEV_API_KEY=your_actual_api_key
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Open your browser and go to `http://localhost:3000`

## Features

- Translate text between different languages
- Simple web interface
- Server-side translation using Lingo.dev SDK

## API Endpoint

- `POST /translate`: Accepts JSON with `text`, `sourceLocale`, `targetLocale` and returns translated text