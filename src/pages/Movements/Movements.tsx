import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { movementsApi } from '../../api/movements.api';
import { clientsApi } from '../../api/clients.api';
import { productsApi } from '../../api/products.api';
import Loading from '../../components/common/Loading';
import SearchableSelect from '../../components/common/SearchableSelect';
import { useToast } from '../../hooks/useToast';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ProcessType, PROCESS_TYPE_LABELS } from '../../constants/process-types';
import type { CreateMovementDto, MovementDetail, PaymentDetail } from '../../types/movement.types';
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
                      {movement.client?.name || movement.supplierName || '-'}
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
  const [documentDate, setDocumentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [clientCode, setClientCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');
  const [details, setDetails] = useState<MovementDetail[]>([
    {
      productReference: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 19,
    },
  ]);
  const [payments, setPayments] = useState<PaymentDetail[]>([
    { method: 'EFECTIVO', amount: 0, isCredit: false },
  ]);

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll().then((res) => res.data),
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll().then((res) => res.data),
  });

  const calculateTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;

    details.forEach((detail) => {
      const baseAmount = detail.quantity * detail.unitPrice;
      const discountRate = detail.discountRate || 0;
      const discounted = baseAmount * (1 - discountRate / 100);
      const taxRate = (detail.taxRate || 19) / 100;
      const taxAmount = discounted * taxRate;
      subtotal += discounted;
      taxTotal += taxAmount;
    });

    const total = subtotal + taxTotal;
    return { subtotal, taxTotal, total };
  };

  const { subtotal, taxTotal, total } = calculateTotals();
  const paymentsTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const paymentDifference = total - paymentsTotal;

  const { showToast } = useToast();

  // Auto-ajustar pagos al total cuando cambia
  useEffect(() => {
    if (payments.length === 1 && total > 0 && payments[0].amount !== total) {
      setPayments([{ ...payments[0], amount: total }]);
    }
  }, [total]); // eslint-disable-line react-hooks/exhaustive-deps

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
      newDetails[index] = {
        ...newDetails[index],
        productReference: product.reference,
        description: product.description,
        unitPrice: product.salePrice,
        unitCost: product.costPrice,
      };
      setDetails(newDetails);
    }
  };

  const handleDetailChange = (
    index: number,
    field: keyof MovementDetail,
    value: number | string
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
        taxRate: 19,
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

    const data: CreateMovementDto = {
      processType,
      documentDate,
      clientCode: clientCode || undefined,
      supplierName: supplierName || undefined,
      notes: notes || undefined,
      details: details.map((d) => ({
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
            <label>Cliente</label>
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
          </div>
        )}

        {needsSupplier && (
          <div className="form-group">
            <label>Proveedor</label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Nombre del proveedor"
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
      </div>

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
                    Stock disponible: {selectedProduct.stock} | Precio: {formatCurrency(selectedProduct.salePrice)}
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
                  step="1"
                  min="0"
                  value={detail.taxRate || 19}
                  onChange={(e) => handleDetailChange(index, 'taxRate', parseFloat(e.target.value) || 19)}
                />
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
                  <option value="TARJETA_DEBITO">Tarjeta Débito</option>
                  <option value="TARJETA_CREDITO">Tarjeta Crédito</option>
                </select>
              </div>
              <div className="form-group">
                <label>Monto *</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={payment.amount}
                  onChange={(e) => handlePaymentChange(index, 'amount', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={payment.isCredit || false}
                    onChange={(e) => handlePaymentChange(index, 'isCredit', e.target.checked)}
                  />
                  Genera Cuenta por Cobrar
                </label>
                <small className="form-hint">
                  Marca si el pago genera una cuenta por cobrar (crédito al cliente)
                </small>
              </div>
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
          <div className="total-row">
            <span>Subtotal:</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
          <div className="total-row">
            <span>IVA:</span>
            <strong>{formatCurrency(taxTotal)}</strong>
          </div>
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

