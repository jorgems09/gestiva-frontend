import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../api/reports.api';
import { clientsApi } from '../../api/clients.api';
import { suppliersApi } from '../../api/suppliers.api';
import { productsApi } from '../../api/products.api';
import Loading from '../../components/common/Loading';
import SearchableSelect from '../../components/common/SearchableSelect';
import { formatCurrency, formatDate } from '../../utils/formatters';
import './Reports.css';

export default function Reports() {
  const [reportType, setReportType] = useState<
    | 'profitability'
    | 'daily'
    | 'receivables'
    | 'payables'
    | 'receivables-consolidated'
    | 'payables-consolidated'
    | 'kardex'
    | 'valued-inventory'
  >('daily');
  const [selectedClientCode, setSelectedClientCode] = useState('');
  const [selectedSupplierCode, setSelectedSupplierCode] = useState('');
  const [selectedProductReference, setSelectedProductReference] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  )
    .toISOString()
    .split('T')[0];

  const { data: dailyReport, isLoading: dailyLoading } = useQuery({
    queryKey: ['daily-report', today],
    queryFn: () => reportsApi.daily(today).then((res) => res.data),
    enabled: reportType === 'daily',
  });

  const { data: profitability, isLoading: profitLoading } = useQuery({
    queryKey: ['profitability', firstDayOfMonth, today],
    queryFn: () =>
      reportsApi.profitability(firstDayOfMonth, today).then((res) => res.data),
    enabled: reportType === 'profitability',
  });

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

  const { data: receivablesConsolidated, isLoading: receivablesConsolidatedLoading } = useQuery({
    queryKey: ['receivables-consolidated'],
    queryFn: () => reportsApi.receivablesConsolidated().then((res) => res.data),
    enabled: reportType === 'receivables-consolidated',
  });

  const { data: payablesConsolidated, isLoading: payablesConsolidatedLoading } = useQuery({
    queryKey: ['payables-consolidated'],
    queryFn: () => reportsApi.payablesConsolidated().then((res) => res.data),
    enabled: reportType === 'payables-consolidated',
  });

  const { data: productKardex, isLoading: kardexLoading } = useQuery({
    queryKey: ['kardex', selectedProductReference],
    queryFn: () => reportsApi.productKardex(selectedProductReference).then((res) => res.data),
    enabled: reportType === 'kardex' && !!selectedProductReference,
  });

  const { data: valuedInventory, isLoading: valuedInventoryLoading } = useQuery({
    queryKey: ['valued-inventory'],
    queryFn: () => reportsApi.valuedInventory().then((res) => res.data),
    enabled: reportType === 'valued-inventory',
  });

  const { data: receivableStatement, isLoading: receivablesLoading } = useQuery({
    queryKey: ['receivables', selectedClientCode],
    queryFn: () => reportsApi.receivables(selectedClientCode).then((res) => res.data),
    enabled: reportType === 'receivables' && !!selectedClientCode,
  });

  const { data: payableStatement, isLoading: payablesLoading } = useQuery({
    queryKey: ['payables', selectedSupplierCode],
    queryFn: () => reportsApi.payables(selectedSupplierCode).then((res) => res.data),
    enabled: reportType === 'payables' && !!selectedSupplierCode,
  });

  const isLoading =
    dailyLoading ||
    profitLoading ||
    receivablesLoading ||
    payablesLoading ||
    receivablesConsolidatedLoading ||
    payablesConsolidatedLoading ||
    kardexLoading ||
    valuedInventoryLoading;

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Reportes</h1>
        <div className="report-tabs">
          <button
            className={reportType === 'daily' ? 'active' : ''}
            onClick={() => setReportType('daily')}
          >
            Informe Diario
          </button>
          <button
            className={reportType === 'profitability' ? 'active' : ''}
            onClick={() => setReportType('profitability')}
          >
            Rentabilidad
          </button>
          <button
            className={reportType === 'receivables' ? 'active' : ''}
            onClick={() => setReportType('receivables')}
          >
            Extractos de Cartera
          </button>
          <button
            className={reportType === 'payables' ? 'active' : ''}
            onClick={() => setReportType('payables')}
          >
            Extractos de Proveedores
          </button>
          <button
            className={reportType === 'receivables-consolidated' ? 'active' : ''}
            onClick={() => setReportType('receivables-consolidated')}
          >
            Cartera Consolidada
          </button>
          <button
            className={reportType === 'payables-consolidated' ? 'active' : ''}
            onClick={() => setReportType('payables-consolidated')}
          >
            Proveedores Consolidado
          </button>
          <button
            className={reportType === 'kardex' ? 'active' : ''}
            onClick={() => setReportType('kardex')}
          >
            Kardex
          </button>
          <button
            className={reportType === 'valued-inventory' ? 'active' : ''}
            onClick={() => setReportType('valued-inventory')}
          >
            Inventario Valorizado
          </button>
        </div>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <div className="report-content">
          {reportType === 'daily' && dailyReport && (
            <div className="report-card">
              <h2>Informe Diario - {formatDate(dailyReport.date)}</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Proceso</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyReport.totals.map((item, index) => (
                    <tr key={index}>
                      <td>{item.process}</td>
                      <td>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'profitability' && profitability && (
            <div className="report-card">
              <h2>
                Rentabilidad - {formatDate(firstDayOfMonth)} a{' '}
                {formatDate(today)}
              </h2>
              <div className="profitability-grid">
                <div className="profit-item">
                  <span>Ingresos:</span>
                  <strong>{formatCurrency(profitability.revenue)}</strong>
                </div>
                <div className="profit-item">
                  <span>Costos:</span>
                  <strong>{formatCurrency(profitability.cost)}</strong>
                </div>
                <div className="profit-item highlight">
                  <span>Margen Bruto:</span>
                  <strong>{formatCurrency(profitability.grossMargin)}</strong>
                </div>
                <div className="profit-item">
                  <span>Margen %:</span>
                  <strong>{profitability.marginPercent.toFixed(2)}%</strong>
                </div>
              </div>
            </div>
          )}

          {reportType === 'receivables' && (
            <div className="report-card">
              <h2>Extracto de Cuentas por Cobrar</h2>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Seleccionar Cliente *</label>
                <SearchableSelect
                  options={
                    clients?.map((c) => ({
                      value: c.code,
                      label: `${c.code} - ${c.name}`,
                    })) || []
                  }
                  value={selectedClientCode}
                  onChange={setSelectedClientCode}
                  placeholder="Buscar cliente por código o nombre..."
                  searchPlaceholder="Escriba para buscar cliente..."
                />
              </div>

              {receivableStatement && (
                <div className="receivables-statement">
                  {receivableStatement.client ? (
                    <>
                      <div className="client-info">
                        <h3>
                          {receivableStatement.client.name} ({receivableStatement.client.code})
                        </h3>
                        {receivableStatement.client.email && (
                          <p>Email: {receivableStatement.client.email}</p>
                        )}
                        {receivableStatement.client.phone && (
                          <p>Teléfono: {receivableStatement.client.phone}</p>
                        )}
                      </div>
                      <div className="balance-summary">
                        <div className="balance-item primary">
                          <span>Saldo Total:</span>
                          <strong className={receivableStatement.balance > 0 ? 'balance-primary' : 'balance-zero'}>
                            {formatCurrency(receivableStatement.balance)}
                          </strong>
                        </div>
                      </div>

                      {receivableStatement.items.length > 0 ? (
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Consecutivo Origen</th>
                              <th>Saldo</th>
                              <th>Estado</th>
                              <th>Fecha Vencimiento</th>
                              <th>Notas</th>
                            </tr>
                          </thead>
                          <tbody>
                            {receivableStatement.items.map((item) => (
                              <tr key={item.id}>
                                <td>{item.originConsecutive}</td>
                                <td>
                                  <strong>{formatCurrency(item.balance)}</strong>
                                </td>
                                <td>
                                  <span
                                    className={`status-badge ${
                                      item.status === 'PENDIENTE'
                                        ? 'pending'
                                        : item.status === 'CANCELADA'
                                        ? 'cancelled'
                                        : 'active'
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                </td>
                                <td>
                                  {item.dueDate ? formatDate(item.dueDate) : '-'}
                                </td>
                                <td>{item.notes || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="no-data">No hay cuentas por cobrar para este cliente</p>
                      )}
                    </>
                  ) : (
                    <p className="no-data">Cliente no encontrado</p>
                  )}
                </div>
              )}

              {reportType === 'receivables' && !selectedClientCode && (
                <p className="no-data">Seleccione un cliente para ver su extracto de cartera</p>
              )}
            </div>
          )}

          {reportType === 'payables' && (
            <div className="report-card">
              <h2>Extracto de Cuentas por Pagar</h2>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Seleccionar Proveedor *</label>
                <SearchableSelect
                  options={
                    suppliers?.map((s) => ({
                      value: s.code,
                      label: `${s.code} - ${s.name}`,
                    })) || []
                  }
                  value={selectedSupplierCode}
                  onChange={setSelectedSupplierCode}
                  placeholder="Buscar proveedor por código o nombre..."
                  searchPlaceholder="Escriba para buscar proveedor..."
                />
              </div>

              {payableStatement && (
                <div className="receivables-statement">
                  {payableStatement.supplier ? (
                    <>
                      <div className="client-info">
                        <h3>
                          {payableStatement.supplier.name} ({payableStatement.supplier.code})
                        </h3>
                        {payableStatement.supplier.email && (
                          <p>Email: {payableStatement.supplier.email}</p>
                        )}
                        {payableStatement.supplier.phone && (
                          <p>Teléfono: {payableStatement.supplier.phone}</p>
                        )}
                      </div>
                      <div className="balance-summary">
                        <div className="balance-item primary">
                          <span>Saldo Total:</span>
                          <strong className={payableStatement.balance > 0 ? 'balance-primary' : 'balance-zero'}>
                            {formatCurrency(payableStatement.balance)}
                          </strong>
                        </div>
                      </div>

                      {payableStatement.items.length > 0 ? (
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Consecutivo Origen</th>
                              <th>Saldo</th>
                              <th>Estado</th>
                              <th>Fecha Vencimiento</th>
                              <th>Notas</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payableStatement.items.map((item) => (
                              <tr key={item.id}>
                                <td>{item.originConsecutive || '-'}</td>
                                <td>
                                  <strong>{formatCurrency(item.balance)}</strong>
                                </td>
                                <td>
                                  <span
                                    className={`status-badge ${
                                      item.status === 'PENDIENTE'
                                        ? 'pending'
                                        : item.status === 'CANCELADA'
                                        ? 'cancelled'
                                        : 'active'
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                </td>
                                <td>
                                  {item.dueDate ? formatDate(item.dueDate) : '-'}
                                </td>
                                <td>{item.notes || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="no-data">
                          {payableStatement.balance === 0
                            ? 'No hay cuentas por pagar pendientes para este proveedor'
                            : 'No se encontraron cuentas por pagar para este proveedor'}
                        </p>
                      )}
                    </>
                  ) : selectedSupplierCode ? (
                    <p className="no-data">Proveedor no encontrado</p>
                  ) : null}
                </div>
              )}

              {reportType === 'payables' && !selectedSupplierCode && !payableStatement && (
                <p className="no-data">Seleccione un proveedor para ver su extracto de cuentas por pagar</p>
              )}
            </div>
          )}

          {reportType === 'receivables-consolidated' && receivablesConsolidated && (
            <div className="report-card">
              <h2>Estado de Cuentas por Cobrar Consolidado</h2>
              <div className="balance-summary">
                <div className="balance-item primary">
                  <span>Total Cartera:</span>
                  <strong className="balance-primary">
                    {formatCurrency(receivablesConsolidated.totalBalance)}
                  </strong>
                </div>
                <div className="balance-item secondary">
                  <span>Total Clientes:</span>
                  <strong>{receivablesConsolidated.summary.totalClients}</strong>
                </div>
              </div>

              <div className="aging-summary">
                <h3>Resumen por Antigüedad</h3>
                <div className="aging-grid">
                  <div
                    className={`aging-item clickable ${receivablesConsolidated.summary.totalCurrent > 0 ? 'has-value' : ''}`}
                    onClick={() => {
                      // Scroll a la tabla y resaltar filas con saldo en 0-30 días
                      const table = document.querySelector('.data-table');
                      if (table) {
                        table.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    title="Hacer clic para ver detalles"
                  >
                    <span>0-30 días:</span>
                    <strong>{formatCurrency(receivablesConsolidated.summary.totalCurrent)}</strong>
                  </div>
                  <div
                    className={`aging-item clickable ${receivablesConsolidated.summary.totalDays31_60 > 0 ? 'has-value' : ''}`}
                    onClick={() => {
                      const table = document.querySelector('.data-table');
                      if (table) {
                        table.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    title="Hacer clic para ver detalles"
                  >
                    <span>31-60 días:</span>
                    <strong>{formatCurrency(receivablesConsolidated.summary.totalDays31_60)}</strong>
                  </div>
                  <div
                    className={`aging-item clickable ${receivablesConsolidated.summary.totalDays61_90 > 0 ? 'has-value' : ''}`}
                    onClick={() => {
                      const table = document.querySelector('.data-table');
                      if (table) {
                        table.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    title="Hacer clic para ver detalles"
                  >
                    <span>61-90 días:</span>
                    <strong>{formatCurrency(receivablesConsolidated.summary.totalDays61_90)}</strong>
                  </div>
                  <div
                    className={`aging-item clickable warning ${receivablesConsolidated.summary.totalOver90 > 0 ? 'has-value' : ''}`}
                    onClick={() => {
                      const table = document.querySelector('.data-table');
                      if (table) {
                        table.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    title="Hacer clic para ver detalles"
                  >
                    <span>Más de 90 días:</span>
                    <strong>{formatCurrency(receivablesConsolidated.summary.totalOver90)}</strong>
                  </div>
                </div>
              </div>

              {receivablesConsolidated.clients.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Saldo Total</th>
                      <th>0-30 días</th>
                      <th>31-60 días</th>
                      <th>61-90 días</th>
                      <th>+90 días</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivablesConsolidated.clients.map((clientData) => (
                      <tr key={clientData.client.id}>
                        <td>
                          <strong>{clientData.client.name}</strong>
                          <br />
                          <small>{clientData.client.code}</small>
                        </td>
                        <td>
                          <strong>{formatCurrency(clientData.totalBalance)}</strong>
                        </td>
                        <td>{formatCurrency(clientData.aging.current)}</td>
                        <td>{formatCurrency(clientData.aging.days31_60)}</td>
                        <td>{formatCurrency(clientData.aging.days61_90)}</td>
                        <td className={clientData.aging.over90 > 0 ? 'warning-cell' : ''}>
                          {formatCurrency(clientData.aging.over90)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">No hay cuentas por cobrar pendientes</p>
              )}
            </div>
          )}

          {reportType === 'payables-consolidated' && payablesConsolidated && (
            <div className="report-card">
              <h2>Estado de Cuentas por Pagar Consolidado</h2>
              <div className="balance-summary">
                <div className="balance-item primary">
                  <span>Total Obligaciones:</span>
                  <strong className="balance-primary">
                    {formatCurrency(payablesConsolidated.totalBalance)}
                  </strong>
                </div>
                <div className="balance-item secondary">
                  <span>Total Proveedores:</span>
                  <strong>{payablesConsolidated.summary.totalSuppliers}</strong>
                </div>
              </div>

              <div className="aging-summary">
                <h3>Resumen por Antigüedad</h3>
                <div className="aging-grid">
                  <div
                    className={`aging-item clickable ${payablesConsolidated.summary.totalCurrent > 0 ? 'has-value' : ''}`}
                    onClick={() => {
                      const table = document.querySelector('.data-table');
                      if (table) {
                        table.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    title="Hacer clic para ver detalles"
                  >
                    <span>0-30 días:</span>
                    <strong>{formatCurrency(payablesConsolidated.summary.totalCurrent)}</strong>
                  </div>
                  <div
                    className={`aging-item clickable ${payablesConsolidated.summary.totalDays31_60 > 0 ? 'has-value' : ''}`}
                    onClick={() => {
                      const table = document.querySelector('.data-table');
                      if (table) {
                        table.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    title="Hacer clic para ver detalles"
                  >
                    <span>31-60 días:</span>
                    <strong>{formatCurrency(payablesConsolidated.summary.totalDays31_60)}</strong>
                  </div>
                  <div
                    className={`aging-item clickable ${payablesConsolidated.summary.totalDays61_90 > 0 ? 'has-value' : ''}`}
                    onClick={() => {
                      const table = document.querySelector('.data-table');
                      if (table) {
                        table.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    title="Hacer clic para ver detalles"
                  >
                    <span>61-90 días:</span>
                    <strong>{formatCurrency(payablesConsolidated.summary.totalDays61_90)}</strong>
                  </div>
                  <div
                    className={`aging-item clickable warning ${payablesConsolidated.summary.totalOver90 > 0 ? 'has-value' : ''}`}
                    onClick={() => {
                      const table = document.querySelector('.data-table');
                      if (table) {
                        table.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    title="Hacer clic para ver detalles"
                  >
                    <span>Más de 90 días:</span>
                    <strong>{formatCurrency(payablesConsolidated.summary.totalOver90)}</strong>
                  </div>
                </div>
              </div>

              {payablesConsolidated.suppliers.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Proveedor</th>
                      <th>Saldo Total</th>
                      <th>0-30 días</th>
                      <th>31-60 días</th>
                      <th>61-90 días</th>
                      <th>+90 días</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payablesConsolidated.suppliers.map((supplierData, index) => (
                      <tr key={supplierData.supplier?.id ?? index}>
                        <td>
                          <strong>{supplierData.supplierName}</strong>
                          {supplierData.supplier && (
                            <>
                              <br />
                              <small>{supplierData.supplier.code}</small>
                            </>
                          )}
                        </td>
                        <td>
                          <strong>{formatCurrency(supplierData.totalBalance)}</strong>
                        </td>
                        <td>{formatCurrency(supplierData.aging.current)}</td>
                        <td>{formatCurrency(supplierData.aging.days31_60)}</td>
                        <td>{formatCurrency(supplierData.aging.days61_90)}</td>
                        <td className={supplierData.aging.over90 > 0 ? 'warning-cell' : ''}>
                          {formatCurrency(supplierData.aging.over90)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">No hay cuentas por pagar pendientes</p>
              )}
            </div>
          )}

          {reportType === 'kardex' && (
            <div className="report-card">
              <h2>Kardex de Producto</h2>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Seleccionar Producto *</label>
                <SearchableSelect
                  options={
                    products?.map((p) => ({
                      value: p.reference,
                      label: `${p.reference} - ${p.description}`,
                    })) || []
                  }
                  value={selectedProductReference}
                  onChange={setSelectedProductReference}
                  placeholder="Buscar producto por referencia o nombre..."
                  searchPlaceholder="Escriba para buscar producto..."
                />
              </div>

              {productKardex && (
                <div className="kardex-report">
                  <div className="product-info">
                    <h3>
                      {productKardex.product.description} ({productKardex.product.reference})
                    </h3>
                    <div className="product-details">
                      <div>
                        <span>Stock Actual:</span>
                        <strong>{productKardex.product.currentStock}</strong>
                      </div>
                      <div>
                        <span>Costo Actual:</span>
                        <strong>{formatCurrency(productKardex.product.currentCost)}</strong>
                      </div>
                      <div>
                        <span>Precio de Venta:</span>
                        <strong>{formatCurrency(productKardex.product.salePrice)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="kardex-summary">
                    <h3>Resumen</h3>
                    <div className="summary-grid">
                      <div>
                        <span>Total Entradas:</span>
                        <strong>{productKardex.summary.totalEntries}</strong>
                      </div>
                      <div>
                        <span>Total Salidas:</span>
                        <strong>{productKardex.summary.totalExits}</strong>
                      </div>
                      <div>
                        <span>Saldo Final:</span>
                        <strong>{productKardex.summary.finalBalance}</strong>
                      </div>
                      <div>
                        <span>Costo Promedio:</span>
                        <strong>{formatCurrency(productKardex.summary.averageCost)}</strong>
                      </div>
                      <div>
                        <span>Valor Total:</span>
                        <strong>{formatCurrency(productKardex.summary.totalValue)}</strong>
                      </div>
                    </div>
                  </div>

                  {productKardex.entries.length > 0 ? (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Consecutivo</th>
                          <th>Tipo</th>
                          <th>Entrada</th>
                          <th>Salida</th>
                          <th>Saldo</th>
                          <th>Costo Unit.</th>
                          <th>Valor Total</th>
                          <th>Cliente/Proveedor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productKardex.entries.map((entry, index) => (
                          <tr key={index}>
                            <td>{formatDate(entry.date)}</td>
                            <td>{entry.consecutive}</td>
                            <td>{entry.type}</td>
                            <td>{entry.entry > 0 ? entry.entry : '-'}</td>
                            <td>{entry.exit > 0 ? entry.exit : '-'}</td>
                            <td>
                              <strong>{entry.balance}</strong>
                            </td>
                            <td>{formatCurrency(entry.unitCost)}</td>
                            <td>{formatCurrency(entry.totalCost)}</td>
                            <td>{entry.clientOrSupplier || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="no-data">No hay movimientos para este producto</p>
                  )}
                </div>
              )}

              {reportType === 'kardex' && !selectedProductReference && (
                <p className="no-data">Seleccione un producto para ver su kardex</p>
              )}
            </div>
          )}

          {reportType === 'valued-inventory' && valuedInventory && (
            <div className="report-card">
              <h2>Inventario Valorizado</h2>
              <div className="inventory-summary">
                <div className="summary-grid">
                  <div>
                    <span>Total Productos:</span>
                    <strong>{valuedInventory.summary.totalProducts}</strong>
                  </div>
                  <div>
                    <span>Productos con Stock:</span>
                    <strong>{valuedInventory.summary.productsWithStock}</strong>
                  </div>
                  <div>
                    <span>Valor a Costo:</span>
                    <strong>{formatCurrency(valuedInventory.summary.totalValueAtCost)}</strong>
                  </div>
                  <div>
                    <span>Valor a Venta:</span>
                    <strong>{formatCurrency(valuedInventory.summary.totalValueAtSale)}</strong>
                  </div>
                  <div className={`highlight ${valuedInventory.summary.totalPotentialMargin > 0 ? 'has-value' : ''}`}>
                    <span>Margen Potencial:</span>
                    <strong>{formatCurrency(valuedInventory.summary.totalPotentialMargin)}</strong>
                  </div>
                </div>
              </div>

              {valuedInventory.inventory.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Referencia</th>
                      <th>Descripción</th>
                      <th>Stock</th>
                      <th>Costo Unit.</th>
                      <th>Precio Venta</th>
                      <th>Valor a Costo</th>
                      <th>Valor a Venta</th>
                      <th>Margen Potencial</th>
                      <th>Margen %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valuedInventory.inventory.map((item) => (
                      <tr key={item.reference}>
                        <td>
                          <strong>{item.reference}</strong>
                        </td>
                        <td>{item.description}</td>
                        <td>{item.stock}</td>
                        <td>{formatCurrency(item.costPrice)}</td>
                        <td>{formatCurrency(item.salePrice)}</td>
                        <td>{formatCurrency(item.valueAtCost)}</td>
                        <td>{formatCurrency(item.valueAtSale)}</td>
                        <td>{formatCurrency(item.potentialMargin)}</td>
                        <td>{item.marginPercent.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">No hay productos con stock</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

