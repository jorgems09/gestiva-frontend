import { useEffect } from 'react';
import './Drawer.css';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: 'left' | 'right';
  title?: React.ReactNode;
}

export default function Drawer({
  isOpen,
  onClose,
  children,
  side = 'left',
  title,
}: DrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <div
          className={`drawer-backdrop ${isOpen ? 'open' : ''}`}
          onClick={onClose}
        />
      )}
      <div
        className={`drawer drawer-${side} ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="drawer-header">
            {typeof title === 'string' ? <h2>{title}</h2> : title}
            <button
              type="button"
              className="drawer-close"
              onClick={onClose}
              aria-label="Cerrar menú"
            >
              <span className="material-icons">close</span>
            </button>
          </div>
        )}
        <div className="drawer-content">{children}</div>
      </div>
    </>
  );
}

