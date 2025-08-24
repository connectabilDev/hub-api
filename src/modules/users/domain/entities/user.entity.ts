export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: {
    id?: string;
    email: string;
    name: string;
  }): UserEntity {
    const now = new Date();
    return new UserEntity(
      props.id || crypto.randomUUID(),
      props.email,
      props.name,
      now,
      now,
    );
  }

  updateName(name: string): UserEntity {
    return new UserEntity(
      this.id,
      this.email,
      name,
      this.createdAt,
      new Date(),
    );
  }
}
