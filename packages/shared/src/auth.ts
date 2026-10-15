import { z } from 'zod';

export const RoleSchema = z.enum(['admin', 'user']);
export type Role = z.infer<typeof RoleSchema>;

export const UserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  role: RoleSchema,
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
});
export type User = z.infer<typeof UserSchema>;

const EmailSchema = z.email().trim().toLowerCase().max(254);

export const RegisterSchema = z.object({
  email: EmailSchema,
  password: z.string().min(8).max(128),
});
export type Register = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1).max(128),
});
export type Login = z.infer<typeof LoginSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshToken = z.infer<typeof RefreshTokenSchema>;

export const TokensSchema = z.object({
  tokenType: z.literal('Bearer'),
  accessToken: z.string(),
  // Lifetime of the access token in seconds
  expiresIn: z.number(),
  refreshToken: z.string(),
});
export type Tokens = z.infer<typeof TokensSchema>;

// Changes an admin can make to a user
export const UpdateUserSchema = z
  .object({
    role: RoleSchema,
    isActive: z.boolean(),
  })
  .partial();
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
