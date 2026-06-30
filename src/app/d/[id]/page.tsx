import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Editor } from "@/components/Editor";

export const dynamic = "force-dynamic";

export default async function DocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) notFound();

  return <Editor id={doc.id} title={doc.title} data={doc.data} />;
}
