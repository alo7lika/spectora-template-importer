import { createHash } from "crypto";

export type ImportedComment = { html: string; plainText: string };
export type ImportedItem = { title: string; comments: ImportedComment[] };
export type ImportedSection = { title: string; items: ImportedItem[] };
export type ImportResult = { sections: ImportedSection[]; warnings: string[]; sha256: string; stats: { sections: number; items: number; comments: number } };

const text = (html: string) => html.replace(/<br\s*\/?/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
const blocks = (html: string) => html.match(/<(h[1-6]|p|li|div|td)[^>]*>[\s\S]*?<\/\1>/gi) ?? [];
const tag = (block: string) => /^<([a-z0-9]+)/i.exec(block)?.[1].toLowerCase() ?? "";

/** Parses the semantic hierarchy in a Spectora HTML-text export without using an LLM. */
export function parseSpectoraHtml(raw: string): ImportResult {
  const warnings: string[] = [];
  const sections: ImportedSection[] = [];
  let section: ImportedSection | undefined;
  let item: ImportedItem | undefined;
  const addSection = (title: string) => { section = { title, items: [] }; sections.push(section); item = undefined; };
  const addItem = (title: string) => { if (!section) addSection("Imported content"); item = { title, comments: [] }; section!.items.push(item); };
  for (const block of blocks(raw)) {
    const value = text(block); if (!value) continue;
    const kind = tag(block);
    if (kind === "h1" || kind === "h2") { addSection(value); continue; }
    if (kind === "h3" || kind === "h4") { addItem(value); continue; }
    if (!item && (kind === "li" || kind === "td")) { addItem(value); continue; }
    if (!item) { warnings.push(`Unattached content preserved in an “Imported content” item: ${value.slice(0, 80)}`); addItem("Imported content"); }
    item!.comments.push({ html: block, plainText: value });
  }
  if (!sections.length) throw new Error("No supported HTML content was found. Upload the HTML-text export, not a PDF or regular report.");
  const comments = sections.flatMap(s => s.items).reduce((n, i) => n + i.comments.length, 0);
  const items = sections.reduce((n, s) => n + s.items.length, 0);
  if (!items) warnings.push("Headings were found, but no item-level headings were present. Add items in the editor.");
  if (/<(img|table|iframe|script|style)\b/i.test(raw)) warnings.push("The source contains media, tables, or embedded content. It is retained in comment HTML where possible, but not rendered as a dedicated field.");
  return { sections, warnings, sha256: createHash("sha256").update(raw).digest("hex"), stats: { sections: sections.length, items, comments } };
}
