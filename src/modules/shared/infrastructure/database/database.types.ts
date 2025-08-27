import { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface DatabaseSchema {
  users: UserTable;
  products: ProductTable;
  posts: PostTable;
  post_likes: PostLikeTable;
  post_comments: PostCommentTable;
  groups: GroupTable;
  group_members: GroupMemberTable;
  conversations: ConversationTable;
  conversation_participants: ConversationParticipantTable;
  messages: MessageTable;
  organization_schemas: OrganizationSchemaTable;
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

export interface PostTable {
  id: Generated<string>;
  user_id: string;
  content: string;
  visibility: string;
  media: any;
  tags: string[];
  likes_count: Generated<number>;
  comments_count: Generated<number>;
  shares_count: Generated<number>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Post = Selectable<PostTable>;
export type NewPost = Insertable<PostTable>;
export type PostUpdate = Updateable<PostTable>;

export interface PostLikeTable {
  post_id: string;
  user_id: string;
  created_at: Generated<Date>;
}

export type PostLike = Selectable<PostLikeTable>;
export type NewPostLike = Insertable<PostLikeTable>;
export type PostLikeUpdate = Updateable<PostLikeTable>;

export interface PostCommentTable {
  id: Generated<string>;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type PostComment = Selectable<PostCommentTable>;
export type NewPostComment = Insertable<PostCommentTable>;
export type PostCommentUpdate = Updateable<PostCommentTable>;

export interface GroupTable {
  id: Generated<string>;
  name: string;
  description: string | null;
  privacy: string;
  category: string | null;
  rules: any;
  member_count: Generated<number>;
  owner_id: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Group = Selectable<GroupTable>;
export type NewGroup = Insertable<GroupTable>;
export type GroupUpdate = Updateable<GroupTable>;

export interface GroupMemberTable {
  group_id: string;
  user_id: string;
  role: string;
  joined_at: Generated<Date>;
}

export type GroupMember = Selectable<GroupMemberTable>;
export type NewGroupMember = Insertable<GroupMemberTable>;
export type GroupMemberUpdate = Updateable<GroupMemberTable>;

export interface ConversationTable {
  id: Generated<string>;
  type: string;
  name: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Conversation = Selectable<ConversationTable>;
export type NewConversation = Insertable<ConversationTable>;
export type ConversationUpdate = Updateable<ConversationTable>;

export interface ConversationParticipantTable {
  conversation_id: string;
  user_id: string;
  last_read_at: Date | null;
  joined_at: Generated<Date>;
}

export type ConversationParticipant = Selectable<ConversationParticipantTable>;
export type NewConversationParticipant =
  Insertable<ConversationParticipantTable>;
export type ConversationParticipantUpdate =
  Updateable<ConversationParticipantTable>;

export interface MessageTable {
  id: Generated<string>;
  conversation_id: string;
  sender_id: string;
  type: string;
  content: string | null;
  media_url: string | null;
  is_read: Generated<boolean>;
  is_edited: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Message = Selectable<MessageTable>;
export type NewMessage = Insertable<MessageTable>;
export type MessageUpdate = Updateable<MessageTable>;

export interface OrganizationSchemaTable {
  organization_id: string;
  schema_name: string;
  name: string;
  description?: string;
  status: 'provisioning' | 'active' | 'suspended' | 'deleted';
  created_at: Generated<Date>;
  provisioned_at?: Date;
}

export type OrganizationSchema = Selectable<OrganizationSchemaTable>;
export type NewOrganizationSchema = Insertable<OrganizationSchemaTable>;
export type OrganizationSchemaUpdate = Updateable<OrganizationSchemaTable>;

export type Database = DatabaseSchema;
