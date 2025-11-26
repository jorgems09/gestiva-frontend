import { ProcessType } from '../constants/process-types';

export interface MovementDetail {
  productReference: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  discountRate?: number;
  taxRate?: number;
  weight?: number;
}

export interface PaymentDetail {
  method: string;
  amount: number;
  currency?: string;
  isCredit?: boolean;
}

export interface RelatedAccountDto {
  reference: string;
  value: number;
}

export interface CreateMovementDto {
  processType?: ProcessType;
  documentDate: string;
  clientCode?: string;
  supplierCode?: string;
  supplierName?: string; // Mantener por compatibilidad
  notes?: string;
  lotNumber?: string;
  processState?: string;
  grossWeight?: number;
  netWeight?: number;
  freightCost?: number;
  retentionRate?: number; // Porcentaje de retención (ej: 2.5). Si no se especifica, usa default. Si es 0, no aplica retención.
  deductionRate?: number; // Porcentaje de deducción (ej: 1). Si no se especifica, usa default. Si es 0, no aplica deducción.
  details: MovementDetail[];
  payments: PaymentDetail[];
  receivablesToSettle?: RelatedAccountDto[];
  payablesToSettle?: RelatedAccountDto[];
  referenceDocuments?: string[];
}

export interface MovementHeader {
  id: number;
  consecutive: string;
  processType: ProcessType;
  supportDocument: string;
  status: number;
  userEmail: string;
  documentDate: string;
  currency: string;
  notes?: string;
  lotNumber?: string;
  processState?: string;
  grossWeight?: number;
  netWeight?: number;
  freightCost?: number;
  supplierName?: string; // Mantener por compatibilidad
  supplier?: Supplier; // Nueva relación
  referenceDocuments?: string[];
  subtotal: number;
  taxTotal: number;
  retentionTotal: number;
  deductionTotal: number;
  financingTotal: number;
  total: number;
  client?: Client;
  details: MovementDetail[];
  payments: PaymentDetail[];
  receivables?: AccountReceivable[];
  payables?: AccountPayable[];
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: number;
  code: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface AccountReceivable {
  id: number;
  originConsecutive: string;
  balance: number;
  status: string;
  dueDate?: string;
  notes?: string;
}

export interface AccountPayable {
  id: number;
  beneficiary: string;
  balance: number;
  status: string;
  dueDate?: string;
  notes?: string;
}

