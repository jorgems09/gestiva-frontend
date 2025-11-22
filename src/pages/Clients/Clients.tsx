import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../../api/clients.api';
import Loading from '../../components/common/Loading';
import ClientCard from '../../components/clients/ClientCard';
import { useToast } from '../../hooks/useToast';
import type { Client } from '../../types/client.types';
import './Clients.css';

export default function Clients() {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll().then((res) => res.data),
  });

  const { showToast } = useToast();

  const createMutation = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowForm(false);
      showToast('Cliente guardado exitosamente', 'success');
    },
    onError: (error: Error) => {
      showToast(`Error al guardar cliente: ${error.message}`, 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: import('../../types/client.types').UpdateClientDto }) => clientsApi.update(id, data),
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
      showToast('Cliente eliminado exitosamente', 'success');
    },
    onError: (error: Error) => {
      showToast(`Error al eliminar cliente: ${error.message}`, 'error');
    },
  });

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDelete = (client: Client) => {
    if (window.confirm(`¿Está seguro de eliminar al cliente "${client.name}"?`)) {
      deleteMutation.mutate(client.id);
    }
  };

  const handleFormSubmit = (data: import('../../types/client.types').CreateClientDto) => {
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingClient(null);
  };

  const filteredClients =
    clients?.filter(
      (client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm)
    ) || [];

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="clients-page">
      <div className="page-header">
        <h1>Clientes</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <span className="material-icons btn-icon">
            {showForm ? 'close' : 'person_add'}
          </span>
          {showForm ? 'Cancelar' : 'Nuevo Cliente'}
        </button>
      </div>

      {showForm && (
        <ClientForm
          client={editingClient}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {!showForm && (
        <div className="clients-search">
          <input
            type="text"
            placeholder="Buscar por nombre, código, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="clients-search-input"
          />
        </div>
      )}

      <div className="clients-list">
        {filteredClients.length > 0 ? (
          isMobile ? (
            <div className="clients-grid-mobile">
              {filteredClients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          ) : (
            <div className="clients-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id}>
                      <td>
                        <span className="client-code">{client.code}</span>
                      </td>
                      <td>
                        <div className="client-name-cell">
                          <div className="client-avatar-small">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{client.name}</span>
                        </div>
                      </td>
                      <td>
                        {client.email ? (
                          <a href={`mailto:${client.email}`} className="client-email-link">
                            {client.email}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {client.phone ? (
                          <a href={`tel:${client.phone}`} className="client-phone-link">
                            {client.phone}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            onClick={() => handleEdit(client)}
                            className="btn-icon-edit"
                            title="Editar"
                          >
                            <span className="material-icons">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(client)}
                            className="btn-icon-delete"
                            title="Eliminar"
                            disabled={deleteMutation.isPending}
                          >
                            <span className="material-icons">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="clients-empty">
            <p>
              {searchTerm
                ? 'No se encontraron clientes'
                : 'No hay clientes registrados'}
            </p>
            {!searchTerm && (
              <button onClick={() => setShowForm(true)} className="btn-primary">
                Crear primer cliente
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ClientForm({
  client,
  onSubmit,
  onCancel,
  isLoading = false,
}: {
  client?: Client | null;
  onSubmit: (data: import('../../types/client.types').CreateClientDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [code, setCode] = useState(client?.code || '');
  const [name, setName] = useState(client?.name || '');
  const [email, setEmail] = useState(client?.email || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [codeError, setCodeError] = useState('');
  const [nameError, setNameError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Client[]>([]);
  const codeInputRef = useRef<HTMLDivElement>(null);

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll().then((res) => res.data),
  });

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        codeInputRef.current &&
        !codeInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  // Búsqueda y sugerencias en tiempo real
  useEffect(() => {
    if (code && clients) {
      const matches = clients.filter((c) =>
        c.code.toLowerCase().includes(code.toLowerCase()) ||
        c.name.toLowerCase().includes(code.toLowerCase())
      ).slice(0, 5); // Máximo 5 sugerencias
      
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);

      // Si hay coincidencia exacta, precargar datos
      const exactMatch = clients.find(
        (c) => c.code.toLowerCase() === code.toLowerCase()
      );
      if (exactMatch) {
        setName(exactMatch.name);
        setEmail(exactMatch.email || '');
        setPhone(exactMatch.phone || '');
      } else if (name && matches.length === 0) {
        // Si no hay coincidencia, limpiar campos precargados (para nuevo cliente)
        // Pero solo si el usuario ha empezado a escribir el código desde cero
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [code, clients]);

  // Validación en tiempo real del código
  useEffect(() => {
    if (code && clients) {
      const existingClient = clients.find(
        (c) => c.code.toLowerCase() === code.toLowerCase()
      );
      if (existingClient) {
        setCodeError('');
      } else {
        setCodeError(''); // No error para códigos nuevos
      }
    } else {
      setCodeError('');
    }
  }, [code, clients]);

  // Validación en tiempo real del nombre
  useEffect(() => {
    if (name && name.length < 2) {
      setNameError('El nombre debe tener al menos 2 caracteres');
    } else {
      setNameError('');
    }
  }, [name]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCode(value);
    setCodeError('');
    // Si el código cambia manualmente, limpiar datos precargados
    if (name && !clients?.find((c) => c.code.toLowerCase() === value.toLowerCase())) {
      // Permitir que el usuario continúe editando
    }
  };

  const handleSelectSuggestion = (client: Client) => {
    setCode(client.code);
    setName(client.name);
    setEmail(client.email || '');
    setPhone(client.phone || '');
    setShowSuggestions(false);
    setCodeError('');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validaciones finales
    if (!code.trim()) {
      setCodeError('El código es obligatorio');
      return;
    }
    if (!name.trim()) {
      setNameError('El nombre es obligatorio');
      return;
    }
    if (name.trim().length < 2) {
      setNameError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    // Verificar si el código ya existe (solo para nuevos clientes)
    if (!client) {
      const existingClient = clients?.find(
        (c) => c.code.toLowerCase() === code.trim().toLowerCase()
      );
      if (existingClient) {
        setCodeError('Este código ya está registrado para otro cliente');
        return;
      }
    }

    onSubmit({
      code: code.trim(),
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="client-form client-form-speed">
      <div className="form-group client-code-group">
        <label>
          Código/DNI/ID Fiscal <span className="required">*</span>
        </label>
        <div className="code-input-wrapper" ref={codeInputRef}>
          <input
            type="text"
            value={code}
            onChange={handleCodeChange}
            onFocus={() => {
              if (code && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder="Escriba el código o DNI del cliente..."
            className={`code-input ${codeError ? 'input-error' : ''}`}
            autoFocus={!client}
            autoComplete="off"
            disabled={!!client}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="code-suggestions">
              {suggestions.map((client) => (
                <div
                  key={client.id}
                  className="code-suggestion-item"
                  onClick={() => handleSelectSuggestion(client)}
                >
                  <span className="suggestion-code">{client.code}</span>
                  <span className="suggestion-name">{client.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {codeError && <span className="error-message">{codeError}</span>}
        <small className="form-hint">
          {suggestions.length > 0
            ? 'Cliente encontrado. Haga clic para cargar datos o continúe escribiendo para crear uno nuevo.'
            : code && 'Escriba el código para crear un nuevo cliente o busque si ya existe'}
        </small>
      </div>

      <div className="form-group">
        <label>
          Nombre <span className="required">*</span>
        </label>
        <input
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameError('');
          }}
          required
          className={nameError ? 'input-error' : ''}
          autoFocus={!code}
        />
        {nameError && <span className="error-message">{nameError}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Email</label>
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="opcional"
          />
        </div>
        <div className="form-group">
          <label>Teléfono</label>
          <input
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="opcional"
          />
        </div>
      </div>

      <div className="form-actions form-actions-fixed">
        <button type="submit" className="btn-primary btn-primary-large" disabled={isLoading}>
          <span className="material-icons btn-icon">
            {isLoading ? 'hourglass_empty' : 'save'}
          </span>
          {isLoading ? 'Guardando...' : client ? 'Actualizar Cliente' : 'Guardar y Continuar'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={isLoading}>
          <span className="material-icons btn-icon">close</span>
          Cancelar
        </button>
      </div>
    </form>
  );
}

