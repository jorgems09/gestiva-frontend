export interface ProfitabilityReport {
  from: string;
  to: string;
  revenue: number;
  cost: number;
  grossMargin: number;
  marginPercent: number;
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
  beneficiary: string;
  balance: number;
  items: Array<{
    id: number;
    beneficiary: string;
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

