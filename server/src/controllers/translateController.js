import dotenv from 'dotenv';

dotenv.config();

const SUPPORTED_LANGUAGES = new Set(['en', 'ur']);
const MAX_TEXTS_PER_REQUEST = 128;
const MAX_TEXT_LENGTH = 5000;
const CACHE_LIMIT = 5000;

const provider = (process.env.TRANSLATE_PROVIDER || 'google').toLowerCase();
const apiKey = process.env.TRANSLATE_API_KEY || '';
const libreUrl = process.env.TRANSLATE_API_URL || 'https://libretranslate.com/translate';

// Provider is only usable when it has the credentials it needs. Google always
// needs a key; LibreTranslate instances may be open, so a URL alone is enough.
const isConfigured = provider === 'google' ? Boolean(apiKey) : Boolean(libreUrl);

// Translations of the same product/vendor name repeat constantly across screens,
// so an in-memory cache keeps the vast majority of requests off the network.
const cache = new Map();

const cacheKey = (source, target, text) => `${source}:${target}:${text}`;

const readCache = (key) => {
  if (!cache.has(key)) {
    return undefined;
  }

  // Refresh recency so the eviction below drops genuinely cold entries.
  const value = cache.get(key);
  cache.delete(key);
  cache.set(key, value);
  return value;
};

const writeCache = (key, value) => {
  if (cache.has(key)) {
    cache.delete(key);
  }

  cache.set(key, value);

  while (cache.size > CACHE_LIMIT) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
};

const decodeHtmlEntities = (text) => text
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&');

const translateWithGoogle = async (texts, source, target) => {
  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: texts,
        source,
        target,
        format: 'text',
      }),
    }
  );

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Google Translate request failed (${response.status}): ${details.slice(0, 200)}`);
  }

  const payload = await response.json();
  const translations = payload?.data?.translations ?? [];

  return texts.map((text, index) => {
    const translated = translations[index]?.translatedText;
    return typeof translated === 'string' ? decodeHtmlEntities(translated) : text;
  });
};

const translateWithLibre = async (texts, source, target) => {
  const response = await fetch(libreUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: texts,
      source,
      target,
      format: 'text',
      ...(apiKey ? { api_key: apiKey } : {}),
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`LibreTranslate request failed (${response.status}): ${details.slice(0, 200)}`);
  }

  const payload = await response.json();
  const translated = payload?.translatedText;

  if (Array.isArray(translated)) {
    return texts.map((text, index) => (typeof translated[index] === 'string' ? translated[index] : text));
  }

  // A single-string response only makes sense for a single-item request.
  if (typeof translated === 'string' && texts.length === 1) {
    return [translated];
  }

  return texts;
};

const callProvider = (texts, source, target) => (
  provider === 'google'
    ? translateWithGoogle(texts, source, target)
    : translateWithLibre(texts, source, target)
);

export const translateTexts = async (req, res, next) => {
  try {
    const { texts, source = 'en', target } = req.body ?? {};

    if (!Array.isArray(texts)) {
      res.status(400).json({ message: 'texts must be an array of strings' });
      return;
    }

    if (texts.length > MAX_TEXTS_PER_REQUEST) {
      res.status(400).json({ message: `texts may contain at most ${MAX_TEXTS_PER_REQUEST} entries` });
      return;
    }

    if (!SUPPORTED_LANGUAGES.has(source) || !SUPPORTED_LANGUAGES.has(target)) {
      res.status(400).json({ message: 'source and target must be one of: en, ur' });
      return;
    }

    const normalized = texts.map((text) => (typeof text === 'string' ? text : ''));

    if (normalized.some((text) => text.length > MAX_TEXT_LENGTH)) {
      res.status(400).json({ message: `Each text may be at most ${MAX_TEXT_LENGTH} characters` });
      return;
    }

    // Same language in and out, or no provider credentials: echo the input so the
    // UI keeps working with its built-in dictionary and untouched data.
    if (source === target || !isConfigured) {
      res.status(200).json({
        translations: normalized,
        provider,
        configured: isConfigured,
      });
      return;
    }

    const results = new Array(normalized.length);
    const pendingTexts = [];
    const pendingIndexes = [];

    normalized.forEach((text, index) => {
      if (text.trim() === '') {
        results[index] = text;
        return;
      }

      const cached = readCache(cacheKey(source, target, text));

      if (cached !== undefined) {
        results[index] = cached;
        return;
      }

      pendingTexts.push(text);
      pendingIndexes.push(index);
    });

    if (pendingTexts.length === 0) {
      res.status(200).json({ translations: results, provider, configured: true, cached: true });
      return;
    }

    // De-duplicate before hitting the provider; repeated names are common.
    const uniqueTexts = [...new Set(pendingTexts)];
    const translatedUnique = await callProvider(uniqueTexts, source, target);
    const translationByText = new Map(
      uniqueTexts.map((text, index) => [text, translatedUnique[index] ?? text])
    );

    pendingIndexes.forEach((resultIndex, position) => {
      const sourceText = pendingTexts[position];
      const translation = translationByText.get(sourceText) ?? sourceText;
      results[resultIndex] = translation;
      writeCache(cacheKey(source, target, sourceText), translation);
    });

    res.status(200).json({ translations: results, provider, configured: true });
  } catch (error) {
    next(error);
  }
};

export const getTranslateStatus = (_req, res) => {
  res.status(200).json({
    configured: isConfigured,
    provider,
    languages: [...SUPPORTED_LANGUAGES],
  });
};
