export interface AddressData {
  cep: string;
  street: string;
  number?: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
}

export class Address {
  constructor(private readonly data: AddressData) {
    this.validate();
  }

  private validate(): void {
    if (!this.data.cep || typeof this.data.cep !== 'string') {
      throw new Error('CEP is required');
    }

    const cleanCep = this.data.cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      throw new Error('CEP must have 8 digits');
    }

    if (!this.data.street || this.data.street.trim().length === 0) {
      throw new Error('Street is required');
    }

    if (!this.data.neighborhood || this.data.neighborhood.trim().length === 0) {
      throw new Error('Neighborhood is required');
    }

    if (!this.data.city || this.data.city.trim().length === 0) {
      throw new Error('City is required');
    }

    if (!this.data.state || this.data.state.trim().length === 0) {
      throw new Error('State is required');
    }

    if (!this.data.country || this.data.country.trim().length === 0) {
      throw new Error('Country is required');
    }
  }

  getCep(): string {
    return this.data.cep;
  }

  getFormattedCep(): string {
    const clean = this.data.cep.replace(/\D/g, '');
    return `${clean.substring(0, 5)}-${clean.substring(5)}`;
  }

  getStreet(): string {
    return this.data.street;
  }

  getNumber(): string | undefined {
    return this.data.number;
  }

  getComplement(): string | undefined {
    return this.data.complement;
  }

  getNeighborhood(): string {
    return this.data.neighborhood;
  }

  getCity(): string {
    return this.data.city;
  }

  getState(): string {
    return this.data.state;
  }

  getCountry(): string {
    return this.data.country;
  }

  getFullAddress(): string {
    const parts = [
      this.data.street,
      this.data.number,
      this.data.complement,
      this.data.neighborhood,
      this.data.city,
      this.data.state,
      this.getFormattedCep(),
      this.data.country,
    ].filter((part) => part && part.trim().length > 0);

    return parts.join(', ');
  }

  toPlainObject(): AddressData {
    return {
      cep: this.data.cep,
      street: this.data.street,
      number: this.data.number,
      complement: this.data.complement,
      neighborhood: this.data.neighborhood,
      city: this.data.city,
      state: this.data.state,
      country: this.data.country,
    };
  }

  toString(): string {
    return this.getFullAddress();
  }

  equals(other: Address): boolean {
    return JSON.stringify(this.data) === JSON.stringify(other.data);
  }
}
