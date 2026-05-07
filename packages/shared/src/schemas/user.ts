import { z } from 'zod';

export const PublicUserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  rm: z.string().nullable(),
  email: z.string().email(),
  avatarUrl: z.string().nullable(),
  locale: z.string(),
  role: z.enum(['customer', 'staff']),
  cantinaId: z.string().nullable(),
  createdAt: z.string(),
});

export type PublicUser = z.infer<typeof PublicUserSchema>;
