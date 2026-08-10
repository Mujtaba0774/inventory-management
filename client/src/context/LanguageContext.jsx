import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LanguageContext } from './languageContextValue';
import { DEFAULT_LANGUAGE, LANGUAGES, translations } from '../i18n/translations';
import {
  getTranslation,
  requestTranslation,
  subscribeToTranslations,
} from '../i18n/translateService';

const STORAGE_KEY = 'language';

const readStoredLanguage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && LANGUAGES[stored] ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

const resolveKey = (dictionary, key) => key
  .split('.')
  .reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), dictionary);

const interpolate = (template, values) => {
  if (!values) return template;

  return template.replace(/\{(\w+)\}/g, (match, name) => (
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match
  ));
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(readStoredLanguage);

  // Bumped whenever a batch of data translations resolves, so components that
  // called `td()` re-render with the newly cached Urdu text.
  const [translationVersion, setTranslationVersion] = useState(0);

  useEffect(() => subscribeToTranslations(() => {
    setTranslationVersion((current) => current + 1);
  }), []);

  const dir = LANGUAGES[language]?.dir ?? 'ltr';

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = dir;
    root.classList.toggle('rtl', dir === 'rtl');

    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Preference simply will not persist.
    }
  }, [language, dir]);

  const t = useCallback((key, values) => {
    const translated = resolveKey(translations[language], key)
      ?? resolveKey(translations[DEFAULT_LANGUAGE], key);

    if (typeof translated !== 'string') {
      // Surfacing the key beats rendering "undefined" when a string is missing.
      return key;
    }

    return interpolate(translated, values);
  }, [language]);

  // Translates stored record text (product names, vendor names, notes). Returns
  // the original until the live translation arrives, then the Urdu version.
  const td = useCallback((text) => {
    if (language === DEFAULT_LANGUAGE || typeof text !== 'string' || text.trim() === '') {
      return text;
    }

    const cached = getTranslation(text, language);

    if (cached !== undefined) {
      return cached;
    }

    requestTranslation(text, language);
    return text;
    // translationVersion is not read directly, but it must invalidate this
    // callback so cached results are picked up after a batch resolves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, translationVersion]);

  // Stored values drawn from a known vocabulary (movement reasons, transaction
  // types). Uses the dictionary when the value is listed, and live translation
  // otherwise, so an unexpected value is never rendered as a raw key.
  const tEnum = useCallback((namespace, value) => {
    if (typeof value !== 'string' || value.trim() === '') {
      return value;
    }

    const group = resolveKey(translations[language], namespace);
    const translated = group && typeof group === 'object' ? group[value] : undefined;

    return typeof translated === 'string' ? translated : td(value);
  }, [language, td]);

  const toggleLanguage = useCallback(() => {
    setLanguage((current) => (current === 'en' ? 'ur' : 'en'));
  }, []);

  const value = useMemo(() => ({
    language,
    setLanguage,
    toggleLanguage,
    t,
    td,
    tEnum,
    dir,
    isRTL: dir === 'rtl',
    isUrdu: language === 'ur',
    languages: LANGUAGES,
  }), [language, toggleLanguage, t, td, tEnum, dir]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
