import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '../../api/suppliers.api';
import Loading from '../../components/common/Loading';
import { useToast } from '../../hooks/useToast';
import type { Supplier } from '../../types/supplier.types';
import './Suppliers.css';

export default function Suppliers() {
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getAll().then((res) => res.data),
  });

  const { showToast } = useToast();

  const createMutation = useMutation({
    mutationFn: suppliersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setShowForm(false);
      showToast('Proveedor guardado exitosamente', 'success');
    },
    onError: (error: Error) => {
      showToast(`Error al guardar proveedor: ${error.message}`, 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: import('../../types/supplier.types').UpdateSupplierDto }) => suppliersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setShowForm(false);
      setEditingSupplier(null);
      showToast('Proveedor actualizado exitosamente', 'success');
    },
    onError: (error: Error) => {
      showToast(`Error al actualizar proveedor: ${error.message}`, 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: suppliersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      showToast('Proveedor eliminado exitosamente', 'success');
    },
    onError: (error: Error) => {
      showToast(`Error al eliminar proveedor: ${error.message}`, 'error');
    },
  });

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  const handleDelete = (supplier: Supplier) => {
    if (window.confirm(`¿Está seguro de eliminar al proveedor "${supplier.name}"?`)) {
      deleteMutation.mutate(supplier.id);
    }
  };

  const handleFormSubmit = (data: import('../../types/supplier.types').CreateSupplierDto) => {
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingSupplier(null);
  };

  const filteredSuppliers =
    suppliers?.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone?.includes(searchTerm)
    ) || [];

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="clients-page">
      <div className="page-header">
        <h1>Proveedores</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <span className="material-icons btn-icon">
            {showForm ? 'close' : 'business'}
          </span>
          {showForm ? 'Cancelar' : 'Nuevo Proveedor'}
        </button>
      </div>

      {showForm && (
        <SupplierForm
          supplier={editingSupplier}
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
        {filteredSuppliers.length > 0 ? (
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
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>
                      <span className="client-code">{supplier.code}</span>
                    </td>
                    <td>
                      <div className="client-name-cell">
                        <div className="client-avatar-small">
                          {supplier.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{supplier.name}</span>
                      </div>
                    </td>
                    <td>
                      {supplier.email ? (
                        <a href={`mailto:${supplier.email}`} className="client-email-link">
                          {supplier.email}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {supplier.phone ? (
                        <a href={`tel:${supplier.phone}`} className="client-phone-link">
                          {supplier.phone}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="btn-icon-edit"
                          title="Editar"
                        >
                          <span className="material-icons">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(supplier)}
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
        ) : (
          <div className="clients-empty">
            <p>
              {searchTerm
                ? 'No se encontraron proveedores'
                : 'No hay proveedores registrados'}
            </p>
            {!searchTerm && (
              <button onClick={() => setShowForm(true)} className="btn-primary">
                Crear primer proveedor
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SupplierForm({
  supplier,
  onSubmit,
  onCancel,
  isLoading = false,
}: {
  supplier?: Supplier | null;
  onSubmit: (data: import('../../types/supplier.types').CreateSupplierDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [code, setCode] = useState(supplier?.code || '');
  const [name, setName] = useState(supplier?.name || '');
  const [email, setEmail] = useState(supplier?.email || '');
  const [phone, setPhone] = useState(supplier?.phone || '');
  const [codeError, setCodeError] = useState('');
  const [nameError, setNameError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Supplier[]>([]);
  const codeInputRef = useRef<HTMLDivElement>(null);

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getAll().then((res) => res.data),
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
    if (code && suppliers) {
      const matches = suppliers.filter((s) =>
        s.code.toLowerCase().includes(code.toLowerCase()) ||
        s.name.toLowerCase().includes(code.toLowerCase())
      ).slice(0, 5); // Máximo 5 sugerencias
      
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);

      // Si hay coincidencia exacta, precargar datos
      const exactMatch = suppliers.find(
        (s) => s.code.toLowerCase() === code.toLowerCase()
      );
      if (exactMatch) {
        setName(exactMatch.name);
        setEmail(exactMatch.email || '');
        setPhone(exactMatch.phone || '');
      } else if (name && matches.length === 0) {
        // Si no hay coincidencia, limpiar campos precargados (para nuevo proveedor)
        // Pero solo si el usuario ha empezado a escribir el código desde cero
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [code, suppliers]);

  // Validación en tiempo real del código
  useEffect(() => {
    if (code && suppliers) {
      const existingSupplier = suppliers.find(
        (s) => s.code.toLowerCase() === code.toLowerCase()
      );
      if (existingSupplier) {
        setCodeError('');
      } else {
        setCodeError(''); // No error para códigos nuevos
      }
    } else {
      setCodeError('');
    }
  }, [code, suppliers]);

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
    if (name && !suppliers?.find((s) => s.code.toLowerCase() === value.toLowerCase())) {
      // Permitir que el usuario continúe editando
    }
  };

  const handleSelectSuggestion = (supplier: Supplier) => {
    setCode(supplier.code);
    setName(supplier.name);
    setEmail(supplier.email || '');
    setPhone(supplier.phone || '');
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

    // Verificar si el código ya existe (solo para nuevos proveedores)
    if (!supplier) {
      const existingSupplier = suppliers?.find(
        (s) => s.code.toLowerCase() === code.trim().toLowerCase()
      );
      if (existingSupplier) {
        setCodeError('Este código ya está registrado para otro proveedor');
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
          Código/NIT/ID Fiscal <span className="required">*</span>
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
            placeholder="Escriba el código o NIT del proveedor..."
            className={`code-input ${codeError ? 'input-error' : ''}`}
            autoFocus={!supplier}
            autoComplete="off"
            disabled={!!supplier}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="code-suggestions">
              {suggestions.map((supplier) => (
                <div
                  key={supplier.id}
                  className="code-suggestion-item"
                  onClick={() => handleSelectSuggestion(supplier)}
                >
                  <span className="suggestion-code">{supplier.code}</span>
                  <span className="suggestion-name">{supplier.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {codeError && <span className="error-message">{codeError}</span>}
        <small className="form-hint">
          {suggestions.length > 0
            ? 'Proveedor encontrado. Haga clic para cargar datos o continúe escribiendo para crear uno nuevo.'
            : code && 'Escriba el código para crear un nuevo proveedor o busque si ya existe'}
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
          {isLoading ? 'Guardando...' : supplier ? 'Actualizar Proveedor' : 'Guardar y Continuar'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={isLoading}>
          <span className="material-icons btn-icon">close</span>
          Cancelar
        </button>
      </div>
    </form>
  );
}

