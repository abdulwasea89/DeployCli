import { z } from 'zod';

export const UserSchema = z.object({
    username: z.string().min(3),
    isAuthenticated: z.boolean(),
    lastLogin: z.date().optional()
});

export type UserType = z.infer<typeof UserSchema>;
