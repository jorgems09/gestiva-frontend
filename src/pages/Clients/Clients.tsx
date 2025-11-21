import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../../api/clients.api';
import Loading from '../../components/common/Loading';
import './Clients.css';

export default function Clients() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll().then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowForm(false);
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="clients-page">
      <div className="page-header">
        <h1>Clientes</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancelar' : 'Nuevo Cliente'}
        </button>
      </div>

      {showForm && (
        <ClientForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="clients-list">
        {clients && clients.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>{client.code}</td>
                  <td>{client.name}</td>
                  <td>{client.email || '-'}</td>
                  <td>{client.phone || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No hay clientes registrados</p>
        )}
      </div>
    </div>
  );
}

function ClientForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      code: formData.get('code'),
      name: formData.get('name'),
      email: formData.get('email') || undefined,
      phone: formData.get('phone') || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="client-form">
      <div className="form-group">
        <label>Código *</label>
        <input name="code" required />
      </div>
      <div className="form-group">
        <label>Nombre *</label>
        <input name="name" required />
      </div>
      <div className="form-group">
        <label>Email</label>
        <input name="email" type="email" />
      </div>
      <div className="form-group">
        <label>Teléfono</label>
        <input name="phone" />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary">
          Guardar
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}

