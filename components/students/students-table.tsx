"use client"

import useSWR from "swr"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type Student = {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string | null
  date_of_birth: string | null
  course: string | null
  year: number | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

type ApiList = {
  data: Student[]
  meta: { total: number; page: number; pageSize: number; totalPages: number }
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function StudentsTable() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [sortBy, setSortBy] = useState("created_at")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    params.set("page", String(page))
    params.set("pageSize", String(pageSize))
    params.set("sortBy", sortBy)
    params.set("sortDir", sortDir)
    return `/api/students?${params.toString()}`
  }, [search, page, pageSize, sortBy, sortDir])

  const { data, isLoading, mutate } = useSWR<ApiList>(query, fetcher)

  const setSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortDir("asc")
    }
    setPage(1)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this student?")) return
    const res = await fetch(`/api/students/${id}`, { method: "DELETE" })
    if (res.ok) {
      mutate()
    } else {
      const j = await res.json().catch(() => ({}))
      alert(j?.error || "Failed to delete")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-pretty">Students</h1>
        <Link href="/students/new">
          <Button>Create Student</Button>
        </Link>
      </header>

      <div className="flex items-center gap-2">
        <input
          aria-label="Search students"
          className="border rounded-md px-3 py-2 bg-background text-foreground"
          placeholder="Search name, email, phone, course"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <Button
          variant="secondary"
          onClick={() => {
            setSearch("")
            setPage(1)
          }}
        >
          Clear
        </Button>
      </div>

      <div className="overflow-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <Th label="Name" onClick={() => setSort("last_name")} active={sortBy === "last_name"} dir={sortDir} />
              <Th label="Email" onClick={() => setSort("email")} active={sortBy === "email"} dir={sortDir} />
              <Th label="Course" onClick={() => setSort("course")} active={sortBy === "course"} dir={sortDir} />
              <Th label="Year" onClick={() => setSort("year")} active={sortBy === "year"} dir={sortDir} />
              <th className="text-left px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            )}
            {!isLoading && data?.data?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  No students found
                </td>
              </tr>
            )}
            {!isLoading &&
              data?.data?.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2">
                    {s.last_name}, {s.first_name}
                  </td>
                  <td className="px-3 py-2">{s.email}</td>
                  <td className="px-3 py-2">{s.course || "-"}</td>
                  <td className="px-3 py-2">{s.year ?? "-"}</td>
                  <td className="px-3 py-2 flex items-center gap-2">
                    <Link href={`/students/${s.id}`} className="underline">
                      View
                    </Link>
                    <Link href={`/students/${s.id}/edit`} className="underline">
                      Edit
                    </Link>
                    <button className="text-destructive underline" onClick={() => handleDelete(s.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <footer className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Total: {data?.meta?.total ?? 0}</div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            disabled={(data?.meta?.page ?? 1) <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <span className="text-sm">
            Page {data?.meta?.page ?? 1} of {data?.meta?.totalPages ?? 1}
          </span>
          <Button
            variant="secondary"
            disabled={(data?.meta?.page ?? 1) >= (data?.meta?.totalPages ?? 1)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </footer>
    </div>
  )
}

function Th({
  label,
  onClick,
  active,
  dir,
}: { label: string; onClick: () => void; active: boolean; dir: "asc" | "desc" }) {
  return (
    <th className="text-left px-3 py-2">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 underline underline-offset-2"
        aria-pressed={active}
        aria-label={`Sort by ${label}`}
      >
        <span>{label}</span>
        {active ? <span className="text-muted-foreground">{dir === "asc" ? "▲" : "▼"}</span> : null}
      </button>
    </th>
  )
}
