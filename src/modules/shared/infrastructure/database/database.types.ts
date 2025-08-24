import { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface DatabaseSchema {
  users: UserTable;
  products: ProductTable;
}

export interface UserTable {
  id: Generated<string>;
  email: string;
  name: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

export interface ProductTable {
  id: Generated<string>;
  name: string;
  description: string;
  sku: string;
  price: number;
  stock_quantity: number;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Product = Selectable<ProductTable>;
export type NewProduct = Insertable<ProductTable>;
export type ProductUpdate = Updateable<ProductTable>;

export type Database = DatabaseSchema;
