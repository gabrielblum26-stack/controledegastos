
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  await sql`UPDATE bills SET paid = true WHERE id = ${params.id}`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  await sql`DELETE FROM bills WHERE id = ${params.id}`;
  return NextResponse.json({ ok: true });
}
