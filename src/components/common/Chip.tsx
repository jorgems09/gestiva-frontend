import './Chip.css';

interface ChipProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export default function Chip({
  children,
  variant = 'default',
  size = 'md',
  onClick,
  className = '',
}: ChipProps) {
  const classes = `chip chip-${variant} chip-${size} ${onClick ? 'chip-clickable' : ''} ${className}`.trim();
  
  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick}>
        {children}
      </button>
    );
  }

  return <span className={classes}>{children}</span>;
}

