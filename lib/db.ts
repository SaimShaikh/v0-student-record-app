import mysql, { type Pool, type PoolOptions } from "mysql2/promise"

declare global {
  // eslint-disable-next-line no-var
  var __db_pool__: Pool | undefined
}

const getConfig = (): PoolOptions => {
  const port = Number(process.env.DB_PORT || 3306)
  const host = process.env.DB_HOST
  const user = process.env.DB_USER
  const password = process.env.DB_PASSWORD
  const database = process.env.DB_NAME

  if (!host || !user || !database) {
    console.warn("[db] Missing DB env vars. Expected DB_HOST, DB_USER, DB_NAME, and optionally DB_PASSWORD, DB_PORT.")
  }

  const cfg: PoolOptions = {
    host,
    user,
    password,
    port,
    database,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  }

  // Optional SSL toggle (useful for AWS RDS or managed MySQL)
  const sslEnabled = (process.env.DB_SSL || "").toLowerCase() === "true"
  if (sslEnabled) {
    const rejectUnauthorized = (process.env.DB_SSL_REJECT_UNAUTHORIZED || "false").toLowerCase() === "true"
    // mysql2 accepts tls options via `ssl`
    // Note: set DB_SSL_REJECT_UNAUTHORIZED=true only when you provide CA trust in the image
    ;(cfg as any).ssl = { rejectUnauthorized }
  }

  return cfg
}

export function getPool(): Pool {
  if (!global.__db_pool__) {
    global.__db_pool__ = mysql.createPool(getConfig())
    // Initialize schema & seed on first creation
    void initialize()
    // Graceful shutdown
    const pool = global.__db_pool__
    const close = async () => {
      try {
        await pool.end()
        // eslint-disable-next-line no-console
        console.log("[db] Pool closed.")
      } catch (e) {
        console.error("[db] Error closing pool:", e)
      }
    }
    if (typeof process !== "undefined" && process.on) {
      process.on("beforeExit", close)
      process.on("SIGINT", async () => {
        await close()
        process.exit(0)
      })
      process.on("SIGTERM", async () => {
        await close()
        process.exit(0)
      })
    }
  }
  return global.__db_pool__!
}

export async function pingDB(): Promise<boolean> {
  const pool = getPool()
  try {
    await pool.query("SELECT 1")
    return true
  } catch (e) {
    console.error("[db] ping failed:", e)
    return false
  }
}

async function initialize() {
  const pool = getPool()
  // Create students table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(50),
      date_of_birth DATE,
      course VARCHAR(150),
      year INT,
      address VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_students_name (last_name, first_name),
      INDEX idx_students_email (email),
      INDEX idx_students_course_year (course, year)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

  // Seed if empty
  const [rows] = await pool.query("SELECT COUNT(*) as cnt FROM students")
  const count = Array.isArray(rows) ? Number((rows as any)[0]?.cnt || 0) : 0
  if (count === 0) {
    await seedStudents()
  }
}

async function seedStudents() {
  const pool = getPool()
  const sample = [
    [
      "Alice",
      "Johnson",
      "alice.johnson@example.com",
      "555-0101",
      "2002-03-15",
      "Computer Science",
      2,
      "123 Maple St",
      "Enjoys algorithms.",
    ],
    [
      "Bob",
      "Smith",
      "bob.smith@example.com",
      "555-0102",
      "2001-07-21",
      "Mathematics",
      3,
      "456 Oak Ave",
      "Math club lead.",
    ],
    [
      "Carol",
      "Nguyen",
      "carol.nguyen@example.com",
      "555-0103",
      "2003-01-09",
      "Physics",
      1,
      "789 Pine Rd",
      "Lab assistant.",
    ],
    [
      "David",
      "Lopez",
      "david.lopez@example.com",
      "555-0104",
      "2000-12-30",
      "Chemistry",
      4,
      "321 Birch Blvd",
      "Research intern.",
    ],
    [
      "Eve",
      "Khan",
      "eve.khan@example.com",
      "555-0105",
      "2002-11-02",
      "Computer Science",
      2,
      "654 Cedar Ln",
      "AI study group.",
    ],
    [
      "Frank",
      "O'Brien",
      "frank.obrien@example.com",
      "555-0106",
      "2001-05-18",
      "Economics",
      3,
      "987 Spruce Dr",
      "TA for microeconomics.",
    ],
    [
      "Grace",
      "Kim",
      "grace.kim@example.com",
      "555-0107",
      "2003-08-24",
      "Biology",
      1,
      "159 Walnut St",
      "Pre-med track.",
    ],
    [
      "Hank",
      "Patel",
      "hank.patel@example.com",
      "555-0108",
      "2002-04-06",
      "Statistics",
      2,
      "753 Chestnut Ave",
      "Data viz enthusiast.",
    ],
    [
      "Ivy",
      "Garcia",
      "ivy.garcia@example.com",
      "555-0109",
      "2000-09-12",
      "Philosophy",
      4,
      "258 Elm Ct",
      "Debate team captain.",
    ],
    [
      "Jake",
      "Chen",
      "jake.chen@example.com",
      "555-0110",
      "2001-02-28",
      "History",
      3,
      "852 Willow Way",
      "Archival volunteer.",
    ],
  ] as const

  const sql = `
    INSERT INTO students
      (first_name, last_name, email, phone, date_of_birth, course, year, address, notes)
    VALUES ?
  `
  await pool.query(sql, [sample])
}
