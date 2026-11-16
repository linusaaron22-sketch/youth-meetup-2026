import { z } from "zod";

const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;
export const phoneRequired = z.string().trim().regex(PHONE_RE, "err.phone");
export const phoneOptional = z.string().trim().refine((v) => v === "" || PHONE_RE.test(v), "err.phone");
export const nameField = z.string().trim().min(2, "err.name").max(120, "err.tooLong");
export const ageField = z
  .string().trim()
  .regex(/^\d+$/, "err.age")
  .refine((v) => Number.isSafeInteger(Number(v)), "err.ageInvalid")
  .refine((v) => Number(v) >= 14, "err.ageMinimum");

export const personSchema = z.object({
  fullName: nameField,
  age: ageField,
  phone: phoneRequired,
  congregation: z.string().trim().min(1, "err.congregation").max(120, "err.tooLong"),
});

export const companionSchema = z.object({
  fullName: nameField,
  age: ageField,
  phone: phoneOptional,
  congregation: z.string().trim().max(120, "err.tooLong"),
  relationship: z.string().trim().max(60, "err.tooLong"),
});

export const registrationSchema = z.object({
  primary: personSchema,
  companions: z.array(companionSchema).max(15, "err.maxCompanions"),
  selfRegisterNames: z.string().trim().max(500, "err.tooLong"),
  emergency: z.object({
    name: nameField,
    relationship: z.string().trim().min(2, "err.relationship").max(60, "err.tooLong"),
    phone: phoneRequired,
  }),
  guardian: z.object({
    name: z.string().trim().max(120, "err.tooLong"),
    phone: phoneOptional,
    acknowledged: z.boolean(),
  }),
  custom: z.record(z.string(), z.unknown()),
  website: z.string().max(0).optional(), // honeypot
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const walkInSchema = z.object({
  fullName: nameField,
  age: ageField,
  phone: phoneOptional,
  congregation: z.string().trim().max(120, "err.tooLong"),
});
