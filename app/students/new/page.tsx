import { StudentForm } from "@/components/students/student-form"

export default function NewStudentPage() {
  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4 text-pretty">Create Student</h1>
      <StudentForm />
    </main>
  )
}
