"use client"

import useSWR from "swr"
import { useParams } from "next/navigation"
import { StudentForm } from "@/components/students/student-form"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function EditStudentPage() {
  const params = useParams<{ id: string }>()
  const id = Number(params.id)
  const { data, isLoading } = useSWR(id ? `/api/students/${id}` : null, fetcher)

  if (!id) return <main className="container mx-auto p-6">Invalid id</main>
  if (isLoading) return <main className="container mx-auto p-6">Loading...</main>
  if (!data || data.error) return <main className="container mx-auto p-6">Not found</main>

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4 text-pretty">Edit Student</h1>
      <StudentForm id={id} initial={data} />
    </main>
  )
}
