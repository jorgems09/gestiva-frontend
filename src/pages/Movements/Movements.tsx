import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { movementsApi } from '../../api/movements.api';
import { clientsApi } from '../../api/clients.api';
import { suppliersApi } from '../../api/suppliers.api';
import { productsApi } from '../../api/products.api';
import { reportsApi } from '../../api/reports.api';
import Loading from '../../components/common/Loading';
import SearchableSelect from '../../components/common/SearchableSelect';
import FilterDropdown from '../../components/common/FilterDropdown';
import DateRangePicker from '../../components/common/DateRangePicker';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import { useToast } from '../../hooks/useToast';
import { useBusinessInfoContext } from '../../contexts/BusinessInfoContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ProcessType, PROCESS_TYPE_LABELS } from '../../constants/process-types';
import type { CreateMovementDto, MovementDetail, PaymentDetail, RelatedAccountDto, MovementHeader } from '../../types/movement.types';
import './Movements.css';

export default function Movements() {
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<MovementHeader | null>(null);
  const [filters, setFilters] = useState({
    processType: '',
    dateRange: null as { from: string; to: string } | null,
    thirdParty: '',
    status: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();
  const { businessInfo } = useBusinessInfoContext();

  // Escuchar evento del botón del sidebar
  useEffect(() => {
    const handleOpenForm = () => {
      setShowForm(true);
    };
    window.addEventListener('open-movement-form', handleOpenForm);
    return () => window.removeEventListener('open-movement-form', handleOpenForm);
  }, []);

  const { data: movements, isLoading } = useQuery({
    queryKey: ['movements'],
    queryFn: () => movementsApi.getAll().then((res) => res.data),
  });

  const { showToast } = useToast();

  const createMutation = useMutation({
    mutationFn: movementsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      setShowForm(false);
      showToast('Movimiento registrado exitosamente', 'success');
    },
    onError: (error: Error) => {
      console.error('Error al crear movimiento:', error);
      showToast(`Error al crear movimiento: ${error.message}`, 'error');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: movementsApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      showToast('Movimiento anulado exitosamente', 'success');
    },
    onError: (error: Error) => {
      console.error('Error al anular movimiento:', error);
      showToast(`Error al anular movimiento: ${error.message}`, 'error');
    },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll().then((res) => res.data),
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getAll().then((res) => res.data),
  });

  const handleCancel = (movement: MovementHeader) => {
    const isAnulacion = movement.consecutive?.startsWith('ANL-');
    const isAnulado = movement.status === 0;
    
    if (isAnulacion) {
      showToast('No se puede anular un movimiento de anulación', 'error');
      return;
    }
    
    if (isAnulado) {
      showToast('Este movimiento ya está anulado', 'error');
      return;
    }

    if (
      window.confirm(
        `¿Está seguro de anular el movimiento ${movement.consecutive}?\n\nEsta acción revertirá todos los efectos del movimiento (inventario, cuentas por cobrar/pagar, ajustes bancarios).`
      )
    ) {
      cancelMutation.mutate(movement.id);
    }
  };

  // Función para determinar el estado de pago
  const getPaymentStatus = (movement: MovementHeader): 'paid' | 'pending' | 'overdue' | 'cancelled' => {
    if (movement.status === 0 || movement.consecutive?.startsWith('ANL-')) {
      return 'cancelled';
    }
    
    // Para VENTAS: Verificar el estado de las cuentas por cobrar
    if (movement.processType === ProcessType.SALE && movement.receivables && movement.receivables.length > 0) {
      const hasActiveReceivables = movement.receivables.some(r => 
        r.status === 'PENDIENTE' && Number(r.balance) > 0
      );
      
      if (hasActiveReceivables) {
        return 'pending';  // Hay deuda activa del cliente
      } else {
        return 'paid';  // Todas las cuentas por cobrar han sido canceladas
      }
    }
    
    // Para COMPRAS: Verificar el estado de las cuentas por pagar
    if (movement.processType === ProcessType.PURCHASE && movement.payables && movement.payables.length > 0) {
      const hasActivePayables = movement.payables.some(p => 
        p.status === 'PENDIENTE' && Number(p.balance) > 0
      );
      
      if (hasActivePayables) {
        return 'pending';  // Hay deuda activa con el proveedor
      } else {
        return 'paid';  // Todas las cuentas por pagar han sido canceladas
      }
    }
    
    // Para otros tipos de movimientos: usar la lógica de pagos directos
    const paymentsTotal = movement.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const movementTotal = Number(movement.total);
    
    if (paymentsTotal >= movementTotal) {
      return 'paid';
    }
    
    return 'pending';
  };

  // Filtrar y buscar movimientos
  const filteredMovements = useMemo(() => {
    if (!movements) return [];

    const filtered = movements.filter((movement) => {
      // Filtro por tipo
      if (filters.processType && movement.processType !== filters.processType) {
        return false;
      }

      // Filtro por rango de fechas
      if (filters.dateRange) {
        const movementDate = new Date(movement.documentDate);
        const fromDate = new Date(filters.dateRange.from);
        const toDate = new Date(filters.dateRange.to);
        if (movementDate < fromDate || movementDate > toDate) {
          return false;
        }
      }

      // Filtro por tercero (cliente/proveedor)
      if (filters.thirdParty) {
        const clientMatch = movement.client?.code === filters.thirdParty;
        const supplierMatch = movement.supplier?.code === filters.thirdParty;
        if (!clientMatch && !supplierMatch) {
          return false;
        }
      }

      // Filtro por estado
      if (filters.status) {
        const status = getPaymentStatus(movement);
        if (status !== filters.status) {
          return false;
        }
      }

      // Búsqueda por consecutivo o palabra clave
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesConsecutive = movement.consecutive?.toLowerCase().includes(searchLower);
        const matchesClient = movement.client?.name?.toLowerCase().includes(searchLower);
        const matchesSupplier = movement.supplier?.name?.toLowerCase().includes(searchLower);
        const matchesType = PROCESS_TYPE_LABELS[movement.processType as ProcessType]?.toLowerCase().includes(searchLower);
        
        if (!matchesConsecutive && !matchesClient && !matchesSupplier && !matchesType) {
          return false;
        }
      }

      return true;
    });

    return filtered;
  }, [movements, filters, searchTerm]);

  // Paginación
  const paginatedMovements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMovements.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMovements, currentPage]);

  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);

  const handleClearFilters = () => {
    setFilters({
      processType: '',
      dateRange: null,
      thirdParty: '',
      status: '',
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
  };

  const handleExport = () => {
    showToast('Funcionalidad de exportación en desarrollo', 'info');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleViewMovement = (movement: MovementHeader) => {
    setSelectedMovement(movement);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedMovement(null);
  };

  if (isLoading) {
    return <Loading />;
  }

  // Opciones para filtros
  const processTypeOptions = Object.entries(PROCESS_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const thirdPartyOptions = [
    ...(clients?.map((c) => ({ value: c.code, label: `${c.code} - ${c.name}` })) || []),
    ...(suppliers?.map((s) => ({ value: s.code, label: `${s.code} - ${s.name}` })) || []),
  ];

  const statusOptions = [
    { value: 'paid', label: 'Pagado' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'overdue', label: 'Vencido' },
    { value: 'cancelled', label: 'Anulado' },
  ];

  return (
    <div className="movements-page">
      <div className="page-header-new">
        <div className="page-header-content">
          <h1>Gestión de Movimientos</h1>
          <p className="page-subtitle">Registra y gestiona todas tus transacciones.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <span className="material-icons btn-icon">
            {showForm ? 'close' : 'add'}
          </span>
          {showForm ? 'Cancelar' : 'Nuevo Movimiento'}
        </button>
      </div>

      {/* Modal de Detalle */}
      {showDetail && selectedMovement && (
        <div className="modal-overlay" onClick={handleCloseDetail}>
          <div className="modal-content movement-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Detalle del Movimiento</h2>
                <p className="modal-subtitle">{selectedMovement.consecutive}</p>
              </div>
              <button className="btn-close-modal" onClick={handleCloseDetail}>
                <span className="material-icons">close</span>
              </button>
            </div>

            {/* Header del negocio - Solo visible en impresión */}
            <div className="pos-header">
              <h1>{businessInfo.name}</h1>
              <p>NIT: {businessInfo.nit}</p>
              <p>Dirección: {businessInfo.address}</p>
              <p>Tel: {businessInfo.phone}</p>
              {businessInfo.email && <p>Email: {businessInfo.email}</p>}
              {businessInfo.website && <p>Web: {businessInfo.website}</p>}
              <div className="pos-separator">━━━━━━━━━━━━━━━━━━━━</div>
              <p className="modal-subtitle">{selectedMovement.consecutive}</p>
              <div className="pos-separator">━━━━━━━━━━━━━━━━━━━━</div>
            </div>

            <div className="modal-body">
              {/* Información General */}
              <div className="detail-section">
                <h3>Información General</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Consecutivo:</span>
                    <span className="detail-value">{selectedMovement.consecutive}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Tipo de Proceso:</span>
                    <span className="detail-value">
                      {PROCESS_TYPE_LABELS[selectedMovement.processType as ProcessType]}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Fecha:</span>
                    <span className="detail-value">{formatDate(selectedMovement.documentDate)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Estado:</span>
                    <span className="detail-value">
                      <StatusBadge
                        status={getPaymentStatus(selectedMovement)}
                      />
                    </span>
                  </div>
                  {(selectedMovement.processType === ProcessType.SALE ||
                    selectedMovement.processType === ProcessType.RECEIPT) &&
                    selectedMovement.client && (
                      <div className="detail-item">
                        <span className="detail-label">Cliente:</span>
                        <span className="detail-value">
                          {selectedMovement.client.code} - {selectedMovement.client.name}
                        </span>
                      </div>
                    )}
                  {(selectedMovement.processType === ProcessType.PURCHASE ||
                    selectedMovement.processType === ProcessType.EXPENSE) &&
                    (selectedMovement.supplier || selectedMovement.supplierName) && (
                      <div className="detail-item">
                        <span className="detail-label">Proveedor:</span>
                        <span className="detail-value">
                          {selectedMovement.supplier
                            ? `${selectedMovement.supplier.code} - ${selectedMovement.supplier.name}`
                            : selectedMovement.supplierName}
                        </span>
                      </div>
                    )}
                  {selectedMovement.expenseCategory && (
                    <div className="detail-item">
                      <span className="detail-label">Categoría de Gasto:</span>
                      <span className="detail-value">{selectedMovement.expenseCategory}</span>
                    </div>
                  )}
                  {selectedMovement.expenseCategory === 'ENVIO' && (
                    <>
                      {selectedMovement.originLocation && (
                        <div className="detail-item">
                          <span className="detail-label">Origen:</span>
                          <span className="detail-value">{selectedMovement.originLocation}</span>
                        </div>
                      )}
                      {selectedMovement.destinationLocation && (
                        <div className="detail-item">
                          <span className="detail-label">Destino:</span>
                          <span className="detail-value">{selectedMovement.destinationLocation}</span>
                        </div>
                      )}
                      {selectedMovement.relatedMovementId && (
                        <div className="detail-item">
                          <span className="detail-label">Movimiento Relacionado:</span>
                          <span className="detail-value">ID: {selectedMovement.relatedMovementId}</span>
                        </div>
                      )}
                    </>
                  )}
                  {selectedMovement.notes && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Notas:</span>
                      <span className="detail-value">{selectedMovement.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalles de Productos */}
              {selectedMovement.details && selectedMovement.details.length > 0 && (
                <div className="detail-section">
                  <h3>Productos / Servicios</h3>
                  <div className="detail-table-container">
                    <table className="detail-table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th className="text-right">Cantidad</th>
                          <th className="text-right">Precio Unit.</th>
                          <th className="text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMovement.details.map((detail, index) => (
                          <tr key={index}>
                            <td>
                              <div className="product-detail">
                                <span className="product-ref">{detail.productReference}</span>
                                <span className="product-desc">{detail.description}</span>
                              </div>
                            </td>
                            <td className="text-right">{detail.quantity}</td>
                            <td className="text-right">{formatCurrency(detail.unitPrice)}</td>
                            <td className="text-right font-semibold">
                              {formatCurrency(detail.quantity * detail.unitPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pagos */}
              {selectedMovement.payments && selectedMovement.payments.length > 0 && (
                <div className="detail-section">
                  <h3>Pagos</h3>
                  <div className="detail-table-container">
                    <table className="detail-table">
                      <thead>
                        <tr>
                          <th>Método de Pago</th>
                          <th className="text-right">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMovement.payments.map((payment, index) => (
                          <tr key={index}>
                            <td>{payment.method}</td>
                            <td className="text-right font-semibold">
                              {formatCurrency(payment.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Totales */}
              <div className="detail-section">
                <h3>Totales</h3>
                <div className="totals-grid">
                  <div className="total-item">
                    <span className="total-label">Subtotal:</span>
                    <span className="total-value">{formatCurrency(selectedMovement.subtotal)}</span>
                  </div>
                  {selectedMovement.taxTotal > 0 && (
                    <div className="total-item">
                      <span className="total-label">Impuestos:</span>
                      <span className="total-value">{formatCurrency(selectedMovement.taxTotal)}</span>
                    </div>
                  )}
                  {selectedMovement.retentionTotal > 0 && (
                    <div className="total-item">
                      <span className="total-label">Retención:</span>
                      <span className="total-value text-red">
                        -{formatCurrency(selectedMovement.retentionTotal)}
                      </span>
                    </div>
                  )}
                  {selectedMovement.deductionTotal > 0 && (
                    <div className="total-item">
                      <span className="total-label">Deducción:</span>
                      <span className="total-value text-red">
                        -{formatCurrency(selectedMovement.deductionTotal)}
                      </span>
                    </div>
                  )}
                  <div className="total-item total-final">
                    <span className="total-label">Total:</span>
                    <span className="total-value">{formatCurrency(selectedMovement.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={handleCloseDetail}>
                Cerrar
              </button>
              <button className="btn-primary" onClick={() => window.print()}>
                <span className="material-icons btn-icon">print</span>
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <MovementForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
          isLoading={createMutation.isPending}
        />
      )}

      {!showForm && (
        <>
          <div className="movements-filters">
            <div className="filters-row">
              <FilterDropdown
                options={processTypeOptions}
                value={filters.processType}
                onChange={(value) => setFilters({ ...filters, processType: value })}
                placeholder="Tipo de Movimiento"
              />
              <DateRangePicker
                value={filters.dateRange || undefined}
                onChange={(range) => setFilters({ ...filters, dateRange: range || null })}
                placeholder="Rango de Fechas"
              />
              <SearchableSelect
                options={thirdPartyOptions}
                value={filters.thirdParty}
                onChange={(value) => setFilters({ ...filters, thirdParty: value })}
                placeholder="Cliente/Proveedor"
                searchPlaceholder="Buscar cliente o proveedor..."
              />
              <FilterDropdown
                options={statusOptions}
                value={filters.status}
                onChange={(value) => setFilters({ ...filters, status: value })}
                placeholder="Estado"
              />
            </div>
            <div className="search-row">
              <div className="search-input-wrapper">
                <div className="search-icon">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Buscar por Consecutivo o palabra clave..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-actions">
                <button className="btn-secondary" onClick={handleClearFilters}>
                  Limpiar
                </button>
                <button className="btn-primary" onClick={handleApplyFilters}>
                  <span className="material-icons btn-icon">filter_list</span>
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </div>

          <div className="movements-list">
            <div className="movements-list-header">
              <h3>Movimientos Recientes</h3>
              <div className="movements-list-actions">
                <button className="btn-icon-action" onClick={handleExport} title="Exportar">
                  <span className="material-icons">arrow_upward</span>
                </button>
                <button className="btn-icon-action" onClick={handlePrint} title="Imprimir">
                  <span className="material-icons">description</span>
                </button>
              </div>
            </div>
            {filteredMovements.length > 0 ? (
              <>
                <table className="data-table movements-table-new">
                  <thead>
                    <tr>
                      <th>CONSECUTIVO</th>
                      <th>FECHA</th>
                      <th>TIPO</th>
                      <th>CLIENTE/PROVEEDOR</th>
                      <th>TOTAL</th>
                      <th>ESTADO</th>
                      <th>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMovements.map((movement) => {
                      const paymentStatus = getPaymentStatus(movement);
                      const thirdPartyName =
                        movement.processType === ProcessType.PURCHASE ||
                        movement.processType === ProcessType.EXPENSE
                          ? movement.supplier?.name || movement.supplierName || '-'
                          : movement.processType === ProcessType.SALE ||
                            movement.processType === ProcessType.RECEIPT
                          ? movement.client?.name || '-'
                          : movement.client?.name || movement.supplier?.name || movement.supplierName || '-';

                      return (
                        <tr key={movement.id}>
                          <td>
                            <strong>{movement.consecutive}</strong>
                          </td>
                          <td>{formatDate(movement.documentDate)}</td>
                          <td>{PROCESS_TYPE_LABELS[movement.processType as ProcessType] || movement.processType}</td>
                          <td>{thirdPartyName}</td>
                          <td>
                            <strong>{formatCurrency(movement.total)}</strong>
                          </td>
                          <td>
                            <StatusBadge status={paymentStatus} />
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn-link-action"
                                onClick={() => handleViewMovement(movement)}
                                title="Ver detalles"
                              >
                                Ver
                              </button>
                              {paymentStatus !== 'cancelled' && !movement.consecutive?.startsWith('ANL-') && (
                                <button
                                  onClick={() => handleCancel(movement)}
                                  className="btn-icon-cancel"
                                  title="Anular movimiento"
                                  disabled={cancelMutation.isPending}
                                >
                                  <span className="material-icons">block</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredMovements.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </>
            ) : (
              <div className="empty-state">
                <p>
                  {searchTerm || Object.values(filters).some((v) => v !== '' && v !== null)
                    ? 'No se encontraron movimientos con los filtros aplicados'
                    : 'No hay movimientos registrados'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MovementForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: {
  onSubmit: (data: CreateMovementDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [processType, setProcessType] = useState<ProcessType>(ProcessType.SALE);
  // Obtener fecha local sin problemas de zona horaria
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [documentDate, setDocumentDate] = useState(getLocalDateString());
  const [clientCode, setClientCode] = useState('');
  const [clientName, setClientName] = useState(''); // Para crear cliente nuevo
  const [clientEmail, setClientEmail] = useState(''); // Para crear cliente nuevo
  const [clientPhone, setClientPhone] = useState(''); // Para crear cliente nuevo
  const [isNewClient, setIsNewClient] = useState(false); // Flag para indicar si es cliente nuevo
  const [supplierCode, setSupplierCode] = useState('');
  const [notes, setNotes] = useState('');
  const [retentionRate, setRetentionRate] = useState<number>(0);
  const [deductionRate, setDeductionRate] = useState<number>(0);
  const [expenseCategory, setExpenseCategory] = useState<string>('');
  const [originLocation, setOriginLocation] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');
  const [relatedMovementId, setRelatedMovementId] = useState<number | undefined>(undefined);
  const [details, setDetails] = useState<MovementDetail[]>([
      {
        productReference: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 0, // Valor por defecto: 0%
      },
  ]);
  const [newProducts, setNewProducts] = useState<Set<number>>(new Set()); // Índices de productos nuevos
  const [payments, setPayments] = useState<PaymentDetail[]>([
    { method: 'EFECTIVO', amount: 0, isCredit: false },
  ]);
  const [paymentInputValues, setPaymentInputValues] = useState<{ [key: number]: string }>({});
  const [selectedReceivables, setSelectedReceivables] = useState<RelatedAccountDto[]>([]);

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll().then((res) => res.data),
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getAll().then((res) => res.data),
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll().then((res) => res.data),
  });

  // Cargar cuentas por cobrar cuando se selecciona un cliente y es RECEIPT
  const { data: receivablesData, isLoading: isLoadingReceivables } = useQuery({
    queryKey: ['receivables', clientCode],
    queryFn: () => reportsApi.receivables(clientCode).then((res) => res.data),
    enabled: processType === ProcessType.RECEIPT && !!clientCode,
  });

  const calculateTotals = () => {
    // Para RECEIPT, el total es la suma de las cuentas seleccionadas
    if (processType === ProcessType.RECEIPT) {
      const total = selectedReceivables.reduce((sum, r) => sum + r.value, 0);
      return { subtotal: 0, taxTotal: 0, retentionTotal: 0, deductionTotal: 0, total };
    }

    // Para EXPENSE con categoría ENVIO, el total viene de los pagos
    if (processType === ProcessType.EXPENSE && expenseCategory === 'ENVIO') {
      const total = payments.reduce((sum, p) => sum + p.amount, 0);
      return { subtotal: 0, taxTotal: 0, retentionTotal: 0, deductionTotal: 0, total };
    }

    let subtotal = 0;
    let taxTotal = 0;
    let retentionTotal = 0;
    let deductionTotal = 0;

    details.forEach((detail) => {
      const baseAmount = detail.quantity * detail.unitPrice;
      const discountRate = detail.discountRate || 0;
      const discounted = baseAmount * (1 - discountRate / 100);
      // Si taxRate es undefined, usar 0% (default); si es 0, aplicar 0% (sin IVA)
      const taxRateValue = detail.taxRate !== undefined ? detail.taxRate : 0;
      const taxRate = taxRateValue / 100;
      const taxAmount = discounted * taxRate;
      subtotal += discounted;
      taxTotal += taxAmount;

      // Para compras, aplicar retenciones y deducciones según configuración
      // Usar el valor configurado (0 por defecto)
      if (processType === ProcessType.PURCHASE) {
        const finalRetentionRate = retentionRate || 0;
        const finalDeductionRate = deductionRate || 0;
        
        if (finalRetentionRate > 0) {
          const retention = discounted * (finalRetentionRate / 100);
          retentionTotal += retention;
        }
        if (finalDeductionRate > 0) {
          const deduction = discounted * (finalDeductionRate / 100);
          deductionTotal += deduction;
        }
      }
    });

    // El total se calcula restando retenciones y deducciones (igual que el backend)
    const total = subtotal + taxTotal - deductionTotal - retentionTotal;
    return { subtotal, taxTotal, retentionTotal, deductionTotal, total };
  };

  const { subtotal, taxTotal, retentionTotal, deductionTotal, total } = calculateTotals();
  const paymentsTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const paymentDifference = total - paymentsTotal;

  const { showToast } = useToast();

  // Auto-ajustar pagos al total cuando cambia (solo si el usuario no ha modificado manualmente)
  useEffect(() => {
    if (payments.length === 1 && total > 0) {
      const currentAmount = payments[0].amount;
      // Solo actualizar si la diferencia es significativa (más de 0.01) para evitar loops
      // y asegurar que el valor se redondee correctamente
      if (Math.abs(currentAmount - total) > 0.01) {
        // Redondear a 2 decimales para evitar problemas de precisión
        const roundedTotal = Math.round(total * 100) / 100;
        // Sincronizar el monto del pago con el total calculado
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPayments([{ ...payments[0], amount: roundedTotal }]);
      }
    }
  }, [total, payments]);

  // Limpiar cuentas seleccionadas cuando cambia el cliente o el tipo de proceso
  useEffect(() => {
    if (processType !== ProcessType.RECEIPT || !clientCode) {
      // Limpiar selección cuando cambia el contexto del formulario
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedReceivables([]);
    }
  }, [processType, clientCode]);

  // Manejar selección de cuentas por cobrar
  const handleReceivableToggle = (originConsecutive: string, balance: number) => {
    const existing = selectedReceivables.find((r) => r.reference === originConsecutive);
    if (existing) {
      // Deseleccionar
      setSelectedReceivables(selectedReceivables.filter((r) => r.reference !== originConsecutive));
    } else {
      // Seleccionar con el saldo completo por defecto, redondeado a 2 decimales
      const roundedBalance = Math.round(balance * 100) / 100;
      setSelectedReceivables([...selectedReceivables, { reference: originConsecutive, value: roundedBalance }]);
    }
  };

  const handleReceivableAmountChange = (reference: string, value: number) => {
    // Asegurar que el valor esté redondeado a 2 decimales
    const roundedValue = Math.round(value * 100) / 100;
    setSelectedReceivables(
      selectedReceivables.map((r) => (r.reference === reference ? { ...r, value: roundedValue } : r))
    );
  };

  // Validación en tiempo real de stock
  // Generar referencia automática basada en la descripción
  const generateReferenceFromDescription = (description: string): string => {
    if (!description || description.trim() === '') return '';
    
    // Palabras comunes a ignorar (artículos, preposiciones, etc.)
    const stopWords = new Set([
      'DE', 'LA', 'EL', 'LOS', 'LAS', 'UN', 'UNA', 'UNOS', 'UNAS',
      'Y', 'O', 'CON', 'SIN', 'PARA', 'POR', 'SOBRE', 'BAJO',
      'DEL', 'AL', 'EN', 'A', 'ES', 'SON', 'ESTA', 'ESTE', 'ESTO'
    ]);
    
    // Limpiar y normalizar la descripción
    const cleanDesc = description
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^A-Z0-9\s]/g, '') // Eliminar caracteres especiales
      .replace(/\s+/g, ' '); // Normalizar espacios
    
    // Dividir en palabras, filtrar vacías, stop words y duplicados
    const allWords = cleanDesc.split(' ').filter(w => w.length > 0);
    const uniqueWords: string[] = [];
    const seenWords = new Set<string>();
    
    for (const word of allWords) {
      // Ignorar stop words y palabras muy cortas (menos de 2 caracteres)
      if (word.length < 2 || stopWords.has(word)) continue;
      
      // Evitar duplicados (case-insensitive)
      const wordLower = word.toLowerCase();
      if (!seenWords.has(wordLower)) {
        seenWords.add(wordLower);
        uniqueWords.push(word);
      }
    }
    
    if (uniqueWords.length === 0) {
      // Si no hay palabras válidas, usar las primeras letras de la descripción
      const fallback = cleanDesc.replace(/\s/g, '').substring(0, 8);
      return fallback || 'PROD';
    }
    
    // Tomar máximo 4 palabras únicas
    const selectedWords = uniqueWords.slice(0, 4);
    
    // Generar prefijos inteligentes: más letras para palabras cortas, menos para largas
    const prefixes = selectedWords.map(word => {
      if (word.length <= 3) {
        // Palabra corta: usar toda la palabra
        return word;
      } else if (word.length <= 5) {
        // Palabra mediana: usar 4 letras
        return word.substring(0, 4);
      } else {
        // Palabra larga: usar 3 letras
        return word.substring(0, 3);
      }
    });
    
    // Unir con guiones y limitar longitud total
    let reference = prefixes.join('-');
    
    // Limitar a 25 caracteres máximo (permitir más que antes para mejor legibilidad)
    if (reference.length > 25) {
      // Si es muy largo, reducir prefijos progresivamente
      const shortened = prefixes.map(p => {
        if (p.length > 3) return p.substring(0, 3);
        return p;
      });
      reference = shortened.join('-').substring(0, 25);
    }
    
    // Asegurar que la referencia esté en mayúsculas
    reference = reference.toUpperCase();
    
    // Verificar si ya existe y agregar número si es necesario
    const existing = products?.find(p => p.reference === reference);
    if (existing) {
      // Si existe, agregar un número secuencial
      let counter = 1;
      let newRef = `${reference}-${counter}`.toUpperCase();
      while (products?.find(p => p.reference === newRef)) {
        counter++;
        newRef = `${reference}-${counter}`.toUpperCase();
        // Limitar longitud total con contador
        if (newRef.length > 30) {
          const baseRef = reference.substring(0, 25);
          newRef = `${baseRef}-${counter}`.toUpperCase();
        }
      }
      return newRef;
    }
    
    return reference;
  };

  const validateStock = (detail: MovementDetail, productRef: string): string => {
    if (!productRef || !products) return '';
    const product = products.find((p) => p.reference === productRef);
    if (!product) return '';
    
    if (processType === ProcessType.SALE && product.stock < detail.quantity) {
      return `Stock insuficiente. Disponible: ${product.stock}`;
    }
    return '';
  };

  const handleProductChange = (index: number, productRef: string) => {
    const product = products?.find((p) => p.reference === productRef);
    const newDetails = [...details];
    const newNewProducts = new Set(newProducts);
    
    if (product) {
      // Producto existe
      newNewProducts.delete(index);
      
      // Para compras: el precio unitario debe ser el costo del producto (precio de compra)
      // Para ventas: el precio unitario debe ser el precio de venta del producto
      const initialUnitPrice =
        processType === ProcessType.PURCHASE
          ? product.costPrice > 0
            ? product.costPrice
            : 0 // Si no hay costo registrado, dejar en 0 para que el usuario lo ingrese
          : product.salePrice; // Para ventas y otros movimientos, usar precio de venta
      
      // Para compras, no precargar unitCost (se usará unitPrice como costo)
      // Para otros movimientos, usar el costo del producto si existe
      const initialUnitCost =
        processType === ProcessType.PURCHASE
          ? undefined // En compras, dejar vacío para que use unitPrice como costo
          : product.costPrice > 0 && product.costPrice !== product.salePrice
            ? product.costPrice
            : undefined;
      
      newDetails[index] = {
        ...newDetails[index],
        productReference: product.reference,
        description: product.description,
        unitPrice: initialUnitPrice,
        unitCost: initialUnitCost,
        productSalePrice: undefined, // Limpiar precio de venta si el producto existe
      };
    } else if (productRef && processType === ProcessType.PURCHASE) {
      // Producto no existe y es compra - permitir crear nuevo
      newNewProducts.add(index);
      const currentDescription = newDetails[index].description || '';
      
      // Si el productRef parece ser una descripción (contiene espacios o es muy largo), usarlo como descripción
      const isDescriptionLike = productRef.includes(' ') || productRef.length > 15;
      
      let finalDescription = '';
      let autoReference = '';
      
      if (isDescriptionLike) {
        // Es una descripción: usar como descripción y generar referencia automática
        finalDescription = productRef;
        autoReference = generateReferenceFromDescription(productRef) || productRef.toUpperCase().replace(/\s+/g, '-').substring(0, 20);
      } else {
        // Parece una referencia: usar como referencia y mantener descripción actual o usar la referencia como descripción
        autoReference = productRef.toUpperCase();
        finalDescription = currentDescription || productRef;
      }
      
      newDetails[index] = {
        ...newDetails[index],
        productReference: autoReference,
        description: finalDescription,
        // No cambiar unitPrice, dejar que el usuario lo ingrese
      };
    } else if (productRef && processType !== ProcessType.PURCHASE) {
      // Producto no existe y no es compra - mostrar advertencia pero permitir continuar
      // El backend lanzará error si intenta crear
      newNewProducts.delete(index);
      newDetails[index] = {
        ...newDetails[index],
        productReference: productRef,
      };
    }
    
    setDetails(newDetails);
    setNewProducts(newNewProducts);
  };

  const handleDetailChange = (
    index: number,
    field: keyof MovementDetail,
    value: number | string | undefined
  ) => {
    const newDetails = [...details];
    const isNewProduct = newProducts.has(index);
    
    // Si es un producto nuevo y se cambia la descripción, generar referencia automática
    if (isNewProduct && field === 'description' && typeof value === 'string' && value.trim() !== '') {
      const autoReference = generateReferenceFromDescription(value);
      if (autoReference) {
        newDetails[index] = { 
          ...newDetails[index], 
          [field]: value,
          productReference: autoReference
        };
      } else {
        newDetails[index] = { ...newDetails[index], [field]: value };
      }
    } else {
      newDetails[index] = { ...newDetails[index], [field]: value };
    }
    
    setDetails(newDetails);
  };

  const addDetail = () => {
    setDetails([
      ...details,
      {
        productReference: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 0, // Valor por defecto: 0%
      },
    ]);
  };

  const removeDetail = (index: number) => {
    if (details.length > 1) {
      setDetails(details.filter((_, i) => i !== index));
      const newNewProducts = new Set(newProducts);
      newNewProducts.delete(index);
      // Ajustar índices de productos nuevos después de eliminar
      const adjustedNewProducts = new Set<number>();
      newNewProducts.forEach((idx) => {
        if (idx > index) {
          adjustedNewProducts.add(idx - 1);
        } else if (idx < index) {
          adjustedNewProducts.add(idx);
        }
      });
      setNewProducts(adjustedNewProducts);
    }
  };

  const handlePaymentChange = (
    index: number,
    field: keyof PaymentDetail,
    value: number | string | boolean
  ) => {
    const newPayments = [...payments];
    newPayments[index] = { ...newPayments[index], [field]: value };
    
    // Si el método cambia a "CREDITO", activar automáticamente isCredit
    if (field === 'method' && value === 'CREDITO') {
      newPayments[index].isCredit = true;
    }
    // Si el método cambia a otro que no sea "CREDITO", desactivar isCredit
    if (field === 'method' && value !== 'CREDITO') {
      newPayments[index].isCredit = false;
    }
    
    setPayments(newPayments);
  };

  const addPayment = () => {
    setPayments([...payments, { method: 'EFECTIVO', amount: 0, isCredit: false }]);
  };

  const removePayment = (index: number) => {
    if (payments.length > 1) {
      setPayments(payments.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones específicas para SALE
    if (processType === ProcessType.SALE) {
      if (!clientCode) {
        showToast('Debe seleccionar un cliente para crear una venta', 'error');
        return;
      }
    }

    // Validaciones específicas para PURCHASE
    if (processType === ProcessType.PURCHASE) {
      if (!supplierCode) {
        showToast('Debe seleccionar un proveedor para crear una compra', 'error');
        return;
      }
    }

    // Validaciones específicas para RECEIPT
    if (processType === ProcessType.RECEIPT) {
      if (!clientCode) {
        showToast('Debe seleccionar un cliente', 'error');
        return;
      }
      if (selectedReceivables.length === 0) {
        showToast('Debe seleccionar al menos una cuenta por cobrar', 'error');
        return;
      }
      // Validar que los montos aplicados no excedan el saldo disponible
      for (const selected of selectedReceivables) {
        const receivable = receivablesData?.items.find((r) => r.originConsecutive === selected.reference);
        if (receivable && selected.value > receivable.balance) {
          showToast(
            `El monto aplicado a ${selected.reference} (${formatCurrency(selected.value)}) excede el saldo disponible (${formatCurrency(receivable.balance)})`,
            'error'
          );
          return;
        }
        if (selected.value <= 0) {
          showToast(`El monto aplicado a ${selected.reference} debe ser mayor a cero`, 'error');
          return;
        }
      }
      // Validar que los pagos sumen al menos el total de cuentas seleccionadas
      if (paymentsTotal < total) {
        showToast(
          `Los pagos (${formatCurrency(paymentsTotal)}) deben sumar al menos el total de cuentas seleccionadas (${formatCurrency(total)})`,
          'error'
        );
        return;
      }
    }

    // Validaciones específicas para EXPENSE con categoría ENVIO
    if (processType === ProcessType.EXPENSE && expenseCategory === 'ENVIO') {
      if (!originLocation || !destinationLocation) {
        showToast('Los gastos de envío requieren origen y destino', 'error');
        return;
      }
      if (originLocation === destinationLocation) {
        showToast('El origen y destino del envío deben ser diferentes', 'error');
        return;
      }
      if (paymentsTotal <= 0) {
        showToast('Debe ingresar al menos un pago para el gasto de envío', 'error');
        return;
      }
    } else if (processType === ProcessType.EXPENSE) {
      // Para otros tipos de EXPENSE, validar que haya payables o que no sea ENVIO
      // (esto se maneja en el backend)
    } else {
      // Validaciones para otros tipos de movimiento
      // Validar que todos los detalles tengan productos
      const hasEmptyProducts = details.some((d) => !d.productReference);
      if (hasEmptyProducts) {
        showToast('Todos los productos deben ser seleccionados', 'error');
        return;
      }

      // Validar stock
      for (const detail of details) {
        const stockError = validateStock(detail, detail.productReference);
        if (stockError) {
          showToast(stockError, 'error');
          return;
        }
      }

      if (Math.abs(paymentDifference) > 0.01) {
        showToast(
          `Los pagos deben sumar exactamente el total. Diferencia: ${formatCurrency(paymentDifference)}`,
          'error'
        );
        return;
      }
    }

    const data: CreateMovementDto = {
      processType,
      documentDate,
      clientCode: clientCode || undefined,
      clientName: isNewClient && clientName ? clientName : undefined,
      clientEmail: isNewClient && clientEmail ? clientEmail : undefined,
      clientPhone: isNewClient && clientPhone ? clientPhone : undefined,
      supplierCode: supplierCode || undefined,
      notes: notes || undefined,
      // Enviar 0 explícitamente para compras cuando el valor es 0, para que el backend no use valores por defecto
      retentionRate: processType === ProcessType.PURCHASE ? retentionRate : undefined,
      deductionRate: processType === ProcessType.PURCHASE ? deductionRate : undefined,
      expenseCategory: expenseCategory || undefined,
      originLocation: originLocation || undefined,
      destinationLocation: destinationLocation || undefined,
      relatedMovementId: relatedMovementId || undefined,
      details: processType === ProcessType.RECEIPT || (processType === ProcessType.EXPENSE && expenseCategory === 'ENVIO') ? [] : details.map((d) => ({
        productReference: d.productReference,
        description: d.description,
        quantity: d.quantity,
        unitPrice: d.unitPrice,
        unitCost: d.unitCost,
        discountRate: d.discountRate,
        taxRate: d.taxRate,
        weight: d.weight,
        productSalePrice: d.productSalePrice,
      })),
      payments: payments.map((p) => ({
        method: p.method,
        amount: p.amount,
        currency: p.currency,
        isCredit: p.isCredit,
      })),
      receivablesToSettle: processType === ProcessType.RECEIPT ? selectedReceivables : undefined,
    };

    onSubmit(data);
  };

  const needsClient = processType === ProcessType.SALE || processType === ProcessType.RECEIPT;
  const needsSupplier = processType === ProcessType.PURCHASE || processType === ProcessType.EXPENSE;

  return (
    <div className="form-fullscreen">
      {/* Sticky Header */}
      <header className="form-header-sticky">
        <div className="form-header-left">
          <div className="form-header-logo">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor"/>
            </svg>
          </div>
          <h2 className="form-header-title">Gestiva</h2>
        </div>
        <div className="form-header-right">
          <button type="button" onClick={onCancel} className="btn-header-cancel" disabled={isLoading}>
            Cancelar
          </button>
          <button type="submit" form="movement-form-id" className="btn-header-save" disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar Movimiento'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <form id="movement-form-id" onSubmit={handleSubmit} className="form-main-content">
        {/* Page Header */}
        <div className="form-page-header">
          <div className="form-page-header-left">
            <h1 className="form-page-title">Registrar Nuevo Movimiento</h1>
            <p className="form-page-subtitle">Seleccione el tipo de proceso y complete los campos requeridos.</p>
          </div>
          <div className="form-page-header-right">
            <div className="form-group-inline">
              <label htmlFor="processType">Tipo de Proceso</label>
              <select
                id="processType"
                value={processType}
                onChange={(e) => setProcessType(e.target.value as ProcessType)}
                className="process-type-select"
                required
              >
                {Object.entries(PROCESS_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Grid Layout: Main + Sidebar */}
        <div className="form-grid-layout">
          {/* Left Column (Main) */}
          <div className="form-main-column">
            {/* Información General Card */}
            <div className="form-card">
              <h2 className="form-card-title">Información General</h2>
              <div className="form-grid-2col">
                <div className="form-group">
                  <label>Fecha del Movimiento</label>
                  <input
                    type="date"
                    value={documentDate}
                    onChange={(e) => setDocumentDate(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                {needsClient && (
                  <>
                    <div className="form-group">
                      <label>Cliente {(processType === ProcessType.SALE || processType === ProcessType.RECEIPT) && <span className="required">*</span>}</label>
                      <SearchableSelect
                        options={
                          clients?.map((c) => ({
                            value: c.code,
                            label: `${c.code} - ${c.name}`,
                          })) || []
                        }
                        value={clientCode}
                        onChange={(value) => {
                          setClientCode(value);
                          // Verificar si el cliente existe
                          const clientExists = clients?.some((c) => c.code === value);
                          if (value && !clientExists && processType === ProcessType.SALE) {
                            setIsNewClient(true);
                          } else {
                            setIsNewClient(false);
                            setClientName('');
                            setClientEmail('');
                            setClientPhone('');
                          }
                        }}
                        placeholder="Buscar cliente o ingresar código nuevo..."
                        searchPlaceholder="Escriba para buscar o crear nuevo..."
                        allowCustomValue={processType === ProcessType.SALE}
                      />
                      {processType === ProcessType.RECEIPT && receivablesData && (
                        <div className="receivables-info">
                          <span className="material-icons info-icon">info</span>
                          <span>
                            Saldo total: <strong>{formatCurrency(receivablesData.balance)}</strong> |{' '}
                            {receivablesData.items.length} cuenta(s) pendiente(s)
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Campos para crear cliente nuevo (solo en ventas) */}
                    {isNewClient && processType === ProcessType.SALE && clientCode && (
                      <div className="form-card" style={{ marginTop: '1rem', border: '2px solid var(--color-primary)', backgroundColor: 'var(--color-primary-lighter)' }}>
                        <h3 className="form-card-title" style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                          <span className="material-icons" style={{ fontSize: '1.2rem', verticalAlign: 'middle', marginRight: '0.5rem' }}>add_circle</span>
                          Crear Cliente Nuevo
                        </h3>
                        <div className="form-grid-2col">
                          <div className="form-group">
                            <label>Nombre del Cliente <span className="required">*</span></label>
                            <input
                              type="text"
                              value={clientName}
                              onChange={(e) => setClientName(e.target.value)}
                              placeholder="Nombre completo del cliente"
                              className="form-input"
                              required
                              maxLength={120}
                            />
                          </div>
                          <div className="form-group">
                            <label>Email</label>
                            <input
                              type="email"
                              value={clientEmail}
                              onChange={(e) => setClientEmail(e.target.value)}
                              placeholder="cliente@ejemplo.com"
                              className="form-input"
                              maxLength={60}
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Teléfono</label>
                          <input
                            type="text"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            placeholder="+57 300 123 4567"
                            className="form-input"
                            maxLength={30}
                          />
                        </div>
                        <div className="info-message" style={{ marginTop: '0.5rem', padding: '0.5rem', fontSize: '0.85rem' }}>
                          <span className="material-icons" style={{ fontSize: '1rem' }}>info</span>
                          <span>El cliente se creará automáticamente al guardar la venta</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {needsSupplier && (
                  <div className="form-group">
                    <label>Proveedor {processType === ProcessType.PURCHASE && <span className="required">*</span>}</label>
                    <SearchableSelect
                      options={
                        suppliers?.map((s) => ({
                          value: s.code,
                          label: `${s.code} - ${s.name}`,
                        })) || []
                      }
                      value={supplierCode}
                      onChange={setSupplierCode}
                      placeholder="Buscar proveedor..."
                      searchPlaceholder="Escriba para buscar..."
                    />
                  </div>
                )}
              </div>

              {processType === ProcessType.PURCHASE && (
                <div className="form-grid-2col">
                  <div className="form-group">
                    <label>% Retención</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={retentionRate}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        // Si está vacío, mantener 0; si tiene valor, reemplazar completamente
                        if (inputValue === '') {
                          setRetentionRate(0);
                        } else {
                          const numValue = parseFloat(inputValue);
                          if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                            setRetentionRate(numValue);
                          }
                        }
                      }}
                      onFocus={(e) => {
                        // Al enfocar, seleccionar todo el texto para facilitar el reemplazo
                        e.target.select();
                      }}
                      placeholder="0"
                      className="form-input"
                    />
                    <small className="form-hint">Ingrese el porcentaje de retención (0 por defecto)</small>
                  </div>
                  <div className="form-group">
                    <label>% Deducción</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={deductionRate}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        // Si está vacío, mantener 0; si tiene valor, reemplazar completamente
                        if (inputValue === '') {
                          setDeductionRate(0);
                        } else {
                          const numValue = parseFloat(inputValue);
                          if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                            setDeductionRate(numValue);
                          }
                        }
                      }}
                      onFocus={(e) => {
                        // Al enfocar, seleccionar todo el texto para facilitar el reemplazo
                        e.target.select();
                      }}
                      placeholder="0"
                      className="form-input"
                    />
                    <small className="form-hint">Ingrese el porcentaje de deducción (0 por defecto)</small>
                  </div>
                </div>
              )}

              {/* Sección de Gastos de Envío (solo para EXPENSE) */}
              {processType === ProcessType.EXPENSE && (
                <div className="form-card">
                  <h2 className="form-card-title">Información del Gasto</h2>
                  <div className="form-group">
                    <label>Categoría de Gasto</label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => {
                        setExpenseCategory(e.target.value);
                        // Limpiar campos de envío si se cambia la categoría
                        if (e.target.value !== 'ENVIO') {
                          setOriginLocation('');
                          setDestinationLocation('');
                          setRelatedMovementId(undefined);
                        }
                      }}
                      className="form-input"
                    >
                      <option value="">Seleccione una categoría</option>
                      <option value="ENVIO">Envío / Transporte</option>
                      <option value="FLETE">Flete</option>
                      <option value="TRANSPORTE">Transporte</option>
                      <option value="OTROS">Otros</option>
                    </select>
                  </div>

                  {expenseCategory === 'ENVIO' && (
                    <div className="form-grid-2col">
                      <div className="form-group">
                        <label>Origen <span className="required">*</span></label>
                        <input
                          type="text"
                          value={originLocation}
                          onChange={(e) => setOriginLocation(e.target.value)}
                          placeholder="Ej: Bodega Principal"
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Destino <span className="required">*</span></label>
                        <input
                          type="text"
                          value={destinationLocation}
                          onChange={(e) => setDestinationLocation(e.target.value)}
                          placeholder="Ej: Tienda Centro"
                          className="form-input"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {expenseCategory === 'ENVIO' && (
                    <div className="form-group">
                      <label>Movimiento Relacionado (Opcional)</label>
                      <input
                        type="number"
                        value={relatedMovementId !== undefined ? relatedMovementId : ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                          setRelatedMovementId(value !== undefined && !isNaN(value) ? value : undefined);
                        }}
                        placeholder="ID del movimiento relacionado"
                        className="form-input"
                      />
                      <small className="form-hint">ID de la compra o venta relacionada con este envío</small>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sección de Cuentas por Cobrar (solo para RECEIPT) */}
            {processType === ProcessType.RECEIPT && (
              <div className="form-card">
                <h2 className="form-card-title">Cuentas por Cobrar a Saldar</h2>
                {!clientCode ? (
                  <div className="info-message">
                    <span className="material-icons">info</span>
                    <span>Seleccione un cliente para ver sus cuentas por cobrar</span>
                  </div>
                ) : isLoadingReceivables ? (
                  <Loading />
                ) : receivablesData && receivablesData.items.length > 0 ? (
            <div className="receivables-list">
              <table className="receivables-table">
                <thead>
                  <tr>
                    <th>Seleccionar</th>
                    <th>Consecutivo</th>
                    <th>Saldo</th>
                    <th>Estado</th>
                    <th>Vencimiento</th>
                    <th>Monto a Aplicar</th>
                  </tr>
                </thead>
                <tbody>
                  {receivablesData.items
                    .filter((item) => item.status === 'PENDIENTE' && item.balance > 0)
                    .map((item) => {
                      const isSelected = selectedReceivables.some((r) => r.reference === item.originConsecutive);
                      const selectedAmount = selectedReceivables.find((r) => r.reference === item.originConsecutive)?.value || 0;
                      return (
                        <tr key={item.id} className={isSelected ? 'selected' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleReceivableToggle(item.originConsecutive, item.balance)}
                            />
                          </td>
                          <td>
                            <strong>{item.originConsecutive}</strong>
                          </td>
                          <td>{formatCurrency(item.balance)}</td>
                          <td>
                            <span className={`status-badge ${item.status === 'PENDIENTE' ? 'pending' : 'cancelled'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td>{item.dueDate ? formatDate(item.dueDate) : '-'}</td>
                          <td>
                            {isSelected ? (
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={item.balance}
                                value={selectedAmount || ''}
                                onChange={(e) => {
                                  const inputValue = e.target.value;
                                  if (inputValue === '') {
                                    handleReceivableAmountChange(item.originConsecutive, 0);
                                  } else {
                                    const value = parseFloat(inputValue) || 0;
                                    const maxValue = Math.min(value, item.balance);
                                    // Redondear a 2 decimales
                                    const roundedValue = Math.round(maxValue * 100) / 100;
                                    handleReceivableAmountChange(item.originConsecutive, roundedValue);
                                  }
                                }}
                                onBlur={(e) => {
                                  // Asegurar que el valor esté bien formateado al perder el foco
                                  const numValue = parseFloat(e.target.value) || 0;
                                  const maxValue = Math.min(numValue, item.balance);
                                  const roundedValue = Math.round(maxValue * 100) / 100;
                                  if (selectedAmount !== roundedValue) {
                                    handleReceivableAmountChange(item.originConsecutive, roundedValue);
                                  }
                                }}
                                className="receivable-amount-input"
                              />
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {selectedReceivables.length > 0 && (
                <div className="selected-receivables-summary">
                  <strong>Total a aplicar: {formatCurrency(total)}</strong>
                </div>
              )}
            </div>
          ) : (
                  <div className="info-message">
                    <span className="material-icons">info</span>
                    <span>Este cliente no tiene cuentas por cobrar pendientes</span>
                  </div>
                )}
              </div>
            )}

            {/* Detalles del Movimiento (oculta para RECEIPT y EXPENSE con categoría ENVIO) */}
            {processType !== ProcessType.RECEIPT && !(processType === ProcessType.EXPENSE && expenseCategory === 'ENVIO') && (
              <div className="form-card">
                <div className="form-card-header">
                  <h2 className="form-card-title">Detalles del Movimiento</h2>
                  <button type="button" onClick={addDetail} className="btn-add-line">
                    <span className="material-icons">add</span>
                    <span>Agregar Línea</span>
                  </button>
                </div>

                <div className="products-table-container">
                  <div className="products-table-scroll-wrapper">
                    <table className="products-table-new">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th className="text-right">Cantidad</th>
                        <th className="text-right">Precio Unit.</th>
                        <th className="text-right">% Desc.</th>
                        <th className="text-right">% IVA</th>
                        <th className="text-right">Subtotal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.map((detail, index) => {
                        const stockError = validateStock(detail, detail.productReference);
                        const selectedProduct = products?.find((p) => p.reference === detail.productReference);
                        const baseAmount = detail.quantity * detail.unitPrice;
                        const discountAmount = baseAmount * ((detail.discountRate || 0) / 100);
                        const lineSubtotal = baseAmount - discountAmount;

                        const isNewProduct = newProducts.has(index) && processType === ProcessType.PURCHASE;
                        
                        return (
                          <>
                            <tr key={index} className="product-row">
                              <td colSpan={isNewProduct ? 1 : undefined}>
                                <SearchableSelect
                                  options={
                                    products?.map((p) => ({
                                      value: p.reference,
                                      label: `${p.description} - ${p.reference} (Stock: ${p.stock})`,
                                      description: p.description.toLowerCase(),
                                      reference: p.reference.toLowerCase(),
                                    })) || []
                                  }
                                  value={detail.productReference}
                                  onChange={(value) => handleProductChange(index, value)}
                                  placeholder="Buscar producto..."
                                  searchPlaceholder="Buscar por descripción o referencia..."
                                  className={stockError ? 'input-error' : ''}
                                  allowCustomValue={processType === ProcessType.PURCHASE}
                                />
                                {selectedProduct && (
                                  <p className="product-meta">SKU: {selectedProduct.reference} | Stock: {selectedProduct.stock}</p>
                                )}
                                {isNewProduct && (
                                  <div className="info-message" style={{ marginTop: '0.5rem', padding: '0.5rem', fontSize: '0.85rem', backgroundColor: 'var(--color-primary-lighter)', border: '1px solid var(--color-primary)' }}>
                                    <span className="material-icons" style={{ fontSize: '1rem' }}>add_circle</span>
                                    <span>Producto nuevo - se creará automáticamente al guardar la compra</span>
                                  </div>
                                )}
                                {stockError && <span className="error-message">{stockError}</span>}
                              </td>
                            <td className="text-right">
                              <input
                                type="number"
                                step="1"
                                min="1"
                                value={detail.quantity}
                                onChange={(e) => handleDetailChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="form-input-sm"
                                required
                              />
                            </td>
                            <td className="text-right">
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={detail.unitPrice}
                                onChange={(e) => handleDetailChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="form-input-sm"
                                required
                              />
                            </td>
                            <td className="text-right">
                              <input
                                type="number"
                                step="1"
                                min="0"
                                max="100"
                                value={detail.discountRate || 0}
                                onChange={(e) => handleDetailChange(index, 'discountRate', parseFloat(e.target.value) || 0)}
                                className="form-input-xs"
                                placeholder="0"
                              />
                            </td>
                            <td className="text-right">
                              <input
                                type="number"
                                step="1"
                                min="0"
                                max="100"
                                value={detail.taxRate !== undefined ? detail.taxRate : 0}
                                onChange={(e) => {
                                  const inputValue = e.target.value;
                                  // Si está vacío, usar 0; si tiene valor, reemplazar completamente
                                  if (inputValue === '') {
                                    handleDetailChange(index, 'taxRate', 0);
                                  } else {
                                    const numValue = parseFloat(inputValue);
                                    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                                      handleDetailChange(index, 'taxRate', numValue);
                                    }
                                  }
                                }}
                                onFocus={(e) => {
                                  // Al enfocar, seleccionar todo el texto para facilitar el reemplazo
                                  e.target.select();
                                }}
                                onBlur={(e) => {
                                  // Al perder el foco, si está vacío poner 0
                                  const inputValue = e.target.value;
                                  if (inputValue === '' || inputValue === null) {
                                    handleDetailChange(index, 'taxRate', 0);
                                  }
                                }}
                                className="form-input-xs"
                                placeholder="0"
                              />
                            </td>
                            <td className="text-right font-medium">
                              {formatCurrency(lineSubtotal)}
                            </td>
                            <td className="text-right">
                              {details.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeDetail(index)}
                                  className="btn-delete-row"
                                  title="Eliminar línea"
                                >
                                  <span className="material-icons">delete</span>
                                </button>
                              )}
                            </td>
                          </tr>
                          {isNewProduct && (
                            <tr key={`${index}-new-product`} className="product-row-new" style={{ backgroundColor: 'var(--color-primary-lighter)' }}>
                              <td colSpan={7} style={{ padding: '1rem', borderTop: 'none' }}>
                                <div className="form-grid-2col" style={{ gap: '1rem' }}>
                                  <div className="form-group">
                                    <label>Descripción del Producto <span className="required">*</span></label>
                                    <input
                                      type="text"
                                      value={detail.description}
                                      onChange={(e) => handleDetailChange(index, 'description', e.target.value)}
                                      placeholder="Descripción completa del producto"
                                      className="form-input"
                                      required
                                      maxLength={180}
                                    />
                                    <small className="form-hint">La referencia se generará automáticamente al escribir la descripción</small>
                                  </div>
                                  <div className="form-group">
                                    <label>Referencia del Producto</label>
                                    <input
                                      type="text"
                                      value={detail.productReference}
                                      onChange={(e) => handleDetailChange(index, 'productReference', e.target.value.toUpperCase())}
                                      placeholder="Se genera automáticamente"
                                      className="form-input"
                                      maxLength={30}
                                      style={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                                    />
                                    <small className="form-hint">Puedes editarla manualmente si lo deseas</small>
                                  </div>
                                </div>
                                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                                  <label>Precio de Venta Inicial</label>
                                  <input
                                    type="number"
                                    step="1"
                                    min="0"
                                    value={detail.productSalePrice || ''}
                                    onChange={(e) => {
                                      const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                      handleDetailChange(index, 'productSalePrice', value);
                                    }}
                                    placeholder="Igual al precio de compra si no se especifica"
                                    className="form-input"
                                  />
                                  <small className="form-hint">Si no se especifica, se usará el precio de compra como precio de venta inicial</small>
                                </div>
                              </td>
                            </tr>
                          )}
                          </>
                        );
                      })}
                    </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Notas y Observaciones Card */}
            <div className="form-card">
              <h2 className="form-card-title">Notas y Observaciones</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="form-textarea"
                placeholder="Añadir notas opcionales sobre el movimiento..."
              />
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="form-sidebar-sticky">
            <div className="form-card sidebar-card">
              <div className="sidebar-header">
                <h2 className="form-card-title">Formas de Pago</h2>
              </div>
              <div className="payments-grid">
                {payments.map((payment, index) => (
                  <div key={index} className="payment-item">
                    <div className="payment-inputs">
                      <select
                        value={payment.method}
                        onChange={(e) => handlePaymentChange(index, 'method', e.target.value)}
                        className="payment-method-select"
                        required
                      >
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="TRANSFERENCIA">Transferencia</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="TARJETA">Tarjeta</option>
                        <option value="CREDITO">Crédito</option>
                      </select>
                      <input
                        type="text"
                        value={paymentInputValues[index] !== undefined 
                          ? paymentInputValues[index]
                          : payment.amount > 0 
                            ? `$ ${payment.amount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                            : ''}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          // Remover todo excepto números y punto decimal
                          const cleanValue = inputValue.replace(/[^0-9.]/g, '');
                          
                          // Si está vacío, limpiar
                          if (cleanValue === '' || cleanValue === '.') {
                            setPaymentInputValues({ ...paymentInputValues, [index]: '' });
                            handlePaymentChange(index, 'amount', 0);
                            return;
                          }
                          
                          // Permitir solo un punto decimal
                          const parts = cleanValue.split('.');
                          let numValue: number;
                          
                          if (parts.length > 2) {
                            // Si hay múltiples puntos, tomar solo el primero
                            numValue = parseFloat(parts[0] + '.' + parts.slice(1).join('')) || 0;
                          } else if (parts.length === 2) {
                            // Limitar decimales a 2 dígitos
                            const decimals = parts[1].substring(0, 2);
                            numValue = parseFloat(parts[0] + '.' + decimals) || 0;
                          } else {
                            numValue = parseFloat(cleanValue) || 0;
                          }
                          
                          // Actualizar el valor mostrado (sin formatear mientras se escribe para facilitar edición)
                          setPaymentInputValues({ ...paymentInputValues, [index]: cleanValue });
                          
                          // Actualizar el valor numérico
                          const roundedValue = Math.round(numValue * 100) / 100;
                          handlePaymentChange(index, 'amount', roundedValue);
                        }}
                        onFocus={() => {
                          // Al enfocar, mostrar solo el número sin formato para facilitar edición
                          const numValue = payment.amount || 0;
                          setPaymentInputValues({ ...paymentInputValues, [index]: numValue > 0 ? numValue.toString() : '' });
                        }}
                        onBlur={() => {
                          // Al perder el foco, formatear el valor
                          const numValue = payment.amount || 0;
                          if (numValue > 0) {
                            const formatted = numValue.toLocaleString('es-CO', { 
                              minimumFractionDigits: 0, 
                              maximumFractionDigits: 2 
                            });
                            setPaymentInputValues({ ...paymentInputValues, [index]: `$ ${formatted}` });
                          } else {
                            setPaymentInputValues({ ...paymentInputValues, [index]: '' });
                          }
                        }}
                        placeholder="$ 0"
                        className="payment-amount-input"
                        required
                      />
                    </div>
                    {payments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePayment(index)}
                        className="btn-delete-payment"
                        title="Eliminar pago"
                      >
                        <span className="material-icons">close</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button type="button" onClick={addPayment} className="btn-add-payment">
                <span className="material-icons">add</span>
                <span>Agregar Pago</span>
              </button>

              <hr className="sidebar-divider" />
              <div className="totals-section">
                {processType === ProcessType.RECEIPT ? (
                  <>
                    <div className="total-row">
                      <span>Total Cuentas Seleccionadas</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                    <div className="total-row">
                      <span>Total Pagos</span>
                      <span>{formatCurrency(paymentsTotal)}</span>
                    </div>
                    {paymentsTotal < total && (
                      <div className="total-row-alert error">
                        <span>Faltante</span>
                        <span>{formatCurrency(total - paymentsTotal)}</span>
                      </div>
                    )}
                    {paymentsTotal > total && (
                      <div className="total-row-alert info">
                        <span>Excedente</span>
                        <span>{formatCurrency(paymentsTotal - total)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="total-row">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="total-row">
                      <span>IVA (19%)</span>
                      <span>{formatCurrency(taxTotal)}</span>
                    </div>
                    {processType === ProcessType.PURCHASE && retentionTotal > 0 && (
                      <div className="total-row">
                        <span>Retención ({retentionRate}%)</span>
                        <span className="text-red">-{formatCurrency(retentionTotal)}</span>
                      </div>
                    )}
                    {processType === ProcessType.PURCHASE && deductionTotal > 0 && (
                      <div className="total-row">
                        <span>Deducción ({deductionRate}%)</span>
                        <span className="text-red">-{formatCurrency(deductionTotal)}</span>
                      </div>
                    )}
                    <div className="total-row-final">
                      <span>Total a Pagar</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                    <div className="total-row">
                      <span>Total Pagado</span>
                      <span>{formatCurrency(paymentsTotal)}</span>
                    </div>
                    {Math.abs(paymentDifference) > 0.01 && (
                      <div className="total-row-alert error">
                        <span>Saldo Pendiente</span>
                        <span>{formatCurrency(Math.abs(paymentDifference))}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}

