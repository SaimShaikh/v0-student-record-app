"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

type StudentFormValues = {
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  date_of_birth?: string | null
  course?: string | null
  year?: number | null
  address?: string | null
  notes?: string | null
}

export function StudentForm({ id, initial }: { id?: number; initial?: Partial<StudentFormValues> }) {
  const router = useRouter()
  const [values, setValues] = useState<StudentFormValues>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    course: "",
    year: 1,
    address: "",
    notes: "",
    ...initial,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setValues((v) => ({ ...v, ...(initial || {}) }))
  }, [initial])

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    try {
      const payload = {
        ...values,
        phone: values.phone || null,
        date_of_birth: values.date_of_birth || null,
        course: values.course || null,
        year: values.year ? Number(values.year) : null,
        address: values.address || null,
        notes: values.notes || null,
      }
      const res = await fetch(id ? `/api/students/${id}` : "/api/students", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        router.push("/students")
        router.refresh()
      } else {
        const j = await res.json().catch(() => ({}))
        if (j?.details?.fieldErrors) {
          const fieldErrors: Record<string, string[]> = j.details.fieldErrors
          const flat: Record<string, string> = {}
          Object.entries(fieldErrors).forEach(([k, arr]) => {
            if (arr?.[0]) flat[k] = arr[0]
          })
          setErrors(flat)
        } else {
          setErrors({ form: j?.error || "Something went wrong" })
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 max-w-2xl">
      {errors.form && <p className="text-destructive">{errors.form}</p>}

      <div className="grid md:grid-cols-2 gap-4">
        <Field
          label="First Name"
          name="first_name"
          value={values.first_name}
          onChange={onChange}
          error={errors.first_name}
          required
        />
        <Field
          label="Last Name"
          name="last_name"
          value={values.last_name}
          onChange={onChange}
          error={errors.last_name}
          required
        />
      </div>

      <Field
        label="Email"
        name="email"
        type="email"
        value={values.email}
        onChange={onChange}
        error={errors.email}
        required
      />
      <Field label="Phone" name="phone" value={values.phone || ""} onChange={onChange} error={errors.phone} />
      <Field
        label="Date of Birth"
        name="date_of_birth"
        type="date"
        value={values.date_of_birth || ""}
        onChange={onChange}
        error={errors.date_of_birth}
      />

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Course" name="course" value={values.course || ""} onChange={onChange} error={errors.course} />
        <Field
          label="Year"
          name="year"
          type="number"
          value={String(values.year ?? "")}
          onChange={onChange}
          error={errors.year}
          min={1}
          max={8}
        />
      </div>

      <Field label="Address" name="address" value={values.address || ""} onChange={onChange} error={errors.address} />
      <TextArea label="Notes" name="notes" value={values.notes || ""} onChange={onChange} error={errors.notes} />

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={submitting}>
          {id ? "Update" : "Create"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => history.back()} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function Field(props: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  required?: boolean
  type?: string
  min?: number
  max?: number
}) {
  const { label, name, value, onChange, error, required, type = "text", min, max } = props
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm">
        {label}
        {required ? " *" : ""}
      </label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        min={min}
        max={max}
        required={required}
        className="border rounded-md px-3 py-2 bg-background text-foreground"
      />
      {error ? <span className="text-destructive text-sm">{error}</span> : null}
    </div>
  )
}

function TextArea(props: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  error?: string
}) {
  const { label, name, value, onChange, error } = props
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="border rounded-md px-3 py-2 bg-background text-foreground"
      />
      {error ? <span className="text-destructive text-sm">{error}</span> : null}
    </div>
  )
}
