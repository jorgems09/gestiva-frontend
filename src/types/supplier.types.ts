export interface Supplier {
  id: number;
  code: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface CreateSupplierDto {
  code: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {}

