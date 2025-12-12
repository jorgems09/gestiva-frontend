import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './SearchableSelect.css';

interface Option {
  value: string;
  label: string;
  description?: string;
  reference?: string;
  [key: string]: unknown;
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
  allowCustomValue?: boolean; // Permite ingresar valores que no están en la lista
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
  allowCustomValue = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((option) => {
    const searchLower = searchTerm.toLowerCase();
    // Buscar en label (siempre)
    const matchesLabel = option.label.toLowerCase().includes(searchLower);
    // Buscar en description si existe
    const matchesDescription = option.description?.toLowerCase().includes(searchLower) ?? false;
    // Buscar en reference si existe
    const matchesReference = option.reference?.toLowerCase().includes(searchLower) ?? false;
    return matchesLabel || matchesDescription || matchesReference;
  });

  // Calcular y actualizar la posición del dropdown
  const updateDropdownPosition = () => {
    if (triggerRef.current && isOpen) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      setDropdownStyle({
        position: 'absolute',
        top: `${rect.bottom + scrollTop + 4}px`,
        left: `${rect.left + scrollLeft}px`,
        width: `${Math.max(rect.width, 400)}px`,
        maxWidth: '600px',
        zIndex: 9999999,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      
      // Actualizar posición en scroll y resize
      const handleScroll = () => updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();
      
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
    // updateDropdownPosition está definido dentro del componente y se actualiza en cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.searchable-select-dropdown-portal')
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

  const dropdownContent = isOpen && (
    <div
      className="searchable-select-dropdown searchable-select-dropdown-portal"
      style={dropdownStyle}
    >
      <div className="searchable-select-search">
        <input
          ref={inputRef}
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (allowCustomValue && e.key === 'Enter' && searchTerm && !filteredOptions.find(opt => opt.value === searchTerm)) {
              e.preventDefault();
              onChange(searchTerm);
              setIsOpen(false);
              setSearchTerm('');
            }
          }}
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
            {allowCustomValue && searchTerm ? (
              <div
                className="searchable-select-option"
                onClick={() => {
                  onChange(searchTerm);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                style={{ fontStyle: 'italic', color: 'var(--color-primary)' }}
              >
                Usar "{searchTerm}" como valor personalizado
              </div>
            ) : (
              'No se encontraron resultados'
            )}
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
  );

  return (
    <div
      ref={containerRef}
      className={`searchable-select ${className} ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}
    >
      <div
        ref={triggerRef}
        className="searchable-select-trigger"
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className={selectedOption ? '' : 'placeholder'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="searchable-select-arrow">▼</span>
      </div>

      {/* Renderizar dropdown en document.body usando Portal */}
      {isOpen && createPortal(dropdownContent, document.body)}

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

