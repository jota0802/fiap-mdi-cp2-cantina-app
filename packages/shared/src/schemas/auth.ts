import { z } from 'zod';
import { PublicUserSchema } from './user.js';

export const RegisterSchema = z.object({
  email: z.string().trim().toLowerCase().email('auth.register.email_invalid'),
  password: z.string().min(6, 'auth.register.password_too_short').max(128, 'auth.register.password_too_long'),
});

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('auth.login.email_invalid'),
  password: z.string().min(1, 'auth.login.password_required'),
});

export const UpdateMeSchema = z.object({
  name: z.string().trim().min(2, 'Nome precisa ter pelo menos 2 caracteres').optional(),
  rm: z.string().regex(/^[0-9]{6}$/, 'RM precisa ter exatamente 6 dígitos').optional(),
  cantinaId: z.string().nullable().optional(),
});

export const AuthResponseSchema = z.object({
  user: PublicUserSchema,
  token: z.string(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateMeInput = z.infer<typeof UpdateMeSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
