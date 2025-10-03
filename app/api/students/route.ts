import { NextResponse } from "next/server"
import { getPool } from "@/lib/db"
import { studentCreateSchema, validateSort } from "@/lib/validation"

type ListParams = {
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDir?: string
}

function parseListParams(url: URL): ListParams {
  return {
    search: url.searchParams.get("search") || undefined,
    page: Number(url.searchParams.get("page") || "1"),
    pageSize: Number(url.searchParams.get("pageSize") || "10"),
    sortBy: url.searchParams.get("sortBy") || undefined,
    sortDir: url.searchParams.get("sortDir") || undefined,
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const { search, page = 1, pageSize = 10, sortBy, sortDir } = parseListParams(url)
    const { field, dir } = validateSort(sortBy, sortDir)
    const pool = getPool()

    const whereClauses: string[] = []
    const params: any[] = []
    if (search) {
      whereClauses.push(`(
        first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ? OR course LIKE ?
      )`)
      const like = `%${search}%`
      params.push(like, like, like, like, like)
    }
    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : ""
    const offset = (Math.max(1, page) - 1) * Math.max(1, pageSize)

    const [rows] = await pool.query(
      `
      SELECT SQL_CALC_FOUND_ROWS
        id, first_name, last_name, email, phone, date_of_birth, course, year, address, notes, created_at, updated_at
      FROM students
      ${whereSQL}
      ORDER BY ${field} ${dir.toUpperCase()}
      LIMIT ? OFFSET ?
    `,
      [...params, Math.max(1, pageSize), offset],
    )

    const [totalRows] = await pool.query("SELECT FOUND_ROWS() as total")
    const total = Array.isArray(totalRows) ? Number((totalRows as any)[0]?.total || 0) : 0

    return NextResponse.json({
      data: rows,
      meta: {
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Math.max(1, pageSize)),
      },
    })
  } catch (e: any) {
    console.error("[students][GET] error:", e)
    return new NextResponse(JSON.stringify({ error: "Failed to list students" }), { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const parsed = studentCreateSchema.safeParse(json)
    if (!parsed.success) {
      return new NextResponse(JSON.stringify({ error: "Validation failed", details: parsed.error.flatten() }), {
        status: 400,
      })
    }

    const {
      first_name,
      last_name,
      email,
      phone = null,
      date_of_birth = null,
      course = null,
      year = null,
      address = null,
      notes = null,
    } = parsed.data

    const pool = getPool()
    const [result] = await pool.query(
      `
      INSERT INTO students
        (first_name, last_name, email, phone, date_of_birth, course, year, address, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [first_name, last_name, email, phone, date_of_birth, course, year, address, notes],
    )

    // @ts-ignore
    const id = result?.insertId
    return NextResponse.json({ id }, { status: 201 })
  } catch (e: any) {
    console.error("[students][POST] error:", e)
    // Handle unique email constraint
    const message = e?.code === "ER_DUP_ENTRY" ? "Email already exists" : "Failed to create student"
    const status = e?.code === "ER_DUP_ENTRY" ? 409 : 500
    return new NextResponse(JSON.stringify({ error: message }), { status })
  }
}
