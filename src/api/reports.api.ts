import { apiClient } from './client';
import type {
  ProfitabilityReport,
  ReceivableStatement,
  PayableStatement,
  DailyReport,
  PrintableReport,
} from '../types/report.types';

export const reportsApi = {
  profitability: (from: string, to: string) =>
    apiClient.get<ProfitabilityReport>('/reports/profitability', {
      params: { from, to },
    }),
  receivables: (clientCode: string) =>
    apiClient.get<ReceivableStatement>(`/reports/receivables/${clientCode}`),
  payables: (beneficiary: string) =>
    apiClient.get<PayableStatement>(`/reports/payables/${beneficiary}`),
  daily: (date: string) =>
    apiClient.get<DailyReport>('/reports/daily', { params: { date } }),
  printable: (consecutive: string) =>
    apiClient.get<PrintableReport>(`/reports/printable/${consecutive}`),
};

