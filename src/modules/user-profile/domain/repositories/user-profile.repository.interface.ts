import { UserProfile } from '../entities/user-profile.entity';

export interface UserProfileRepository {
  save(profile: UserProfile): Promise<UserProfile>;
  findById(id: string): Promise<UserProfile | null>;
  findByLogtoUserId(logtoUserId: string): Promise<UserProfile | null>;
  findByCpf(cpf: string): Promise<UserProfile | null>;
  update(profile: UserProfile): Promise<UserProfile>;
  delete(id: string): Promise<void>;
  existsById(id: string): Promise<boolean>;
  existsByLogtoUserId(logtoUserId: string): Promise<boolean>;
  existsByCpf(cpf: string): Promise<boolean>;
}
