import { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface DatabaseSchema {
  users: UserTable;
  products: ProductTable;
  workspaces: WorkspaceTable;
  workspace_members: WorkspaceMemberTable;
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

export interface WorkspaceTable {
  id: Generated<string>;
  organization_id: string;
  owner_id: string;
  name: string;
  type: string;
  description: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Workspace = Selectable<WorkspaceTable>;
export type NewWorkspace = Insertable<WorkspaceTable>;
export type WorkspaceUpdate = Updateable<WorkspaceTable>;

export interface WorkspaceMemberTable {
  id: Generated<string>;
  workspace_id: string;
  user_id: string;
  role: string;
  invited_by: string | null;
  invited_at: Date | null;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type WorkspaceMember = Selectable<WorkspaceMemberTable>;
export type NewWorkspaceMember = Insertable<WorkspaceMemberTable>;
export type WorkspaceMemberUpdate = Updateable<WorkspaceMemberTable>;

export type Database = DatabaseSchema;
