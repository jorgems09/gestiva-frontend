import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../api/reports.api';
import { clientsApi } from '../../api/clients.api';
import Loading from '../../components/common/Loading';
import SearchableSelect from '../../components/common/SearchableSelect';
import { formatCurrency, formatDate } from '../../utils/formatters';
import './Reports.css';

export default function Reports() {
  const [reportType, setReportType] = useState<'profitability' | 'daily' | 'receivables'>(
    'daily',
  );
  const [selectedClientCode, setSelectedClientCode] = useState('');
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

  const { data: receivableStatement, isLoading: receivablesLoading, error: receivablesError } = useQuery({
    queryKey: ['receivables', selectedClientCode],
    queryFn: async () => {
      const response = await reportsApi.receivables(selectedClientCode);
      console.log('Receivables response:', response.data);
      return response.data;
    },
    enabled: reportType === 'receivables' && !!selectedClientCode,
  });

  // Debug: Log cuando cambian los datos
  if (receivableStatement) {
    console.log('ReceivableStatement data:', receivableStatement);
    console.log('Items:', receivableStatement.items);
    console.log('Items length:', receivableStatement.items?.length);
  }
  
  if (receivablesError) {
    console.error('Receivables error:', receivablesError);
  }

  const isLoading = dailyLoading || profitLoading || receivablesLoading;

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
                        <div className="balance-item">
                          <span>Saldo Total:</span>
                          <strong className={receivableStatement.balance > 0 ? 'balance-positive' : 'balance-zero'}>
                            {formatCurrency(receivableStatement.balance)}
                          </strong>
                        </div>
                      </div>

                      {receivableStatement.items && 
                       Array.isArray(receivableStatement.items) && 
                       receivableStatement.items.length > 0 ? (
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
                                  <strong>{formatCurrency(Number(item.balance))}</strong>
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
                          {receivableStatement.balance === 0 
                            ? 'No hay cuentas por cobrar pendientes para este cliente'
                            : 'No se encontraron cuentas por cobrar para este cliente'}
                        </p>
                      )}
                    </>
                  ) : selectedClientCode ? (
                    <p className="no-data">Cliente no encontrado</p>
                  ) : null}
                </div>
              )}

              {reportType === 'receivables' && !selectedClientCode && !receivableStatement && (
                <p className="no-data">Seleccione un cliente para ver su extracto de cartera</p>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
}

