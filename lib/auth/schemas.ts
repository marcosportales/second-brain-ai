import { z } from "zod";

export const registerSchema = z.object({
  email: z.email("Ingresa un email válido").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128, "La contraseña es demasiado larga")
    .regex(/[A-Z]/, "Incluye al menos una mayúscula")
    .regex(/[a-z]/, "Incluye al menos una minúscula")
    .regex(/[0-9]/, "Incluye al menos un número"),
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo"),
});

export const loginSchema = z.object({
  email: z.email("Ingresa un email válido").trim().toLowerCase(),
  password: z.string().min(8, "Contraseña inválida"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Ingresa un email válido").trim().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20, "Token inválido"),
  password: registerSchema.shape.password,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
