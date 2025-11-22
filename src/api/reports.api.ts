import { apiClient } from './client';
import type {
  ProfitabilityReport,
  ReceivableStatement,
  PayableStatement,
  DailyReport,
  PrintableReport,
} from '../types/report.types';

// Transforma los valores DECIMAL de MySQL (strings) a números
function transformReceivableStatement(
  data: ReceivableStatement | Record<string, unknown>,
): ReceivableStatement {
  const statement = data as ReceivableStatement;
  return {
    client: statement.client,
    balance:
      typeof statement.balance === 'string'
        ? parseFloat(statement.balance)
        : statement.balance,
    items: statement.items.map((item) => ({
      id: item.id,
      originConsecutive: item.originConsecutive,
      balance:
        typeof item.balance === 'string'
          ? parseFloat(item.balance)
          : item.balance,
      status: item.status,
      dueDate: item.dueDate,
      notes: item.notes,
    })),
  };
}

export const reportsApi = {
  profitability: (from: string, to: string) =>
    apiClient.get<ProfitabilityReport>('/reports/profitability', {
      params: { from, to },
    }),
  receivables: async (clientCode: string) => {
    const response = await apiClient.get<ReceivableStatement>(
      `/reports/receivables/${clientCode}`,
    );
    return {
      ...response,
      data: transformReceivableStatement(response.data),
    };
  },
  payables: (beneficiary: string) =>
    apiClient.get<PayableStatement>(`/reports/payables/${beneficiary}`),
  daily: (date: string) =>
    apiClient.get<DailyReport>('/reports/daily', { params: { date } }),
  printable: (consecutive: string) =>
    apiClient.get<PrintableReport>(`/reports/printable/${consecutive}`),
};

