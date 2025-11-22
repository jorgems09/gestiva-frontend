import Chip from '../common/Chip';
import type { Client } from '../../types/client.types';
import './ClientCard.css';

interface ClientCardProps {
  client: Client;
  onClick?: () => void;
}

export default function ClientCard({ client, onClick }: ClientCardProps) {
  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (client.phone) {
      window.location.href = `tel:${client.phone}`;
    }
  };

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (client.email) {
      window.location.href = `mailto:${client.email}`;
    }
  };

  return (
    <div className="client-card" onClick={onClick}>
      <div className="client-card-header">
        <div className="client-card-avatar">
          {client.name.charAt(0).toUpperCase()}
        </div>
        <div className="client-card-info">
          <h3 className="client-card-name">{client.name}</h3>
          <span className="client-card-code">{client.code}</span>
        </div>
      </div>
      
      <div className="client-card-contact">
        {client.phone && (
          <a
            href={`tel:${client.phone}`}
            className="client-contact-item"
            onClick={handleCall}
            aria-label={`Llamar a ${client.name}`}
          >
            <span className="material-icons client-contact-icon">phone</span>
            <span className="client-contact-value">{client.phone}</span>
          </a>
        )}
        {client.email && (
          <a
            href={`mailto:${client.email}`}
            className="client-contact-item"
            onClick={handleEmail}
            aria-label={`Enviar email a ${client.name}`}
          >
            <span className="material-icons client-contact-icon">email</span>
            <span className="client-contact-value">{client.email}</span>
          </a>
        )}
      </div>
      
      <div className="client-card-footer">
        <Chip variant="primary" size="sm">
          Cliente
        </Chip>
      </div>
    </div>
  );
}

