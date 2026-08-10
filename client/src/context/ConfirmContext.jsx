import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ConfirmContext } from './confirmContextValue';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useLanguage } from '../hooks/useLanguage';

export const ConfirmProvider = ({ children }) => {
  const { t } = useLanguage();
  const resolverRef = useRef(null);
  // Left undefined so ConfirmDialog falls back to the active language's copy.
  const [dialogState, setDialogState] = useState({
    open: false,
    title: undefined,
    message: undefined,
    confirmLabel: undefined,
    cancelLabel: undefined,
  });

  const closeDialog = useCallback((result) => {
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }

    setDialogState((prev) => ({ ...prev, open: false }));
  }, []);

  const confirm = useCallback((options = {}) => {
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }

    const {
      title = t('confirm.defaultTitle'),
      message = t('confirm.defaultMessage'),
      confirmLabel = t('common.confirm'),
      cancelLabel = t('common.cancel'),
    } = options;

    setDialogState({
      open: true,
      title,
      message,
      confirmLabel,
      cancelLabel,
    });

    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, [t]);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        confirmLabel={dialogState.confirmLabel}
        cancelLabel={dialogState.cancelLabel}
        onCancel={() => closeDialog(false)}
        onConfirm={() => closeDialog(true)}
      />
    </ConfirmContext.Provider>
  );
};