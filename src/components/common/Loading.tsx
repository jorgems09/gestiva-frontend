import { SkeletonText } from './Skeleton';
import './Loading.css';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export default function Loading({ message = 'Cargando...', fullScreen = false }: LoadingProps) {
  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className="loading-spinner"></div>
        <p className="loading-message">{message}</p>
      </div>
    );
  }

  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="loading-skeleton-container">
      <SkeletonText lines={5} />
    </div>
  );
}

