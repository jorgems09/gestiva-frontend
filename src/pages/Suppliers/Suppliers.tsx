import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '../../api/suppliers.api';
import Loading from '../../components/common/Loading';
import StatusBadge from '../../components/common/StatusBadge';
import { useToast } from '../../hooks/useToast';
import type { Supplier } from '../../types/supplier.types';
import './Suppliers.css';

export default function Suppliers() {
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    city: '',
    paymentTerms: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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

  const handleExport = () => {
    showToast('Funcionalidad de exportación en desarrollo', 'info');
  };

  const handleClearFilters = () => {
    setFilters({ status: '', city: '', paymentTerms: '' });
    setSearchTerm('');
  };

  // Filtrar proveedores
  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];

    return suppliers.filter((supplier) => {
      // Búsqueda por texto
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesCode = supplier.code.toLowerCase().includes(searchLower);
        const matchesName = supplier.name.toLowerCase().includes(searchLower);
        const matchesEmail = supplier.email?.toLowerCase().includes(searchLower);
        const matchesPhone = supplier.phone?.includes(searchTerm);
        if (!matchesCode && !matchesName && !matchesEmail && !matchesPhone) {
          return false;
        }
      }

      // Por ahora no aplicamos filtros adicionales ya que no tenemos campos de ciudad, estado, etc.
      // Estos se pueden agregar cuando el modelo de supplier lo incluya

      return true;
    });
  }, [suppliers, searchTerm, filters]);

  // Paginación
  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSuppliers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSuppliers, currentPage]);

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="suppliers-page">
      <header className="suppliers-header">
        <div className="suppliers-header-content">
          <h1>Gestión de Proveedores</h1>
          <p className="suppliers-header-subtitle">Administra y consulta la información de tus proveedores.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-add-supplier">
          <span className="material-symbols-outlined">add</span>
          <span className="truncate">{showForm ? 'Cancelar' : 'Agregar Proveedor'}</span>
        </button>
      </header>

      {showForm && (
        <SupplierForm
          supplier={editingSupplier}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {!showForm && (
        <>
          <div className="suppliers-filters-section">
            <div className="suppliers-search-row">
              <div className="suppliers-search-wrapper">
                <label className="suppliers-search-label">
                  <div className="suppliers-search-container">
                    <div className="suppliers-search-icon">
                      <span className="material-symbols-outlined">search</span>
                    </div>
                    <input
                      type="text"
                      className="suppliers-search-input"
                      placeholder="Buscar por Nombre, Código o NIT..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </label>
              </div>
              <button onClick={handleExport} className="btn-export">
                <span className="material-symbols-outlined">download</span>
                <span className="truncate">Exportar</span>
              </button>
            </div>

            <div className="suppliers-chips-row">
              <button className="filter-chip">
                <p>Estado: {filters.status || 'Todos'}</p>
                <span className="material-symbols-outlined">expand_more</span>
              </button>
              <button className="filter-chip">
                <p>Ciudad</p>
                <span className="material-symbols-outlined">expand_more</span>
              </button>
              <button className="filter-chip">
                <p>Condiciones de Pago</p>
                <span className="material-symbols-outlined">expand_more</span>
              </button>
              <button onClick={handleClearFilters} className="filter-chip-clear">
                <span className="material-symbols-outlined">delete</span>
                <p>Borrar Filtros</p>
              </button>
            </div>
          </div>

          <div className="suppliers-table-wrapper">
            {filteredSuppliers.length > 0 ? (
              <>
                <div className="suppliers-table-container">
                  <div className="suppliers-table-overflow">
                    <table className="suppliers-table">
                      <thead>
                        <tr>
                          <th scope="col">NIT</th>
                          <th scope="col">Nombre</th>
                          <th scope="col">Contacto</th>
                          <th scope="col">Teléfono</th>
                          <th scope="col">Ciudad</th>
                          <th scope="col">Estado</th>
                          <th className="text-right" scope="col">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSuppliers.map((supplier) => (
                          <tr key={supplier.id}>
                            <td className="font-medium">{supplier.code}</td>
                            <td className="font-medium">{supplier.name}</td>
                            <td>{supplier.email || '-'}</td>
                            <td>{supplier.phone || '-'}</td>
                            <td>-</td>
                            <td>
                              <StatusBadge variant="success">Activo</StatusBadge>
                            </td>
                            <td className="text-right">
                              <div className="suppliers-table-actions">
                                <button
                                  onClick={() => handleEdit(supplier)}
                                  className="suppliers-action-btn"
                                  title="Editar"
                                >
                                  <span className="material-symbols-outlined">edit</span>
                                </button>
                                <button
                                  className="suppliers-action-btn"
                                  title="Ver detalles"
                                >
                                  <span className="material-symbols-outlined">visibility</span>
                                </button>
                                <button
                                  onClick={() => handleDelete(supplier)}
                                  className="suppliers-action-btn suppliers-action-btn-danger"
                                  title="Desactivar"
                                  disabled={deleteMutation.isPending}
                                >
                                  <span className="material-symbols-outlined">toggle_off</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <nav className="suppliers-pagination" aria-label="Table navigation">
                  <span className="suppliers-pagination-info">
                    Mostrando <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredSuppliers.length)}</span> de <span className="font-semibold">{filteredSuppliers.length}</span>
                  </span>
                  <ul className="suppliers-pagination-controls">
                    <li>
                      <button
                        className="suppliers-pagination-btn"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </button>
                    </li>
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage === 1) {
                        pageNum = i + 1;
                      } else if (currentPage === totalPages) {
                        pageNum = totalPages - 2 + i;
                      } else {
                        pageNum = currentPage - 1 + i;
                      }
                      return (
                        <li key={pageNum}>
                          <button
                            className={`suppliers-pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        </li>
                      );
                    })}
                    <li>
                      <button
                        className="suppliers-pagination-btn"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Siguiente
                      </button>
                    </li>
                  </ul>
                </nav>
              </>
            ) : (
              <div className="suppliers-empty">
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
        </>
      )}
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
    <form onSubmit={handleSubmit} className="supplier-form">
      <div className="form-group supplier-code-group">
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
