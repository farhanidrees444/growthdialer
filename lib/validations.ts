import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").or(z.literal("")),
  phone: z.string().min(7, "Phone number too short"),
  company: z.string().optional(),
  title: z.string().optional(),
  status: z.enum(["new", "contacted", "qualified", "unqualified", "customer"]),
  notes: z.string().optional(),
});

export const settingsProfileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  title: z.string().optional(),
  timezone: z.string(),
  phone: z.string().optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type SettingsProfileInput = z.infer<typeof settingsProfileSchema>;

export const dispositionTypes = [
  'interested',
  'callback',
  'meeting_booked',
  'voicemail',
  'not_interested',
  'wrong_number',
  'gatekeeper',
  'dnc',
] as const;

export const dialRequestSchema = z.object({
  to: z.string().min(7, 'Phone number is required'),
  lead_id: z.string().uuid().optional(),
  call_control_id: z.string().min(1).optional(),
  workspace_id: z.string().uuid().optional(),
});

export const dispositionRequestSchema = z.object({
  disposition: z.enum(dispositionTypes),
  notes: z.string().max(5000).optional(),
  callback_at: z.string().optional(),
  meeting_at: z.string().optional(),
  workspace_id: z.string().uuid().optional(),
});

export type DialRequestInput = z.infer<typeof dialRequestSchema>;
export type DispositionRequestInput = z.infer<typeof dispositionRequestSchema>;
