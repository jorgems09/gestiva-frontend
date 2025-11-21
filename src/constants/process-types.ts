export const ProcessType = {
    SALE: 'VENTA',
    PURCHASE: 'COMPRA',
    RECEIPT: 'RECIBO_CAJA',
    EXPENSE: 'EGRESO',
    SPECIAL_IN: 'ENTRADA_ESPECIAL',
    SPECIAL_OUT: 'SALIDA_ESPECIAL',
    WEIGHING: 'PESADA',
    MAQUILA: 'MAQUILA',
  } as const;
  
  export type ProcessType = (typeof ProcessType)[keyof typeof ProcessType];
  

export const PROCESS_TYPE_LABELS: Record<ProcessType, string> = {
  [ProcessType.SALE]: 'Venta',
  [ProcessType.PURCHASE]: 'Compra',
  [ProcessType.RECEIPT]: 'Recibo de Caja',
  [ProcessType.EXPENSE]: 'Egreso',
  [ProcessType.SPECIAL_IN]: 'Entrada Especial',
  [ProcessType.SPECIAL_OUT]: 'Salida Especial',
  [ProcessType.WEIGHING]: 'Pesada',
  [ProcessType.MAQUILA]: 'Maquila',
};

