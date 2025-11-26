import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { movementsApi } from '../../api/movements.api';
import { clientsApi } from '../../api/clients.api';
import { suppliersApi } from '../../api/suppliers.api';
import { productsApi } from '../../api/products.api';
import { reportsApi } from '../../api/reports.api';
import Loading from '../../components/common/Loading';
import SearchableSelect from '../../components/common/SearchableSelect';
import { useToast } from '../../hooks/useToast';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ProcessType, PROCESS_TYPE_LABELS } from '../../constants/process-types';
import type { CreateMovementDto, MovementDetail, PaymentDetail, RelatedAccountDto } from '../../types/movement.types';
import './Movements.css';

export default function Movements() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

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

  const handleCancel = (movement: import('../../types/movement.types').MovementHeader) => {
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

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="movements-page">
      <div className="page-header">
        <h1>Movimientos</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <span className="material-icons btn-icon">
            {showForm ? 'close' : 'add_shopping_cart'}
          </span>
          {showForm ? 'Cancelar' : 'Nuevo Movimiento'}
        </button>
      </div>

      {showForm && (
        <MovementForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
          isLoading={createMutation.isPending}
        />
      )}

      <div className="movements-list">
        {movements && movements.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Consecutivo</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Cliente/Proveedor</th>
                <th>Subtotal</th>
                <th>IVA</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => {
                const isAnulacion = movement.consecutive?.startsWith('ANL-');
                const isAnulado = movement.status === 0;
                const canCancel = !isAnulacion && !isAnulado;

                return (
                  <tr key={movement.id} className={isAnulado ? 'row-anulado' : ''}>
                    <td>
                      {isAnulacion && (
                        <span className="material-icons anulacion-icon" title="Movimiento de anulación">
                          cancel
                        </span>
                      )}
                      {movement.consecutive}
                    </td>
                    <td>{PROCESS_TYPE_LABELS[movement.processType as ProcessType] || movement.processType}</td>
                    <td>{formatDate(movement.documentDate)}</td>
                    <td>
                      {(() => {
                        // Para compras y gastos, mostrar proveedor
                        if (
                          movement.processType === ProcessType.PURCHASE ||
                          movement.processType === ProcessType.EXPENSE
                        ) {
                          return movement.supplier?.name || movement.supplierName || '-';
                        }
                        // Para ventas y recibos, mostrar cliente
                        if (
                          movement.processType === ProcessType.SALE ||
                          movement.processType === ProcessType.RECEIPT
                        ) {
                          return movement.client?.name || '-';
                        }
                        // Para otros tipos, intentar ambos
                        return movement.client?.name || movement.supplier?.name || movement.supplierName || '-';
                      })()}
                    </td>
                    <td>{formatCurrency(movement.subtotal)}</td>
                    <td>{formatCurrency(movement.taxTotal)}</td>
                    <td>
                      <strong>{formatCurrency(movement.total)}</strong>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          isAnulado
                            ? 'cancelled'
                            : movement.status === 1
                            ? 'active'
                            : 'inactive'
                        }`}
                      >
                        {isAnulado
                          ? 'Anulado'
                          : isAnulacion
                          ? 'Anulación'
                          : movement.status === 1
                          ? 'Activo'
                          : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      {canCancel && (
                        <button
                          onClick={() => handleCancel(movement)}
                          className="btn-icon-cancel"
                          title="Anular movimiento"
                          disabled={cancelMutation.isPending}
                        >
                          <span className="material-icons">block</span>
                        </button>
                      )}
                      {isAnulacion && (
                        <span className="material-icons info-icon" title="Este es un movimiento de anulación">
                          info
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>No hay movimientos registrados</p>
        )}
      </div>
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
  const [supplierCode, setSupplierCode] = useState('');
  const [notes, setNotes] = useState('');
  const [retentionRate, setRetentionRate] = useState<number | undefined>(undefined);
  const [deductionRate, setDeductionRate] = useState<number | undefined>(undefined);
  const [details, setDetails] = useState<MovementDetail[]>([
      {
        productReference: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: undefined, // Usará el default del backend (19%) si no se especifica
      },
  ]);
  const [payments, setPayments] = useState<PaymentDetail[]>([
    { method: 'EFECTIVO', amount: 0, isCredit: false },
  ]);
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

    let subtotal = 0;
    let taxTotal = 0;
    let retentionTotal = 0;
    let deductionTotal = 0;

    details.forEach((detail) => {
      const baseAmount = detail.quantity * detail.unitPrice;
      const discountRate = detail.discountRate || 0;
      const discounted = baseAmount * (1 - discountRate / 100);
      // Si taxRate es undefined, usar 19% (default); si es 0, aplicar 0% (sin IVA)
      const taxRateValue = detail.taxRate !== undefined ? detail.taxRate : 19;
      const taxRate = taxRateValue / 100;
      const taxAmount = discounted * taxRate;
      subtotal += discounted;
      taxTotal += taxAmount;

      // Para compras, aplicar retenciones y deducciones según configuración
      // Si no se especifican, usar defaults (2.5% y 1%)
      // Si se especifican como 0, no aplicar
      if (processType === ProcessType.PURCHASE) {
        const finalRetentionRate = retentionRate !== undefined ? retentionRate : 2.5;
        const finalDeductionRate = deductionRate !== undefined ? deductionRate : 1.0;
        
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
        setPayments([{ ...payments[0], amount: roundedTotal }]);
      }
    }
  }, [total]); // eslint-disable-line react-hooks/exhaustive-deps

  // Limpiar cuentas seleccionadas cuando cambia el cliente o el tipo de proceso
  useEffect(() => {
    if (processType !== ProcessType.RECEIPT || !clientCode) {
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
    if (product) {
      const newDetails = [...details];
      
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
      };
      setDetails(newDetails);
    }
  };

  const handleDetailChange = (
    index: number,
    field: keyof MovementDetail,
    value: number | string | undefined
  ) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
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
        taxRate: undefined, // Usará el default del backend (19%) si no se especifica
      },
    ]);
  };

  const removeDetail = (index: number) => {
    if (details.length > 1) {
      setDetails(details.filter((_, i) => i !== index));
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
      supplierCode: supplierCode || undefined,
      notes: notes || undefined,
      retentionRate: retentionRate !== undefined ? retentionRate : undefined,
      deductionRate: deductionRate !== undefined ? deductionRate : undefined,
      details: processType === ProcessType.RECEIPT ? [] : details.map((d) => ({
        productReference: d.productReference,
        description: d.description,
        quantity: d.quantity,
        unitPrice: d.unitPrice,
        unitCost: d.unitCost,
        discountRate: d.discountRate,
        taxRate: d.taxRate,
        weight: d.weight,
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
    <form onSubmit={handleSubmit} className="movement-form">
      <div className="form-section">
        <h3>Información General</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Tipo de Proceso *</label>
            <select
              value={processType}
              onChange={(e) => setProcessType(e.target.value as ProcessType)}
              required
            >
              {Object.entries(PROCESS_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Fecha del Documento *</label>
            <input
              type="date"
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
              required
            />
          </div>
        </div>

        {needsClient && (
          <div className="form-group">
            <label>Cliente {processType === ProcessType.RECEIPT && <span className="required">*</span>}</label>
            <SearchableSelect
              options={
                clients?.map((c) => ({
                  value: c.code,
                  label: `${c.code} - ${c.name}`,
                })) || []
              }
              value={clientCode}
              onChange={setClientCode}
              placeholder="Buscar cliente por código o nombre..."
              searchPlaceholder="Escriba para buscar..."
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
        )}

        {needsSupplier && (
          <div className="form-group">
            <label>Proveedor</label>
            <SearchableSelect
              options={
                suppliers?.map((s) => ({
                  value: s.code,
                  label: `${s.code} - ${s.name}`,
                })) || []
              }
              value={supplierCode}
              onChange={setSupplierCode}
              placeholder="Buscar proveedor por código o nombre..."
              searchPlaceholder="Escriba para buscar..."
            />
          </div>
        )}

        <div className="form-group">
          <label>Notas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {processType === ProcessType.PURCHASE && (
          <div className="form-row">
            <div className="form-group">
              <label>% Retención</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={retentionRate !== undefined ? retentionRate : ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  setRetentionRate(value !== undefined && !isNaN(value) ? value : undefined);
                }}
                placeholder="2.5 (default)"
              />
              <small className="form-hint">Deje vacío para usar 2.5% (default) o ingrese 0 para sin retención</small>
            </div>
            <div className="form-group">
              <label>% Deducción</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={deductionRate !== undefined ? deductionRate : ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  setDeductionRate(value !== undefined && !isNaN(value) ? value : undefined);
                }}
                placeholder="1.0 (default)"
              />
              <small className="form-hint">Deje vacío para usar 1% (default) o ingrese 0 para sin deducción</small>
            </div>
          </div>
        )}
      </div>

      {/* Sección de Cuentas por Cobrar (solo para RECEIPT) */}
      {processType === ProcessType.RECEIPT && (
        <div className="form-section">
          <h3>Cuentas por Cobrar a Saldar</h3>
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

      {/* Sección de Detalles del Movimiento (oculta para RECEIPT) */}
      {processType !== ProcessType.RECEIPT && (
      <div className="form-section">
        <div className="section-header">
          <h3>Detalles del Movimiento</h3>
          <button type="button" onClick={addDetail} className="btn-secondary btn-sm">
            <span className="material-icons btn-icon">add</span>
            Agregar Detalle
          </button>
        </div>
        {details.map((detail, index) => {
          const stockError = validateStock(detail, detail.productReference);
          const selectedProduct = products?.find((p) => p.reference === detail.productReference);

          return (
            <div key={index} className="detail-row">
              <div className="form-group">
                <label>
                  Producto <span className="required">*</span>
                </label>
                <SearchableSelect
                  options={
                    products?.map((p) => ({
                      value: p.reference,
                      label: `${p.reference} - ${p.description} (Stock: ${p.stock})`,
                    })) || []
                  }
                  value={detail.productReference}
                  onChange={(value) => handleProductChange(index, value)}
                  placeholder="Buscar producto por referencia o nombre..."
                  searchPlaceholder="Escriba para buscar producto..."
                  className={stockError ? 'input-error' : ''}
                />
                {stockError && (
                  <span className="error-message">{stockError}</span>
                )}
                {selectedProduct && !stockError && (
                  <small className="form-hint">
                    Stock disponible: {selectedProduct.stock} |{' '}
                    {processType === ProcessType.PURCHASE
                      ? `Costo: ${formatCurrency(selectedProduct.costPrice || 0)}`
                      : `Precio: ${formatCurrency(selectedProduct.salePrice)}`}
                  </small>
                )}
              </div>
            <div className="form-group">
              <label>Descripción *</label>
              <input
                type="text"
                value={detail.description}
                onChange={(e) => handleDetailChange(index, 'description', e.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Cantidad *</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={detail.quantity}
                  onChange={(e) => handleDetailChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Precio Unitario *</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={detail.unitPrice}
                  onChange={(e) => handleDetailChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="form-group">
                <label>% Descuento</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={detail.discountRate || 0}
                  onChange={(e) => handleDetailChange(index, 'discountRate', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label>% IVA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={detail.taxRate !== undefined ? detail.taxRate : ''}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      // Si está vacío, usar undefined (aplicará default del backend)
                      handleDetailChange(index, 'taxRate', undefined);
                    } else {
                      const numValue = parseFloat(inputValue);
                      if (!isNaN(numValue)) {
                        handleDetailChange(index, 'taxRate', numValue);
                      }
                    }
                  }}
                  placeholder="19 (default)"
                />
                <small className="form-hint">Deje vacío para usar 19% (default) o ingrese 0 para sin IVA</small>
              </div>
            </div>
            {details.length > 1 && (
              <button
                type="button"
                onClick={() => removeDetail(index)}
                className="btn-danger btn-sm"
              >
                <span className="material-icons btn-icon">delete</span>
                Eliminar
              </button>
            )}
            </div>
          );
        })}
      </div>
      )}

      <div className="form-section">
        <div className="section-header">
          <h3>Formas de Pago</h3>
          <button type="button" onClick={addPayment} className="btn-secondary btn-sm">
            <span className="material-icons btn-icon">add</span>
            Agregar Pago
          </button>
        </div>
        {payments.map((payment, index) => (
          <div key={index} className="payment-row">
            <div className="form-row">
              <div className="form-group">
                <label>Método *</label>
                <select
                  value={payment.method}
                  onChange={(e) => handlePaymentChange(index, 'method', e.target.value)}
                  required
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="TARJETA">Tarjeta</option>
                  <option value="CREDITO">Crédito</option>
                </select>
              </div>
              <div className="form-group">
                <label>Monto *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={payment.amount || ''}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    // Permitir campo vacío temporalmente mientras el usuario escribe
                    if (inputValue === '') {
                      handlePaymentChange(index, 'amount', 0);
                    } else {
                      const numValue = parseFloat(inputValue);
                      if (!isNaN(numValue) && numValue >= 0) {
                        // Redondear a 2 decimales para evitar problemas de precisión
                        const roundedValue = Math.round(numValue * 100) / 100;
                        handlePaymentChange(index, 'amount', roundedValue);
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // Asegurar que el valor esté bien formateado al perder el foco
                    const numValue = parseFloat(e.target.value) || 0;
                    const roundedValue = Math.round(numValue * 100) / 100;
                    if (payment.amount !== roundedValue) {
                      handlePaymentChange(index, 'amount', roundedValue);
                    }
                  }}
                  required
                />
              </div>
              {processType === ProcessType.SALE && (
                <div className="form-group credit-toggle-group">
                  <label className="credit-toggle-label">
                    <span className="credit-toggle-text">
                      <span className="material-icons credit-icon">account_balance_wallet</span>
                      Genera Cuenta por Cobrar
                    </span>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        className="toggle-input"
                        checked={payment.isCredit || false}
                        onChange={(e) => handlePaymentChange(index, 'isCredit', e.target.checked)}
                        disabled={payment.method === 'CREDITO'} // Deshabilitar si el método ya es CREDITO
                      />
                      <span className="toggle-slider"></span>
                    </div>
                  </label>
                  {payment.isCredit && (
                    <div className="credit-info">
                      <span className="material-icons info-icon">info</span>
                      <span>Este monto generará una cuenta por cobrar asociada al cliente.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {payments.length > 1 && (
              <button
                type="button"
                onClick={() => removePayment(index)}
                className="btn-danger btn-sm"
              >
                <span className="material-icons btn-icon">delete</span>
                Eliminar
              </button>
            )}
          </div>
        ))}
        <div className="totals-summary">
          {processType === ProcessType.RECEIPT ? (
            <>
              <div className="total-row total-final">
                <span>Total Cuentas Seleccionadas:</span>
                <strong>{formatCurrency(total)}</strong>
              </div>
              <div className="total-row">
                <span>Total Pagos:</span>
                <strong>{formatCurrency(paymentsTotal)}</strong>
              </div>
              {paymentsTotal < total && (
                <div className="total-row error">
                  <span>Faltante:</span>
                  <strong>{formatCurrency(total - paymentsTotal)}</strong>
                </div>
              )}
              {paymentsTotal > total && (
                <div className="total-row info">
                  <span>Excedente:</span>
                  <strong>{formatCurrency(paymentsTotal - total)}</strong>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="total-row">
                <span>Subtotal:</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>
              <div className="total-row">
                <span>IVA:</span>
                <strong>{formatCurrency(taxTotal)}</strong>
              </div>
              {processType === ProcessType.PURCHASE && retentionTotal > 0 && (
                <div className="total-row">
                  <span>Retención ({retentionRate !== undefined ? retentionRate : 2.5}%):</span>
                  <strong>-{formatCurrency(retentionTotal)}</strong>
                </div>
              )}
              {processType === ProcessType.PURCHASE && deductionTotal > 0 && (
                <div className="total-row">
                  <span>Deducción ({deductionRate !== undefined ? deductionRate : 1}%):</span>
                  <strong>-{formatCurrency(deductionTotal)}</strong>
                </div>
              )}
              <div className="total-row total-final">
                <span>Total:</span>
                <strong>{formatCurrency(total)}</strong>
              </div>
              <div className="total-row">
                <span>Total Pagos:</span>
                <strong>{formatCurrency(paymentsTotal)}</strong>
              </div>
              {Math.abs(paymentDifference) > 0.01 && (
                <div className="total-row error">
                  <span>Diferencia:</span>
                  <strong>{formatCurrency(paymentDifference)}</strong>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="form-actions form-actions-fixed">
        <div className="form-actions-total">
          <span className="total-label">Total a Pagar:</span>
          <span className="total-amount">{formatCurrency(total)}</span>
        </div>
        <div className="form-actions-buttons">
          <button type="submit" className="btn-primary btn-primary-large" disabled={isLoading}>
            <span className="material-icons btn-icon">
              {isLoading ? 'hourglass_empty' : 'check_circle'}
            </span>
            {isLoading ? 'Guardando...' : 'Guardar Movimiento'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary" disabled={isLoading}>
            <span className="material-icons btn-icon">close</span>
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
}

