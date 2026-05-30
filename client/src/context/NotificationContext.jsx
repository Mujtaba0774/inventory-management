import React, { useCallback, useMemo, useState } from 'react';
import { NotificationContext } from './notificationContextValue';

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showNotification = useCallback(
    ({ type = 'info', title, message, duration = 3500 }) => {
      const id = `${Date.now()}-${Math.random()}`;

      setNotifications((prev) => [
        ...prev,
        {
          id,
          type,
          title,
          message,
        },
      ]);

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }

      return id;
    },
    [removeNotification],
  );

  const value = useMemo(
    () => ({ notifications, showNotification, removeNotification }),
    [notifications, showNotification, removeNotification],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};