import { apiClient } from './client';
import type {
  ProfitabilityReport,
  ReceivableStatement,
  PayableStatement,
  DailyReport,
  PrintableReport,
  ReceivablesConsolidated,
  PayablesConsolidated,
  ProductKardex,
  ValuedInventory,
} from '../types/report.types';

// Transforma los valores DECIMAL de MySQL (strings) a números
function transformReceivablesConsolidated(
  data: ReceivablesConsolidated | Record<string, unknown>,
): ReceivablesConsolidated {
  const report = data as ReceivablesConsolidated;
  return {
    totalBalance:
      typeof report.totalBalance === 'string'
        ? parseFloat(report.totalBalance)
        : report.totalBalance,
    clients: report.clients.map((client) => ({
      client: client.client,
      totalBalance:
        typeof client.totalBalance === 'string'
          ? parseFloat(client.totalBalance)
          : client.totalBalance,
      items: client.items.map((item) => ({
        ...item,
        balance:
          typeof item.balance === 'string'
            ? parseFloat(item.balance)
            : item.balance,
      })),
      aging: {
        current:
          typeof client.aging.current === 'string'
            ? parseFloat(client.aging.current)
            : client.aging.current,
        days31_60:
          typeof client.aging.days31_60 === 'string'
            ? parseFloat(client.aging.days31_60)
            : client.aging.days31_60,
        days61_90:
          typeof client.aging.days61_90 === 'string'
            ? parseFloat(client.aging.days61_90)
            : client.aging.days61_90,
        over90:
          typeof client.aging.over90 === 'string'
            ? parseFloat(client.aging.over90)
            : client.aging.over90,
      },
    })),
    summary: {
      ...report.summary,
      totalBalance:
        typeof report.summary.totalBalance === 'string'
          ? parseFloat(report.summary.totalBalance)
          : report.summary.totalBalance,
      totalCurrent:
        typeof report.summary.totalCurrent === 'string'
          ? parseFloat(report.summary.totalCurrent)
          : report.summary.totalCurrent,
      totalDays31_60:
        typeof report.summary.totalDays31_60 === 'string'
          ? parseFloat(report.summary.totalDays31_60)
          : report.summary.totalDays31_60,
      totalDays61_90:
        typeof report.summary.totalDays61_90 === 'string'
          ? parseFloat(report.summary.totalDays61_90)
          : report.summary.totalDays61_90,
      totalOver90:
        typeof report.summary.totalOver90 === 'string'
          ? parseFloat(report.summary.totalOver90)
          : report.summary.totalOver90,
    },
  };
}

function transformPayablesConsolidated(
  data: PayablesConsolidated | Record<string, unknown>,
): PayablesConsolidated {
  const report = data as PayablesConsolidated;
  return {
    totalBalance:
      typeof report.totalBalance === 'string'
        ? parseFloat(report.totalBalance)
        : report.totalBalance,
    suppliers: report.suppliers.map((supplier) => ({
      supplier: supplier.supplier,
      supplierName: supplier.supplierName,
      totalBalance:
        typeof supplier.totalBalance === 'string'
          ? parseFloat(supplier.totalBalance)
          : supplier.totalBalance,
      items: supplier.items.map((item) => ({
        ...item,
        balance:
          typeof item.balance === 'string'
            ? parseFloat(item.balance)
            : item.balance,
      })),
      aging: {
        current:
          typeof supplier.aging.current === 'string'
            ? parseFloat(supplier.aging.current)
            : supplier.aging.current,
        days31_60:
          typeof supplier.aging.days31_60 === 'string'
            ? parseFloat(supplier.aging.days31_60)
            : supplier.aging.days31_60,
        days61_90:
          typeof supplier.aging.days61_90 === 'string'
            ? parseFloat(supplier.aging.days61_90)
            : supplier.aging.days61_90,
        over90:
          typeof supplier.aging.over90 === 'string'
            ? parseFloat(supplier.aging.over90)
            : supplier.aging.over90,
      },
    })),
    summary: {
      ...report.summary,
      totalBalance:
        typeof report.summary.totalBalance === 'string'
          ? parseFloat(report.summary.totalBalance)
          : report.summary.totalBalance,
      totalCurrent:
        typeof report.summary.totalCurrent === 'string'
          ? parseFloat(report.summary.totalCurrent)
          : report.summary.totalCurrent,
      totalDays31_60:
        typeof report.summary.totalDays31_60 === 'string'
          ? parseFloat(report.summary.totalDays31_60)
          : report.summary.totalDays31_60,
      totalDays61_90:
        typeof report.summary.totalDays61_90 === 'string'
          ? parseFloat(report.summary.totalDays61_90)
          : report.summary.totalDays61_90,
      totalOver90:
        typeof report.summary.totalOver90 === 'string'
          ? parseFloat(report.summary.totalOver90)
          : report.summary.totalOver90,
    },
  };
}

function transformProductKardex(
  data: ProductKardex | Record<string, unknown>,
): ProductKardex {
  const kardex = data as ProductKardex;
  return {
    product: {
      ...kardex.product,
      currentStock:
        typeof kardex.product.currentStock === 'string'
          ? parseFloat(kardex.product.currentStock)
          : kardex.product.currentStock,
      currentCost:
        typeof kardex.product.currentCost === 'string'
          ? parseFloat(kardex.product.currentCost)
          : kardex.product.currentCost,
      salePrice:
        typeof kardex.product.salePrice === 'string'
          ? parseFloat(kardex.product.salePrice)
          : kardex.product.salePrice,
    },
    entries: kardex.entries.map((entry) => ({
      ...entry,
      entry:
        typeof entry.entry === 'string' ? parseFloat(entry.entry) : entry.entry,
      exit:
        typeof entry.exit === 'string' ? parseFloat(entry.exit) : entry.exit,
      balance:
        typeof entry.balance === 'string'
          ? parseFloat(entry.balance)
          : entry.balance,
      unitCost:
        typeof entry.unitCost === 'string'
          ? parseFloat(entry.unitCost)
          : entry.unitCost,
      totalCost:
        typeof entry.totalCost === 'string'
          ? parseFloat(entry.totalCost)
          : entry.totalCost,
    })),
    summary: {
      totalEntries:
        typeof kardex.summary.totalEntries === 'string'
          ? parseFloat(kardex.summary.totalEntries)
          : kardex.summary.totalEntries,
      totalExits:
        typeof kardex.summary.totalExits === 'string'
          ? parseFloat(kardex.summary.totalExits)
          : kardex.summary.totalExits,
      finalBalance:
        typeof kardex.summary.finalBalance === 'string'
          ? parseFloat(kardex.summary.finalBalance)
          : kardex.summary.finalBalance,
      averageCost:
        typeof kardex.summary.averageCost === 'string'
          ? parseFloat(kardex.summary.averageCost)
          : kardex.summary.averageCost,
      totalValue:
        typeof kardex.summary.totalValue === 'string'
          ? parseFloat(kardex.summary.totalValue)
          : kardex.summary.totalValue,
    },
  };
}

function transformValuedInventory(
  data: ValuedInventory | Record<string, unknown>,
): ValuedInventory {
  const inventory = data as ValuedInventory;
  return {
    inventory: inventory.inventory.map((item) => ({
      ...item,
      stock:
        typeof item.stock === 'string' ? parseFloat(item.stock) : item.stock,
      costPrice:
        typeof item.costPrice === 'string'
          ? parseFloat(item.costPrice)
          : item.costPrice,
      salePrice:
        typeof item.salePrice === 'string'
          ? parseFloat(item.salePrice)
          : item.salePrice,
      valueAtCost:
        typeof item.valueAtCost === 'string'
          ? parseFloat(item.valueAtCost)
          : item.valueAtCost,
      valueAtSale:
        typeof item.valueAtSale === 'string'
          ? parseFloat(item.valueAtSale)
          : item.valueAtSale,
      potentialMargin:
        typeof item.potentialMargin === 'string'
          ? parseFloat(item.potentialMargin)
          : item.potentialMargin,
      marginPercent:
        typeof item.marginPercent === 'string'
          ? parseFloat(item.marginPercent)
          : item.marginPercent,
    })),
    summary: {
      ...inventory.summary,
      totalValueAtCost:
        typeof inventory.summary.totalValueAtCost === 'string'
          ? parseFloat(inventory.summary.totalValueAtCost)
          : inventory.summary.totalValueAtCost,
      totalValueAtSale:
        typeof inventory.summary.totalValueAtSale === 'string'
          ? parseFloat(inventory.summary.totalValueAtSale)
          : inventory.summary.totalValueAtSale,
      totalPotentialMargin:
        typeof inventory.summary.totalPotentialMargin === 'string'
          ? parseFloat(inventory.summary.totalPotentialMargin)
          : inventory.summary.totalPotentialMargin,
    },
  };
}

export const reportsApi = {
  profitability: (from: string, to: string) =>
    apiClient.get<ProfitabilityReport>('/reports/profitability', {
      params: { from, to },
    }),
  receivables: (clientCode: string) =>
    apiClient.get<ReceivableStatement>(`/reports/receivables/${clientCode}`),
  payables: (supplierCode: string) =>
    apiClient.get<PayableStatement>(`/reports/payables/${supplierCode}`),
  daily: (date: string) =>
    apiClient.get<DailyReport>('/reports/daily', { params: { date } }),
  printable: (consecutive: string) =>
    apiClient.get<PrintableReport>(`/reports/printable/${consecutive}`),
  receivablesConsolidated: async () => {
    const response = await apiClient.get<ReceivablesConsolidated>(
      '/reports/receivables-consolidated',
    );
    return {
      ...response,
      data: transformReceivablesConsolidated(response.data),
    };
  },
  payablesConsolidated: async () => {
    const response = await apiClient.get<PayablesConsolidated>(
      '/reports/payables-consolidated',
    );
    return {
      ...response,
      data: transformPayablesConsolidated(response.data),
    };
  },
  productKardex: async (productReference: string) => {
    const response = await apiClient.get<ProductKardex>(
      `/reports/kardex/${productReference}`,
    );
    return {
      ...response,
      data: transformProductKardex(response.data),
    };
  },
  valuedInventory: async () => {
    const response = await apiClient.get<ValuedInventory>(
      '/reports/valued-inventory',
    );
    return {
      ...response,
      data: transformValuedInventory(response.data),
    };
  },
};

