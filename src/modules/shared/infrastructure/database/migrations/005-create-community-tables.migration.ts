import { Kysely, sql } from 'kysely';
import { Migration } from './migration.interface';

export const CreateCommunityTablesMigration: Migration = {
  async up(db: Kysely<any>): Promise<void> {
    await db.schema
      .createTable('posts')
      .addColumn('id', 'uuid', (col) =>
        col.primaryKey().defaultTo(sql`gen_random_uuid()`),
      )
      .addColumn('user_id', 'uuid', (col) =>
        col.notNull().references('users.id').onDelete('cascade'),
      )
      .addColumn('content', 'text', (col) => col.notNull())
      .addColumn('visibility', 'varchar(20)', (col) => col.defaultTo('public'))
      .addColumn('media', 'jsonb')
      .addColumn('tags', sql`text[]`)
      .addColumn('likes_count', 'integer', (col) => col.defaultTo(0))
      .addColumn('comments_count', 'integer', (col) => col.defaultTo(0))
      .addColumn('shares_count', 'integer', (col) => col.defaultTo(0))
      .addColumn('created_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .addColumn('updated_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .execute();

    await db.schema
      .createIndex('posts_user_id_idx')
      .on('posts')
      .column('user_id')
      .execute();

    await db.schema
      .createIndex('posts_created_at_idx')
      .on('posts')
      .column('created_at')
      .execute();

    await db.schema
      .createIndex('posts_visibility_idx')
      .on('posts')
      .column('visibility')
      .execute();

    await db.schema
      .createTable('post_likes')
      .addColumn('post_id', 'uuid', (col) =>
        col.notNull().references('posts.id').onDelete('cascade'),
      )
      .addColumn('user_id', 'uuid', (col) =>
        col.notNull().references('users.id').onDelete('cascade'),
      )
      .addColumn('created_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .addPrimaryKeyConstraint('post_likes_pk', ['post_id', 'user_id'])
      .execute();

    await db.schema
      .createTable('post_comments')
      .addColumn('id', 'uuid', (col) =>
        col.primaryKey().defaultTo(sql`gen_random_uuid()`),
      )
      .addColumn('post_id', 'uuid', (col) =>
        col.notNull().references('posts.id').onDelete('cascade'),
      )
      .addColumn('user_id', 'uuid', (col) =>
        col.notNull().references('users.id').onDelete('cascade'),
      )
      .addColumn('parent_comment_id', 'uuid', (col) =>
        col.references('post_comments.id').onDelete('cascade'),
      )
      .addColumn('content', 'text', (col) => col.notNull())
      .addColumn('created_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .addColumn('updated_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .execute();

    await db.schema
      .createIndex('post_comments_post_id_idx')
      .on('post_comments')
      .column('post_id')
      .execute();

    await db.schema
      .createIndex('post_comments_parent_comment_id_idx')
      .on('post_comments')
      .column('parent_comment_id')
      .execute();

    await db.schema
      .createTable('groups')
      .addColumn('id', 'uuid', (col) =>
        col.primaryKey().defaultTo(sql`gen_random_uuid()`),
      )
      .addColumn('name', 'varchar(255)', (col) => col.notNull())
      .addColumn('description', 'text')
      .addColumn('privacy', 'varchar(20)', (col) => col.defaultTo('public'))
      .addColumn('category', 'varchar(100)')
      .addColumn('rules', 'jsonb')
      .addColumn('member_count', 'integer', (col) => col.defaultTo(0))
      .addColumn('owner_id', 'uuid', (col) =>
        col.notNull().references('users.id').onDelete('cascade'),
      )
      .addColumn('created_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .addColumn('updated_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .execute();

    await db.schema
      .createIndex('groups_name_idx')
      .on('groups')
      .column('name')
      .execute();

    await db.schema
      .createIndex('groups_category_idx')
      .on('groups')
      .column('category')
      .execute();

    await db.schema
      .createIndex('groups_owner_id_idx')
      .on('groups')
      .column('owner_id')
      .execute();

    await db.schema
      .createTable('group_members')
      .addColumn('group_id', 'uuid', (col) =>
        col.notNull().references('groups.id').onDelete('cascade'),
      )
      .addColumn('user_id', 'uuid', (col) =>
        col.notNull().references('users.id').onDelete('cascade'),
      )
      .addColumn('role', 'varchar(20)', (col) => col.defaultTo('member'))
      .addColumn('joined_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .addPrimaryKeyConstraint('group_members_pk', ['group_id', 'user_id'])
      .execute();

    await db.schema
      .createTable('conversations')
      .addColumn('id', 'uuid', (col) =>
        col.primaryKey().defaultTo(sql`gen_random_uuid()`),
      )
      .addColumn('type', 'varchar(20)', (col) => col.defaultTo('direct'))
      .addColumn('name', 'varchar(255)')
      .addColumn('created_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .addColumn('updated_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .execute();

    await db.schema
      .createTable('conversation_participants')
      .addColumn('conversation_id', 'uuid', (col) =>
        col.notNull().references('conversations.id').onDelete('cascade'),
      )
      .addColumn('user_id', 'uuid', (col) =>
        col.notNull().references('users.id').onDelete('cascade'),
      )
      .addColumn('last_read_at', 'timestamp')
      .addColumn('joined_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .addPrimaryKeyConstraint('conversation_participants_pk', [
        'conversation_id',
        'user_id',
      ])
      .execute();

    await db.schema
      .createTable('messages')
      .addColumn('id', 'uuid', (col) =>
        col.primaryKey().defaultTo(sql`gen_random_uuid()`),
      )
      .addColumn('conversation_id', 'uuid', (col) =>
        col.notNull().references('conversations.id').onDelete('cascade'),
      )
      .addColumn('sender_id', 'uuid', (col) =>
        col.notNull().references('users.id').onDelete('cascade'),
      )
      .addColumn('type', 'varchar(20)', (col) => col.defaultTo('text'))
      .addColumn('content', 'text')
      .addColumn('media_url', 'text')
      .addColumn('is_read', 'boolean', (col) => col.defaultTo(false))
      .addColumn('is_edited', 'boolean', (col) => col.defaultTo(false))
      .addColumn('created_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .addColumn('updated_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .execute();

    await db.schema
      .createIndex('messages_conversation_id_idx')
      .on('messages')
      .column('conversation_id')
      .execute();

    await db.schema
      .createIndex('messages_sender_id_idx')
      .on('messages')
      .column('sender_id')
      .execute();

    await db.schema
      .createIndex('messages_created_at_idx')
      .on('messages')
      .column('created_at')
      .execute();
  },

  async down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('messages').execute();
    await db.schema.dropTable('conversation_participants').execute();
    await db.schema.dropTable('conversations').execute();
    await db.schema.dropTable('group_members').execute();
    await db.schema.dropTable('groups').execute();
    await db.schema.dropTable('post_comments').execute();
    await db.schema.dropTable('post_likes').execute();
    await db.schema.dropTable('posts').execute();
  },
};
