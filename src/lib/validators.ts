import { z } from "zod";

export const transactionInputSchema = z
  .object({
    type: z.enum(["income", "expense", "transfer"]),
    amount: z
      .number({ invalid_type_error: "Nominal harus berupa angka." })
      .int("Nominal harus berupa bilangan bulat Rupiah.")
      .positive("Nominal harus lebih dari Rp 0."),
    walletId: z.string().min(1, "Pilih dompet terlebih dahulu."),
    toWalletId: z.string().optional(),
    categoryId: z.string().optional(),
    note: z.string().trim().max(120, "Catatan maksimal 120 karakter."),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD."),
  })
  .superRefine((data, ctx) => {
    if (data.type === "transfer") {
      if (!data.toWalletId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["toWalletId"],
          message: "Pilih dompet tujuan transfer.",
        });
      } else if (data.toWalletId === data.walletId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["toWalletId"],
          message: "Dompet tujuan harus berbeda dari dompet asal.",
        });
      }
    } else if (!data.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["categoryId"],
        message: "Pilih kategori transaksi.",
      });
    }
  });

export const walletInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama dompet minimal 2 karakter.")
    .max(40, "Nama dompet maksimal 40 karakter."),
  type: z.enum(["bank", "ewallet", "cash"]),
  initialBalance: z
    .number({ invalid_type_error: "Saldo awal harus berupa angka." })
    .int("Saldo awal harus berupa bilangan bulat Rupiah.")
    .min(0, "Saldo awal tidak boleh negatif."),
  theme: z.enum(["blue", "emerald", "coral", "amber", "violet"]),
  accountMask: z.string().trim().max(16).optional(),
});

export const budgetInputSchema = z.object({
  categoryId: z.string().min(1, "Pilih kategori pengeluaran."),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Format bulan harus YYYY-MM."),
  limitAmount: z
    .number({ invalid_type_error: "Batas anggaran harus berupa angka." })
    .int("Batas anggaran harus berupa bilangan bulat Rupiah.")
    .positive("Batas anggaran harus lebih dari Rp 0."),
});

export const categoryInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama kategori minimal 2 karakter.")
    .max(32, "Nama kategori maksimal 32 karakter."),
  type: z.enum(["income", "expense"]),
  icon: z.string().min(1, "Pilih ikon kategori."),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Warna harus dalam format hex valid."),
});

export type TransactionInput = z.infer<typeof transactionInputSchema>;
export type WalletInput = z.infer<typeof walletInputSchema>;
export type BudgetInput = z.infer<typeof budgetInputSchema>;
export type CategoryInput = z.infer<typeof categoryInputSchema>;
