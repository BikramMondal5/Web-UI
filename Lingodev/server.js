const express = require('express');
const { LingoDotDevEngine } = require('lingo.dev/sdk');
require('dotenv').config();

const app = express();
const port = 3000;

// Initialize Lingo.dev engine
const lingoDotDev = new LingoDotDevEngine({
  apiKey: process.env.LINGODOTDEV_API_KEY,
});

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Translation endpoint
app.post('/translate', async (req, res) => {
  try {
    const { text, sourceLocale, targetLocale } = req.body;

    if (!text || !targetLocale) {
      return res.status(400).json({ error: 'Text and targetLocale are required' });
    }

    const result = await lingoDotDev.localizeText(text, {
      sourceLocale: sourceLocale || 'en',
      targetLocale,
    });

    res.json({ translatedText: result });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});