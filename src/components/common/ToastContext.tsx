import { createContext } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const ToastContext = createContext<{
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
} | undefined>(undefined);

export { ToastProvider } from './Toast';

