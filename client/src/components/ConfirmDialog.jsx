import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 shadow-2xl dark:shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-50 dark:from-red-950 to-red-100 dark:to-red-900 border-b border-red-200 dark:border-red-800 px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-red-500 p-3 flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-red-900 dark:text-red-200">{title}</h2>
              <p className="text-red-700 dark:text-red-400 text-sm mt-1">Please review this action carefully</p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Message */}
        <div className="px-6 py-6 bg-white dark:bg-slate-800">
          <p className="text-gray-700 dark:text-slate-300 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 bg-gray-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 btn-secondary py-1.5 rounded-lg"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 btn-danger py-1.5 rounded-lg"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};