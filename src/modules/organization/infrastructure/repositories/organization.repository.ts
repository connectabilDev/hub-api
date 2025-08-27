import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DATABASE_CONNECTION } from '../../../shared/infrastructure/database/database.module';
import { BaseRepository } from '../../../shared/infrastructure/database/base.repository';
import { OrganizationRepository } from '../../domain/repositories/organization.repository.interface';
import {
  Organization,
  OrganizationStatus,
} from '../../domain/entities/organization.entity';

interface OrganizationSchemaTable {
  organization_id: string;
  schema_name: string;
  name: string;
  description?: string;
  status: 'provisioning' | 'active' | 'suspended' | 'deleted';
  created_at: Date;
  provisioned_at?: Date;
}

@Injectable()
export class OrganizationRepositoryImpl
  extends BaseRepository
  implements OrganizationRepository
{
  constructor(@Inject(DATABASE_CONNECTION) db: Kysely<any>) {
    super(db);
  }

  async save(organization: Organization): Promise<Organization> {
    const organizationData = {
      organization_id: organization.getId(),
      schema_name: organization.getSchemaName(),
      name: organization.getName(),
      description: organization.getDescription(),
      status: organization.getStatus(),
      created_at: organization.getCreatedAt() || this.now(),
      provisioned_at: organization.getProvisionedAt(),
    };

    await this.db
      .insertInto('organization_schemas')
      .values(organizationData)
      .onConflict((oc) =>
        oc.column('organization_id').doUpdateSet({
          name: organizationData.name,
          description: organizationData.description,
          status: organizationData.status,
          provisioned_at: organizationData.provisioned_at,
        }),
      )
      .execute();

    return organization;
  }

  async findById(id: string): Promise<Organization | null> {
    const result = await this.db
      .selectFrom('organization_schemas')
      .selectAll()
      .where('organization_id', '=', id)
      .executeTakeFirst();

    if (!result) {
      return null;
    }

    return this.mapToEntity(result);
  }

  async findBySchemaName(schemaName: string): Promise<Organization | null> {
    const result = await this.db
      .selectFrom('organization_schemas')
      .selectAll()
      .where('schema_name', '=', schemaName)
      .executeTakeFirst();

    if (!result) {
      return null;
    }

    return this.mapToEntity(result);
  }

  async findAll(): Promise<Organization[]> {
    const results = await this.db
      .selectFrom('organization_schemas')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();

    return results.map((result) => this.mapToEntity(result));
  }

  async update(organization: Organization): Promise<Organization> {
    await this.db
      .updateTable('organization_schemas')
      .set({
        name: organization.getName(),
        description: organization.getDescription(),
        status: organization.getStatus(),
        provisioned_at: organization.getProvisionedAt(),
      })
      .where('organization_id', '=', organization.getId())
      .execute();

    return organization;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .deleteFrom('organization_schemas')
      .where('organization_id', '=', id)
      .execute();
  }

  async existsById(id: string): Promise<boolean> {
    const result = await this.db
      .selectFrom('organization_schemas')
      .select('organization_id')
      .where('organization_id', '=', id)
      .executeTakeFirst();

    return !!result;
  }

  async existsBySchemaName(schemaName: string): Promise<boolean> {
    const result = await this.db
      .selectFrom('organization_schemas')
      .select('schema_name')
      .where('schema_name', '=', schemaName)
      .executeTakeFirst();

    return !!result;
  }

  private mapToEntity(data: OrganizationSchemaTable): Organization {
    return Organization.reconstitute(
      data.organization_id,
      data.schema_name,
      data.name,
      data.description,
      data.status as OrganizationStatus,
      data.created_at,
      data.provisioned_at,
    );
  }
}
