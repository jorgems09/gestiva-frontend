import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../../api/clients.api';
import { movementsApi } from '../../api/movements.api';
import Loading from '../../components/common/Loading';
import { useToast } from '../../hooks/useToast';
import type { Client, CreateClientDto } from '../../types/client.types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ProcessType } from '../../constants/process-types';
import './ClientsNew.css';

export default function ClientsNew() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Query para obtener todos los clientes
  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll().then((res) => res.data),
  });

  // Query para obtener movimientos del cliente seleccionado
  const { data: movements } = useQuery({
    queryKey: ['client-movements', selectedClient?.code],
    queryFn: () => movementsApi.getAll().then((res) => res.data),
    enabled: !!selectedClient,
  });

  // Filtrar movimientos del cliente seleccionado (VENTA o RECEIPT)
  const clientMovements = movements?.filter(
    (m) =>
      m.client?.code === selectedClient?.code &&
      (m.processType === ProcessType.SALE || m.processType === ProcessType.RECEIPT) &&
      m.status === 1
  ) || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowForm(false);
      showToast('Cliente creado exitosamente', 'success');
    },
    onError: (error: Error) => {
      showToast(`Error al crear cliente: ${error.message}`, 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateClientDto }) =>
      clientsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowForm(false);
      setEditingClient(null);
      showToast('Cliente actualizado exitosamente', 'success');
    },
    onError: (error: Error) => {
      showToast(`Error al actualizar cliente: ${error.message}`, 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: clientsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      if (selectedClient && deleteMutation.variables === selectedClient.id) {
        setSelectedClient(null);
      }
      showToast('Cliente eliminado exitosamente', 'success');
    },
    onError: (error: Error) => {
      showToast(`Error al eliminar cliente: ${error.message}`, 'error');
    },
  });

  // Filtrar clientes
  const filteredClients =
    clients?.filter(
      (client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm)
    ) || [];

  // Seleccionar primer cliente si no hay ninguno seleccionado
  if (!selectedClient && filteredClients.length > 0) {
    setSelectedClient(filteredClients[0]);
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDelete = (client: Client) => {
    if (window.confirm(`¿Está seguro de eliminar al cliente "${client.name}"?`)) {
      deleteMutation.mutate(client.id);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: CreateClientDto = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      email: (formData.get('email') as string) || undefined,
      phone: (formData.get('phone') as string) || undefined,
    };

    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="clients-new-page">
      {/* Header */}
      <div className="clients-new-header">
        <div>
          <h1>Gestión de Clientes</h1>
          <p className="subtitle">Administra y consulta la información de tus clientes</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingClient(null);
            setShowForm(true);
          }}
        >
          <span className="material-icons">add</span>
          Añadir Nuevo Cliente
        </button>
      </div>

      {/* Layout: Lista + Detalle */}
      <div className="clients-new-layout">
        {/* Lista de clientes (sidebar izquierdo) */}
        <aside className="clients-list-sidebar">
          <div className="clients-search-box">
            <div className="search-input-wrapper">
              <span className="material-icons search-icon">search</span>
              <input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="clients-list-scroll">
            {filteredClients.length === 0 ? (
              <div className="clients-list-empty">
                <span className="material-icons">person_off</span>
                <p>No se encontraron clientes</p>
              </div>
            ) : (
              filteredClients.map((client) => (
                <div
                  key={client.id}
                  className={`client-list-item ${
                    selectedClient?.id === client.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedClient(client)}
                >
                  <div className="client-item-avatar">
                    {getInitials(client.name)}
                  </div>
                  <div className="client-item-info">
                    <p className="client-item-name">{client.name}</p>
                    <p className="client-item-contact">
                      {client.email || client.phone || 'Sin contacto'}
                    </p>
                  </div>
                  <span className="material-icons">chevron_right</span>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Detalle del cliente (área principal) */}
        <main className="clients-detail-area">
          {showForm ? (
            /* Formulario de crear/editar */
            <div className="client-form-card">
              <div className="form-card-header">
                <h2>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                <button
                  className="btn-close"
                  onClick={() => {
                    setShowForm(false);
                    setEditingClient(null);
                  }}
                >
                  <span className="material-icons">close</span>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="client-form-content">
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Código <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="code"
                      defaultValue={editingClient?.code}
                      required
                      disabled={!!editingClient}
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      Nombre <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingClient?.name}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={editingClient?.email || ''}
                    />
                  </div>
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={editingClient?.phone || ''}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowForm(false);
                      setEditingClient(null);
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingClient ? 'Actualizar' : 'Guardar'} Cliente
                  </button>
                </div>
              </form>
            </div>
          ) : selectedClient ? (
            /* Vista de detalle del cliente */
            <>
              <div className="client-detail-card">
                <div className="client-detail-header">
                  <div className="client-detail-main">
                    <div className="client-detail-avatar">
                      {getInitials(selectedClient.name)}
                    </div>
                    <div>
                      <h2>{selectedClient.name}</h2>
                      <p className="client-detail-subtitle">
                        Código: {selectedClient.code}
                      </p>
                    </div>
                  </div>
                  <div className="client-detail-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleEdit(selectedClient)}
                    >
                      <span className="material-icons">edit</span>
                      Editar
                    </button>
                    <button
                      className="btn btn-danger-secondary"
                      onClick={() => handleDelete(selectedClient)}
                    >
                      <span className="material-icons">delete</span>
                    </button>
                  </div>
                </div>

                <div className="client-detail-grid">
                  <div className="detail-item">
                    <p className="detail-label">Email</p>
                    <p className="detail-value">
                      {selectedClient.email || 'No especificado'}
                    </p>
                  </div>
                  <div className="detail-item">
                    <p className="detail-label">Teléfono</p>
                    <p className="detail-value">
                      {selectedClient.phone || 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Historial de compras */}
              <div className="client-history-card">
                <div className="history-card-header">
                  <h3>Historial de Compras</h3>
                </div>
                <div className="history-table-container">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>ID Pedido</th>
                        <th>Tipo</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientMovements.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center">
                            No hay movimientos registrados
                          </td>
                        </tr>
                      ) : (
                        clientMovements.slice(0, 10).map((movement) => (
                          <tr key={movement.id}>
                            <td>{formatDate(movement.documentDate)}</td>
                            <td className="font-medium">{movement.consecutive}</td>
                            <td>
                              {movement.processType === ProcessType.SALE
                                ? 'Venta'
                                : 'Recibo'}
                            </td>
                            <td className="text-right font-medium">
                              {formatCurrency(movement.total)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* Estado vacío */
            <div className="clients-detail-empty">
              <span className="material-icons">person_outline</span>
              <p>Selecciona un cliente para ver sus detalles</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

