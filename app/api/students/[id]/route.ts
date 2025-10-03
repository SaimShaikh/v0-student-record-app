import { NextResponse } from "next/server"
import { getPool } from "@/lib/db"
import { studentUpdateSchema } from "@/lib/validation"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!id) return new NextResponse(JSON.stringify({ error: "Invalid id" }), { status: 400 })
    const pool = getPool()
    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, phone, date_of_birth, course, year, address, notes, created_at, updated_at
       FROM students WHERE id = ? LIMIT 1`,
      [id],
    )
    const data = Array.isArray(rows) ? (rows as any[])[0] : null
    if (!data) return new NextResponse(JSON.stringify({ error: "Not found" }), { status: 404 })
    return NextResponse.json(data)
  } catch (e) {
    console.error("[students][GET one] error:", e)
    return new NextResponse(JSON.stringify({ error: "Failed to fetch student" }), { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!id) return new NextResponse(JSON.stringify({ error: "Invalid id" }), { status: 400 })
    const json = await req.json()
    const parsed = studentUpdateSchema.safeParse(json)
    if (!parsed.success) {
      return new NextResponse(JSON.stringify({ error: "Validation failed", details: parsed.error.flatten() }), {
        status: 400,
      })
    }
    const fields = parsed.data

    const sets: string[] = []
    const values: any[] = []
    Object.entries(fields).forEach(([k, v]) => {
      sets.push(`${k} = ?`)
      values.push(v ?? null)
    })
    if (sets.length === 0) return new NextResponse(JSON.stringify({}), { status: 204 })

    const pool = getPool()
    const [result] = await pool.query(`UPDATE students SET ${sets.join(", ")} WHERE id = ?`, [...values, id])
    // @ts-ignore
    const affected = result?.affectedRows || 0
    if (!affected) return new NextResponse(JSON.stringify({ error: "Not found" }), { status: 404 })
    return NextResponse.json({ id })
  } catch (e: any) {
    console.error("[students][PUT] error:", e)
    const message = e?.code === "ER_DUP_ENTRY" ? "Email already exists" : "Failed to update student"
    const status = e?.code === "ER_DUP_ENTRY" ? 409 : 500
    return new NextResponse(JSON.stringify({ error: message }), { status })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!id) return new NextResponse(JSON.stringify({ error: "Invalid id" }), { status: 400 })
    const pool = getPool()
    const [result] = await pool.query(`DELETE FROM students WHERE id = ?`, [id])
    // @ts-ignore
    const affected = result?.affectedRows || 0
    if (!affected) return new NextResponse(JSON.stringify({ error: "Not found" }), { status: 404 })
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    console.error("[students][DELETE] error:", e)
    return new NextResponse(JSON.stringify({ error: "Failed to delete student" }), { status: 500 })
  }
}
