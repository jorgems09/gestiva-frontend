import './Skeleton.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export default function Skeleton({
  width,
  height,
  borderRadius,
  className = '',
  variant = 'rectangular',
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1em' : variant === 'circular' ? width : '100%'),
    borderRadius:
      borderRadius ||
      (variant === 'circular' ? '50%' : variant === 'text' ? '4px' : '8px'),
  };

  const classes = `skeleton skeleton-${variant} ${className}`.trim();

  return <div className={classes} style={style} aria-label="Cargando..." />;
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`skeleton-text-container ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '60%' : '100%'}
          className="skeleton-text-line"
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`skeleton-card ${className}`}>
      <Skeleton variant="rectangular" height={200} />
      <div className="skeleton-card-content">
        <SkeletonText lines={2} />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
  );
}

