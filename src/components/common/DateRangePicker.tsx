import { useState, useRef, useEffect } from 'react';
import './DateRangePicker.css';

interface DateRangePickerProps {
  value?: { from: string; to: string } | null;
  onChange: (range: { from: string; to: string } | null) => void;
  placeholder?: string;
  className?: string;
}

export default function DateRangePicker({
  value,
  onChange,
  placeholder = 'Seleccionar rango...',
  className = '',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fromDate, setFromDate] = useState(value?.from || '');
  const [toDate, setToDate] = useState(value?.to || '');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleApply = () => {
    if (fromDate && toDate) {
      onChange({ from: fromDate, to: toDate });
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setFromDate('');
    setToDate('');
    onChange(null);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (value?.from && value?.to) {
      const from = new Date(value.from).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const to = new Date(value.to).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      return `${from} - ${to}`;
    }
    return placeholder;
  };

  return (
    <div ref={containerRef} className={`date-range-picker ${className} ${isOpen ? 'open' : ''}`}>
      <div
        className="date-range-picker-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? '' : 'placeholder'}>
          {getDisplayText()}
        </span>
        <span className="date-range-picker-arrow">▼</span>
      </div>

      {isOpen && (
        <div className="date-range-picker-menu">
          <div className="date-range-picker-inputs">
            <div className="date-range-picker-input-group">
              <label>Desde</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                max={toDate || undefined}
              />
            </div>
            <div className="date-range-picker-input-group">
              <label>Hasta</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate || undefined}
              />
            </div>
          </div>
          <div className="date-range-picker-actions">
            <button
              type="button"
              className="date-range-picker-clear"
              onClick={handleClear}
            >
              Limpiar
            </button>
            <button
              type="button"
              className="date-range-picker-apply"
              onClick={handleApply}
              disabled={!fromDate || !toDate}
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

