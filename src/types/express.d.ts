import { User } from '../modules/auth/domain/entities/user.entity';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
