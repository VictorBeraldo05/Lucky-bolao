import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(3, "Informe seu nome completo."),
  email: z.email("Informe um e-mail valido."),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
  cpf: z
    .string()
    .min(1, "Informe seu CPF.")
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => /^\d{11}$/.test(value), "Informe um CPF valido."),
  referralCode: z.string().trim().min(3).max(100).optional().nullable(),
});

export const loginSchema = z.object({
  email: z.email("Informe um e-mail valido."),
  password: z.string().min(6, "Senha invalida."),
});

export const purchaseSchema = z.object({
  poolId: z.string().min(1),
  quantity: z.number().int().positive().max(50),
});

export const cartItemSchema = z.object({
  poolId: z.string().min(1),
  quantity: z.number().int().positive().max(50),
});

export const walletTopupSchema = z.object({
  packageId: z.number().int().positive(),
});

export const pixPaymentSchema = z.object({
  email: z.email("Informe um e-mail valido."),
  name: z.string().min(2, "Informe o nome."),
  cpf: z
    .string()
    .min(1, "Informe o CPF.")
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => /^\d{11}$/.test(value), "Informe um CPF valido."),
  title: z.string().min(2).max(255),
  amount: z.coerce.number().positive().max(1000000),
  referenceId: z.string().min(1).max(255).optional(),
});

export const profileCpfSchema = z.object({
  cpf: z
    .string()
    .min(1, "Informe seu CPF.")
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => /^\d{11}$/.test(value), "Informe um CPF valido."),
});

export const manualCreditSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().positive().max(100000),
  description: z.string().min(4).max(255),
});

export const resultSchema = z.object({
  contestId: z.string().min(1),
  drawnNumbers: z.array(z.number().int().min(1).max(99)).min(1),
  prizeBreakdown: z.record(z.string(), z.number().nonnegative()),
  source: z.string().min(2).max(255).optional(),
});
