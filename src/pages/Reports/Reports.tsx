import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../api/reports.api';
import Loading from '../../components/common/Loading';
import { formatCurrency, formatDate } from '../../utils/formatters';
import './Reports.css';

export default function Reports() {
  const [reportType, setReportType] = useState<'profitability' | 'daily'>(
    'daily',
  );
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

  const isLoading = dailyLoading || profitLoading;

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
        </div>
      )}
    </div>
  );
}

