import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

export const Pagination = ({ currentPage, totalPages, onChange }) => {
  const { t } = useLanguage();

  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-600 dark:text-gray-300">
        {t('pagination.pageOf', { current: currentPage, total: totalPages })}
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onChange(Math.max(1, currentPage - 1))}
          className="px-3 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50"
          disabled={currentPage === 1}
        >
          {t('pagination.prev')}
        </button>

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`px-3 py-1 rounded-md text-sm ${p === currentPage ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
          className="px-3 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50"
          disabled={currentPage === totalPages}
        >
          {t('pagination.next')}
        </button>
      </div>
    </div>
  );
};

export default Pagination;
