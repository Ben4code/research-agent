export interface SessionUser {
  id: string;
  name?: string | null;
  email: string;
  emailVerified?: boolean;
  image?: string | null;
  role?: string | null;
}
