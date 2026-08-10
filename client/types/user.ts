export type User = {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  isVerified: boolean;
};
