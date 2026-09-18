import { readFile } from "fs/promises";
import { prisma } from "../lib/prisma";
import { parseSpectoraHtml } from "../lib/importer";
async function main() { if (await prisma.template.count()) return; const filename = "internachi-residential-demo.html"; const parsed = parseSpectoraHtml(await readFile(`sample-data/${filename}`, "utf8")); await prisma.template.create({ data: { name: "InterNACHI Residential — demo", sourceFilename: filename, sections: { create: parsed.sections.map((s, si) => ({ title: s.title, position: si, items: { create: s.items.map((i, ii) => ({ title: i.title, position: ii, comments: { create: i.comments.map((c, ci) => ({ ...c, position: ci })) } })) } })) }, imports: { create: { sourceFilename: filename, sourceSha256: parsed.sha256, stats: parsed.stats, warnings: parsed.warnings } } } }); }
main().finally(() => prisma.$disconnect());
