import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export const LanguageSwitcher = () => {
  const { isUrdu, toggleLanguage, t } = useLanguage();

  // Show the language you would switch *to*, matching the theme toggle's icon logic.
  const targetLabel = isUrdu ? 'EN' : 'اردو';
  const title = isUrdu ? t('language.switchToEnglish') : t('language.switchToUrdu');

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center justify-center gap-1.5 h-10 px-2.5 rounded-lg transition-all duration-200 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
      title={title}
      aria-label={t('language.toggle')}
    >
      <Languages className="h-5 w-5 flex-shrink-0" />
      <span className="text-xs font-semibold leading-none">{targetLabel}</span>
    </button>
  );
};
