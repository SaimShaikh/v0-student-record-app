import { NextResponse } from "next/server"
import { pingDB } from "@/lib/db"

export async function GET() {
  const ok = await pingDB()
  if (ok) {
    return NextResponse.json({ status: "ok" })
  }
  return new NextResponse(JSON.stringify({ status: "error" }), { status: 500 })
}
