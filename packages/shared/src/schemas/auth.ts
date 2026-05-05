import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().trim().min(2, 'auth.register.name_too_short').max(80, 'auth.register.name_too_long'),
  email: z.string().trim().toLowerCase().email('auth.register.email_invalid'),
  password: z.string().min(6, 'auth.register.password_too_short').max(128, 'auth.register.password_too_long'),
});

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('auth.login.email_invalid'),
  password: z.string().min(1, 'auth.login.password_required'),
});

export const AuthResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    avatarUrl: z.string().nullable(),
    locale: z.string(),
    role: z.enum(['customer', 'staff']),
    createdAt: z.string(),
  }),
  token: z.string(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
