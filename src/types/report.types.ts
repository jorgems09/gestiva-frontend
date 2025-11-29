export interface ProfitabilityReport {
  from: string;
  to: string;
  revenue: number; // Ingresos totales (ventas)
  cost: number; // Costos totales (compras)
  expenses: number; // Gastos operativos
  costOfGoodsSold: number; // Costo de productos vendidos
  grossMargin: number; // Margen bruto (revenue - costOfGoodsSold)
  grossMarginPercent: number; // % margen bruto
  netProfit: number; // Utilidad neta (revenue - cost - expenses)
  marginPercent: number; // % margen de rentabilidad neta
}

export interface ReceivableStatement {
  client: {
    id: number;
    code: string;
    name: string;
    email?: string;
    phone?: string;
  } | null;
  balance: number;
  items: Array<{
    id: number;
    originConsecutive: string;
    balance: number;
    status: string;
    dueDate?: string;
    notes?: string;
  }>;
}

export interface PayableStatement {
  supplier: {
    id: number;
    code: string;
    name: string;
    email?: string;
    phone?: string;
  } | null;
  balance: number;
  items: Array<{
    id: number;
    originConsecutive?: string;
    balance: number;
    status: string;
    dueDate?: string;
    notes?: string;
  }>;
}

export interface DailyReport {
  date: string;
  totals: Array<{
    process: string;
    total: number;
  }>;
  documents: any[];
}

export interface PrintableReport {
  header: any;
  details: any[];
  payments: any[];
  totals: {
    subtotal: number;
    tax: number;
    total: number;
  };
}

export interface ReceivablesConsolidated {
  totalBalance: number;
  clients: Array<{
    client: {
      id: number;
      code: string;
      name: string;
      email?: string;
      phone?: string;
    };
    totalBalance: number;
    items: Array<{
      id: number;
      originConsecutive: string;
      balance: number;
      status: string;
      dueDate?: string;
      notes?: string;
    }>;
    aging: {
      current: number;
      days31_60: number;
      days61_90: number;
      over90: number;
    };
  }>;
  summary: {
    totalClients: number;
    totalBalance: number;
    totalCurrent: number;
    totalDays31_60: number;
    totalDays61_90: number;
    totalOver90: number;
  };
}

export interface PayablesConsolidated {
  totalBalance: number;
  suppliers: Array<{
    supplier: {
      id: number;
      code: string;
      name: string;
      email?: string;
      phone?: string;
    } | null;
    supplierName: string;
    totalBalance: number;
    items: Array<{
      id: number;
      originConsecutive?: string;
      balance: number;
      status: string;
      dueDate?: string;
      notes?: string;
    }>;
    aging: {
      current: number;
      days31_60: number;
      days61_90: number;
      over90: number;
    };
  }>;
  summary: {
    totalSuppliers: number;
    totalBalance: number;
    totalCurrent: number;
    totalDays31_60: number;
    totalDays61_90: number;
    totalOver90: number;
  };
}

export interface ProductKardex {
  product: {
    reference: string;
    description: string;
    currentStock: number;
    currentCost: number;
    salePrice: number;
  };
  entries: Array<{
    date: string;
    consecutive: string;
    type: string;
    description: string;
    entry: number;
    exit: number;
    balance: number;
    unitCost: number;
    totalCost: number;
    clientOrSupplier?: string;
  }>;
  summary: {
    totalEntries: number;
    totalExits: number;
    finalBalance: number;
    averageCost: number;
    totalValue: number;
  };
}

export interface ValuedInventory {
  inventory: Array<{
    reference: string;
    description: string;
    stock: number;
    costPrice: number;
    salePrice: number;
    valueAtCost: number;
    valueAtSale: number;
    potentialMargin: number;
    marginPercent: number;
  }>;
  summary: {
    totalProducts: number;
    productsWithStock: number;
    totalValueAtCost: number;
    totalValueAtSale: number;
    totalPotentialMargin: number;
  };
}

