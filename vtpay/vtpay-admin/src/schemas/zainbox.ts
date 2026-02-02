import { z } from 'zod';

export const zainboxSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    emailNotification: z.string().email('Invalid email address').min(1, 'Email is required'),
    callbackUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
    tags: z.string().optional()
});

export type ZainboxFormData = z.infer<typeof zainboxSchema>;
