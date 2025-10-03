import { z } from "zod"

export const studentCreateSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email").max(255),
  phone: z.string().max(50).optional().nullable(),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD")
    .optional()
    .nullable(),
  course: z.string().max(150).optional().nullable(),
  year: z.coerce
    .number()
    .int()
    .min(1, "Year must be at least 1")
    .max(8, "Year must be at most 8")
    .optional()
    .nullable(),
  address: z.string().max(255).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

export const studentUpdateSchema = studentCreateSchema.partial()

export type StudentCreateInput = z.infer<typeof studentCreateSchema>
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>

export const sortableFields = ["first_name", "last_name", "email", "course", "year", "created_at"] as const
export type SortField = "first_name" | "last_name" | "email" | "course" | "year" | "created_at"

export function validateSort(
  field: string | undefined,
  dir: string | undefined,
): { field: SortField; dir: "asc" | "desc" } {
  const defaultSort: { field: SortField; dir: "asc" | "desc" } = { field: "created_at", dir: "desc" }
  if (!field) return defaultSort
  const allowed: SortField[] = ["first_name", "last_name", "email", "course", "year", "created_at"]
  const f = allowed.includes(field as SortField) ? (field as SortField) : defaultSort.field
  const d = dir === "asc" ? "asc" : dir === "desc" ? "desc" : defaultSort.dir
  return { field: f, dir: d }
}
