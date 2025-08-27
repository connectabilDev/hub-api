import { Organization } from '../entities/organization.entity';

export interface OrganizationRepository {
  save(organization: Organization): Promise<Organization>;
  findById(id: string): Promise<Organization | null>;
  findBySchemaName(schemaName: string): Promise<Organization | null>;
  findAll(): Promise<Organization[]>;
  update(organization: Organization): Promise<Organization>;
  delete(id: string): Promise<void>;
  existsById(id: string): Promise<boolean>;
  existsBySchemaName(schemaName: string): Promise<boolean>;
}
