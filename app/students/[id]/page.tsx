import { getPool } from "@/lib/db"

async function getStudent(id: number) {
  const pool = getPool()
  const [rows] = await pool.query(
    `SELECT id, first_name, last_name, email, phone, date_of_birth, course, year, address, notes, created_at, updated_at
     FROM students WHERE id = ? LIMIT 1`,
    [id],
  )
  const data = Array.isArray(rows) ? (rows as any[])[0] : null
  return data
}

export default async function ViewStudentPage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!id) {
    return <main className="container mx-auto p-6">Invalid id</main>
  }
  const student = await getStudent(id)
  if (!student) {
    return <main className="container mx-auto p-6">Not found</main>
  }

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4 text-pretty">Student Details</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <Detail label="Name" value={`${student.first_name} ${student.last_name}`} />
        <Detail label="Email" value={student.email} />
        <Detail label="Phone" value={student.phone || "-"} />
        <Detail label="Date of Birth" value={student.date_of_birth || "-"} />
        <Detail label="Course" value={student.course || "-"} />
        <Detail label="Year" value={student.year ?? "-"} />
        <Detail label="Address" value={student.address || "-"} />
        <Detail label="Notes" value={student.notes || "-"} />
        <Detail label="Created" value={new Date(student.created_at).toLocaleString()} />
        <Detail label="Updated" value={new Date(student.updated_at).toLocaleString()} />
      </div>
    </main>
  )
}

function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1 border rounded-md p-3 bg-card">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  )
}
