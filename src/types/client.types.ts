export interface Client {
  id: number;
  code: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface CreateClientDto {
  code: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {}

