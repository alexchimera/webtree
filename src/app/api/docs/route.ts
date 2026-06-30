import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sampleDoc } from "@/lib/tree/ops";

export const dynamic = "force-dynamic";

// Create a new document. Body is optional: { title?, data? }.
export async function POST(req: Request) {
  let body: { title?: string; data?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body is fine */
  }

  const data = (body.data ?? sampleDoc()) as Prisma.InputJsonValue;
  const doc = await prisma.document.create({
    data: {
      title: body.title?.slice(0, 200) || "Untitled",
      data,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: doc.id }, { status: 201 });
}
