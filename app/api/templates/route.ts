import { prisma } from "@/lib/prisma";
import { parseSpectoraHtml, parseSpectoraSpreadsheet } from "@/lib/importer";

export async function GET() {
  return Response.json(
    await prisma.template.findMany({
      orderBy: { updatedAt: "desc" },
      include: { sections: { include: { items: true } } },
    }),
  );
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return Response.json(
      { error: "Choose a Spectora HTML-text export first." },
      { status: 400 },
    );
  }

  if (file.size > 5_000_000) {
    return Response.json(
      { error: "This file is over the 5 MB importer limit." },
      { status: 413 },
    );
  }

  try {
    const isSpreadsheet = /\.(xlsx|xls)$/i.test(file.name);

    const parsed = isSpreadsheet
      ? parseSpectoraSpreadsheet(await file.arrayBuffer())
      : parseSpectoraHtml(await file.text());

    const template = await prisma.template.create({
      data: {
        name: String(form.get("name") || file.name.replace(/\.[^.]+$/, "")),
        sourceFilename: file.name,
        sections: {
          create: parsed.sections.map((section, sectionIndex) => ({
            title: section.title,
            position: sectionIndex,
            items: {
              create: section.items.map((item, itemIndex) => ({
                title: item.title,
                position: itemIndex,
                comments: {
                  create: item.comments.map((comment, commentIndex) => ({
                    ...comment,
                    position: commentIndex,
                  })),
                },
              })),
            },
          })),
        },
        imports: {
          create: {
            sourceFilename: file.name,
            sourceSha256: parsed.sha256,
            stats: parsed.stats,
            warnings: parsed.warnings,
          },
        },
      },
      include: { imports: true },
    });

    return Response.json({ template, ...parsed }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not import that file.",
      },
      { status: 422 },
    );
  }
}