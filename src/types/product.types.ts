export interface Product {
  id: number;
  reference: string;
  description: string;
  salePrice: number;
  costPrice: number;
  stock: number;
}

export interface CreateProductDto {
  reference: string;
  description: string;
  salePrice: number;
  costPrice?: number;
  stock?: number;
}

export type UpdateProductDto = Partial<CreateProductDto>;

