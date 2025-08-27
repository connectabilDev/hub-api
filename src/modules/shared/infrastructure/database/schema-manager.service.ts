import { Injectable, Inject } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DATABASE_CONNECTION } from './database.module';
import { Organization } from '../../../organization/domain/entities/organization.entity';
import { OrganizationProvisioningError } from '../../../organization/domain/errors/organization-not-found.error';

@Injectable()
export class SchemaManagerService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Kysely<any>) {}

  async provisionSchema(organization: Organization): Promise<void> {
    const schemaName = organization.getSchemaName();

    try {
      await this.createSchema(schemaName);

      await this.registerSchema(organization.getId(), schemaName);

      await this.runMigrations(schemaName);

      await this.createIndexes(schemaName);
    } catch (error) {
      throw new OrganizationProvisioningError(
        organization.getId(),
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  async dropSchema(schemaName: string): Promise<void> {
    await sql`DROP SCHEMA IF EXISTS ${sql.id(schemaName)} CASCADE`.execute(
      this.db,
    );
  }

  private async createSchema(schemaName: string): Promise<void> {
    await sql`CREATE SCHEMA IF NOT EXISTS ${sql.id(schemaName)}`.execute(
      this.db,
    );
  }

  private async registerSchema(
    organizationId: string,
    schemaName: string,
  ): Promise<void> {
    await this.db
      .insertInto('organization_schemas')
      .values({
        organization_id: organizationId,
        schema_name: schemaName,
        status: 'provisioning',
        created_at: new Date(),
      })
      .onConflict((oc) => oc.column('organization_id').doNothing())
      .execute();
  }

  private async runMigrations(schemaName: string): Promise<void> {
    const userProfilesTable = sql`
      CREATE TABLE IF NOT EXISTS ${sql.id(schemaName)}.user_profiles (
        user_id VARCHAR(255) PRIMARY KEY,
        display_name VARCHAR(255),
        bio TEXT,
        avatar_url VARCHAR(500),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `.execute(this.db);

    const postsTable = sql`
      CREATE TABLE IF NOT EXISTS ${sql.id(schemaName)}.posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) REFERENCES ${sql.id(schemaName)}.user_profiles(user_id),
        content TEXT NOT NULL,
        visibility VARCHAR(20) DEFAULT 'public',
        media JSONB,
        tags TEXT[],
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        shares_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `.execute(this.db);

    const postLikesTable = sql`
      CREATE TABLE IF NOT EXISTS ${sql.id(schemaName)}.post_likes (
        post_id UUID REFERENCES ${sql.id(schemaName)}.posts(id) ON DELETE CASCADE,
        user_id VARCHAR(255) REFERENCES ${sql.id(schemaName)}.user_profiles(user_id),
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (post_id, user_id)
      )
    `.execute(this.db);

    const postCommentsTable = sql`
      CREATE TABLE IF NOT EXISTS ${sql.id(schemaName)}.post_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID REFERENCES ${sql.id(schemaName)}.posts(id) ON DELETE CASCADE,
        user_id VARCHAR(255) REFERENCES ${sql.id(schemaName)}.user_profiles(user_id),
        parent_comment_id UUID REFERENCES ${sql.id(schemaName)}.post_comments(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `.execute(this.db);

    const groupsTable = sql`
      CREATE TABLE IF NOT EXISTS ${sql.id(schemaName)}.groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        privacy VARCHAR(20) DEFAULT 'public',
        category VARCHAR(100),
        rules JSONB,
        member_count INTEGER DEFAULT 0,
        owner_id VARCHAR(255) REFERENCES ${sql.id(schemaName)}.user_profiles(user_id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `.execute(this.db);

    const groupMembersTable = sql`
      CREATE TABLE IF NOT EXISTS ${sql.id(schemaName)}.group_members (
        group_id UUID REFERENCES ${sql.id(schemaName)}.groups(id) ON DELETE CASCADE,
        user_id VARCHAR(255) REFERENCES ${sql.id(schemaName)}.user_profiles(user_id),
        role VARCHAR(20) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (group_id, user_id)
      )
    `.execute(this.db);

    const conversationsTable = sql`
      CREATE TABLE IF NOT EXISTS ${sql.id(schemaName)}.conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(20) DEFAULT 'direct',
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `.execute(this.db);

    const conversationParticipantsTable = sql`
      CREATE TABLE IF NOT EXISTS ${sql.id(schemaName)}.conversation_participants (
        conversation_id UUID REFERENCES ${sql.id(schemaName)}.conversations(id) ON DELETE CASCADE,
        user_id VARCHAR(255) REFERENCES ${sql.id(schemaName)}.user_profiles(user_id),
        last_read_at TIMESTAMP,
        joined_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (conversation_id, user_id)
      )
    `.execute(this.db);

    const messagesTable = sql`
      CREATE TABLE IF NOT EXISTS ${sql.id(schemaName)}.messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES ${sql.id(schemaName)}.conversations(id) ON DELETE CASCADE,
        sender_id VARCHAR(255) REFERENCES ${sql.id(schemaName)}.user_profiles(user_id),
        type VARCHAR(20) DEFAULT 'text',
        content TEXT,
        media_url TEXT,
        is_read BOOLEAN DEFAULT false,
        is_edited BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `.execute(this.db);

    const activityLogsTable = sql`
      CREATE TABLE IF NOT EXISTS ${sql.id(schemaName)}.activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100),
        entity_id VARCHAR(255),
        metadata JSONB DEFAULT '{}',
        ip_address INET,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `.execute(this.db);

    await Promise.all([
      userProfilesTable,
      postsTable,
      postLikesTable,
      postCommentsTable,
      groupsTable,
      groupMembersTable,
      conversationsTable,
      conversationParticipantsTable,
      messagesTable,
      activityLogsTable,
    ]);

    await sql`
      UPDATE organization_schemas 
      SET status = 'active', provisioned_at = NOW() 
      WHERE schema_name = ${schemaName}
    `.execute(this.db);
  }

  private async createIndexes(schemaName: string): Promise<void> {
    const indexes = [
      sql`CREATE INDEX IF NOT EXISTS idx_user_created 
          ON ${sql.id(schemaName)}.user_profiles(created_at DESC)`,

      sql`CREATE INDEX IF NOT EXISTS idx_user_updated 
          ON ${sql.id(schemaName)}.user_profiles(updated_at DESC)`,

      sql`CREATE INDEX IF NOT EXISTS idx_user_metadata_role 
          ON ${sql.id(schemaName)}.user_profiles((metadata->>'role'))`,

      sql`CREATE INDEX IF NOT EXISTS idx_posts_user_created 
          ON ${sql.id(schemaName)}.posts(user_id, created_at DESC)`,

      sql`CREATE INDEX IF NOT EXISTS idx_posts_visibility_created 
          ON ${sql.id(schemaName)}.posts(visibility, created_at DESC)`,

      sql`CREATE INDEX IF NOT EXISTS idx_posts_created 
          ON ${sql.id(schemaName)}.posts(created_at DESC)`,

      sql`CREATE INDEX IF NOT EXISTS idx_post_likes_post 
          ON ${sql.id(schemaName)}.post_likes(post_id)`,

      sql`CREATE INDEX IF NOT EXISTS idx_post_comments_post 
          ON ${sql.id(schemaName)}.post_comments(post_id)`,

      sql`CREATE INDEX IF NOT EXISTS idx_post_comments_parent 
          ON ${sql.id(schemaName)}.post_comments(parent_comment_id)`,

      sql`CREATE INDEX IF NOT EXISTS idx_groups_name 
          ON ${sql.id(schemaName)}.groups(name)`,

      sql`CREATE INDEX IF NOT EXISTS idx_groups_category 
          ON ${sql.id(schemaName)}.groups(category)`,

      sql`CREATE INDEX IF NOT EXISTS idx_groups_owner 
          ON ${sql.id(schemaName)}.groups(owner_id)`,

      sql`CREATE INDEX IF NOT EXISTS idx_group_members_user 
          ON ${sql.id(schemaName)}.group_members(user_id)`,

      sql`CREATE INDEX IF NOT EXISTS idx_messages_conversation 
          ON ${sql.id(schemaName)}.messages(conversation_id)`,

      sql`CREATE INDEX IF NOT EXISTS idx_messages_sender 
          ON ${sql.id(schemaName)}.messages(sender_id)`,

      sql`CREATE INDEX IF NOT EXISTS idx_messages_created 
          ON ${sql.id(schemaName)}.messages(created_at DESC)`,

      sql`CREATE INDEX IF NOT EXISTS idx_activity_user_created 
          ON ${sql.id(schemaName)}.activity_logs(user_id, created_at DESC)`,

      sql`CREATE INDEX IF NOT EXISTS idx_activity_entity 
          ON ${sql.id(schemaName)}.activity_logs(entity_type, entity_id)`,

      sql`CREATE INDEX IF NOT EXISTS idx_activity_action_created 
          ON ${sql.id(schemaName)}.activity_logs(action, created_at DESC)`,

      sql`CREATE INDEX IF NOT EXISTS idx_activity_created 
          ON ${sql.id(schemaName)}.activity_logs(created_at DESC)`,
    ];

    await Promise.all(indexes.map((index) => index.execute(this.db)));
  }

  getDbForOrganization(organizationId: string): Kysely<any> {
    const schemaName = `org_${organizationId.replace(/-/g, '_')}`;
    return this.db.withSchema(schemaName);
  }

  getDbForSchema(schemaName: string): Kysely<any> {
    return this.db.withSchema(schemaName);
  }

  async schemaExists(schemaName: string): Promise<boolean> {
    const result = await sql<{ exists: boolean }>`
      SELECT EXISTS(
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = ${schemaName}
      ) as exists
    `.execute(this.db);

    return result.rows[0]?.exists ?? false;
  }

  async getOrganizationBySchema(schemaName: string): Promise<string | null> {
    const result = await this.db
      .selectFrom('organization_schemas')
      .select('organization_id')
      .where('schema_name', '=', schemaName)
      .where('status', '=', 'active')
      .executeTakeFirst();

    return result?.organization_id || null;
  }
}
