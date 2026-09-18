import { prisma } from "@/lib/prisma";
import { z } from "zod";
const schema = z.object({ name: z.string().min(1).max(150), sections: z.array(z.object({ id: z.string().optional(), title: z.string().min(1), items: z.array(z.object({ id: z.string().optional(), title: z.string().min(1), comments: z.array(z.object({ id: z.string().optional(), html: z.string(), plainText: z.string() })) })) })) });
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = await prisma.template.findUnique({ where: { id }, include: {
    sections: { orderBy: { position: "asc" }, include: { items: { orderBy: { position: "asc" }, include: { comments: { orderBy: { position: "asc" } } } } } },
    imports: { orderBy: { createdAt: "desc" }, take: 1 }
  } });
  return template ? Response.json(template) : Response.json({ error: "Not found" }, { status: 404 });
}
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; const data = schema.parse(await request.json()); await prisma.$transaction([prisma.comment.deleteMany({ where: { item: { section: { templateId: id } } } }), prisma.item.deleteMany({ where: { section: { templateId: id } } }), prisma.section.deleteMany({ where: { templateId: id } }), prisma.template.update({ where: { id }, data: { name: data.name, sections: { create: data.sections.map((s, si) => ({ title: s.title, position: si, items: { create: s.items.map((i, ii) => ({ title: i.title, position: ii, comments: { create: i.comments.map((c, ci) => ({ html: c.html, plainText: c.plainText, position: ci })) } })) } })) } } })]); return Response.json({ ok: true }); }
