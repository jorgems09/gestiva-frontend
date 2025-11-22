import { useState, useRef, useEffect } from 'react';
import './SearchableSelect.css';

interface Option {
  value: string;
  label: string;
  [key: string]: any;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  onAddNew?: () => void;
  addNewLabel?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  renderOption?: (option: Option) => React.ReactNode;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  onAddNew,
  addNewLabel = '+ Crear nuevo',
  className = '',
  disabled = false,
  required = false,
  renderOption,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => inputRef.current?.focus(), 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div
      ref={containerRef}
      className={`searchable-select ${className} ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}
    >
      <div
        className="searchable-select-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? '' : 'placeholder'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="searchable-select-arrow">▼</span>
      </div>

      {isOpen && (
        <div className="searchable-select-dropdown">
          <div className="searchable-select-search">
            <input
              ref={inputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="searchable-select-input"
            />
          </div>

          <div className="searchable-select-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`searchable-select-option ${
                    value === option.value ? 'selected' : ''
                  }`}
                  onClick={() => handleSelect(option.value)}
                >
                  {renderOption ? renderOption(option) : option.label}
                </div>
              ))
            ) : (
              <div className="searchable-select-empty">
                No se encontraron resultados
              </div>
            )}

            {onAddNew && (
              <div
                className="searchable-select-add-new"
                onClick={() => {
                  onAddNew();
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                {addNewLabel}
              </div>
            )}
          </div>
        </div>
      )}

      {required && !value && (
        <input
          type="text"
          required
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
          tabIndex={-1}
        />
      )}
    </div>
  );
}

