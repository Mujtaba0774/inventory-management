import React from 'react';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useNotification } from '../hooks/useNotification';
import { useLanguage } from '../hooks/useLanguage';

const stylesByType = {
  success: {
    card: 'toast-success',
    iconWrap: 'bg-green-200 text-green-700',
    title: 'text-green-900',
    message: 'text-green-800',
    icon: CheckCircle2,
    borderLeft: 'border-l-4 border-l-green-500'
  },
  error: {
    card: 'toast-error',
    iconWrap: 'bg-red-200 text-red-700',
    title: 'text-red-900',
    message: 'text-red-800',
    icon: XCircle,
    borderLeft: 'border-l-4 border-l-red-500'
  },
  warning: {
    card: 'toast-warning',
    iconWrap: 'bg-yellow-200 text-yellow-700',
    title: 'text-yellow-900', 
    message: 'text-yellow-800',
    icon: AlertCircle,
    borderLeft: 'border-l-4 border-l-yellow-500'
  },
  info: {
    card: 'toast-info',
    iconWrap: 'bg-primary-200 text-primary-700',
    title: 'text-primary-900',
    message: 'text-primary-800',
    icon: Info,
    borderLeft: 'border-l-4 border-l-primary-500'
  },
};

export const NotificationToast = () => {
  const { notifications, removeNotification } = useNotification();
  const { t } = useLanguage();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed ltr:right-4 rtl:left-4 top-4 z-[100] flex w-[min(92vw,420px)] flex-col gap-4">
      {notifications.map((item) => {
        const palette = stylesByType[item.type] ?? stylesByType.info;
        const Icon = palette.icon;

        return (
          <div
            key={item.id}
            className={`pointer-events-auto toast shadow-lg-soft rounded-xl p-4 border ${palette.card} ${palette.borderLeft} animate-slide-up`}
            role="alert"
            aria-live="polite"
            style={{
              animation: 'slideUp 0.3s ease-out'
            }}
          >
            <div className="flex items-start gap-4">
              <div className={`rounded-lg p-2 flex-shrink-0 ${palette.iconWrap}`}>
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                {item.title && (
                  <h4 className={`text-sm font-bold dark:text-white ${palette.title}`}>
                    {item.title}
                  </h4>
                )}
                <p className={`text-sm  dark:text-white  ${palette.message} ${item.title ? 'mt-1' : ''}`}>
                  {item.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeNotification(item.id)}
                className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 dark:text-gray-200 transition-all duration-200 hover:bg-black/10 hover:text-gray-600 active:scale-90"
                aria-label={t('notifications.close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};