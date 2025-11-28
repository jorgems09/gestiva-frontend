import './StatusBadge.css';

type StatusVariant = 'paid' | 'pending' | 'overdue' | 'cancelled' | 'active' | 'inactive' | 'success' | 'warning' | 'error' | 'info' | 'default';

interface StatusBadgeProps {
  status?: StatusVariant;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default' | 'paid' | 'pending' | 'overdue' | 'cancelled' | 'active' | 'inactive';
  label?: string;
  children?: React.ReactNode;
  className?: string;
}

const statusLabels: Record<string, string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  overdue: 'Vencido',
  cancelled: 'Anulado',
  active: 'Activo',
  inactive: 'Inactivo',
  success: 'En Stock',
  warning: 'Stock Bajo',
  error: 'Sin Stock',
  info: 'Info',
  default: 'Default',
};

export default function StatusBadge({
  status,
  variant,
  label,
  children,
  className = '',
}: StatusBadgeProps) {
  // Usar variant si está disponible, sino usar status
  const badgeVariant = variant || status || 'default';
  const displayLabel = children || label || statusLabels[badgeVariant] || badgeVariant;
  
  return (
    <span className={`status-badge status-badge-${badgeVariant} ${className}`}>
      {displayLabel}
    </span>
  );
}

