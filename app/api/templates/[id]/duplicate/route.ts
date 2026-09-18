import { prisma } from "@/lib/prisma";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = await prisma.template.findUnique({ where: { id }, include: {
    sections: { orderBy: { position: "asc" }, include: { items: { orderBy: { position: "asc" }, include: { comments: { orderBy: { position: "asc" } } } } } }
  } });
  if (!source) return Response.json({ error: "Not found" }, { status: 404 });
  const copy = await prisma.template.create({ data: { name: `${source.name} (copy)`, sourceFilename: source.sourceFilename, sections: { create: source.sections.map(s => ({ title: s.title, position: s.position, items: { create: s.items.map(i => ({ title: i.title, position: i.position, comments: { create: i.comments.map(c => ({ html: c.html, plainText: c.plainText, position: c.position })) } })) } })) } } });
  return Response.json(copy, { status: 201 });
}
