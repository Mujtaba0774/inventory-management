import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ConfirmContext } from './confirmContextValue';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const ConfirmProvider = ({ children }) => {
  const resolverRef = useRef(null);
  const [dialogState, setDialogState] = useState({
    open: false,
    title: 'Please confirm',
    message: 'Are you sure you want to continue?',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
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
      title = 'Please confirm',
      message = 'Are you sure you want to continue?',
      confirmLabel = 'Confirm',
      cancelLabel = 'Cancel',
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
  }, []);

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