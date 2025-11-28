import { useState, useRef, useEffect } from 'react';
import './FilterDropdown.css';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  options: FilterOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export default function FilterDropdown({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  label,
  className = '',
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

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

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`filter-dropdown ${className} ${isOpen ? 'open' : ''}`}>
      {label && <label className="filter-dropdown-label">{label}</label>}
      <div
        className="filter-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? '' : 'placeholder'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="filter-dropdown-arrow">▼</span>
      </div>

      {isOpen && (
        <div className="filter-dropdown-menu">
          <div
            className={`filter-dropdown-option ${!value ? 'selected' : ''}`}
            onClick={() => handleSelect('')}
          >
            Todos
          </div>
          {options.map((option) => (
            <div
              key={option.value}
              className={`filter-dropdown-option ${
                value === option.value ? 'selected' : ''
              }`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

