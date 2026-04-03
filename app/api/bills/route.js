
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  await sql`
    CREATE TABLE IF NOT EXISTS bills (
      id SERIAL PRIMARY KEY,
      description TEXT,
      amount NUMERIC,
      due_date DATE,
      paid BOOLEAN DEFAULT FALSE
    )
  `;
  const data = await sql`SELECT * FROM bills ORDER BY due_date`;
  return NextResponse.json(data);
}

export async function POST(req) {
  const { description, amount, due_date } = await req.json();
  await sql`
    INSERT INTO bills (description, amount, due_date)
    VALUES (${description}, ${amount}, ${due_date})
  `;
  return NextResponse.json({ ok: true });
}
