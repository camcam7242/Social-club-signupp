export type UserRole = 'customer' | 'mechanic' | 'admin';

export interface AuthPayload {
  userId: string;
  role: UserRole;
}

export interface RequestWithUser extends Express.Request {
  user?: AuthPayload;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
