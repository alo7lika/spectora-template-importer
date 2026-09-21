import { createHash } from "crypto";
import * as XLSX from "xlsx";

export type ImportedComment = { html: string; plainText: string };
export type ImportedItem = { title: string; comments: ImportedComment[] };
export type ImportedSection = { title: string; items: ImportedItem[] };
export type ImportResult = { sections: ImportedSection[]; warnings: string[]; sha256: string; stats: { sections: number; items: number; comments: number } };

const text = (html: string) => html.replace(/<br\s*\/?/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
const blocks = (html: string) => html.match(/<(h[1-6]|p|li|div|td)[^>]*>[\s\S]*?<\/\1>/gi) ?? [];
const tag = (block: string) => /^<([a-z0-9]+)/i.exec(block)?.[1].toLowerCase() ?? "";
const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const asHtml = (value: string) => /<[^>]+>/.test(value) ? value : `<p>${escapeHtml(value)}</p>`;

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

/** Parses Spectora's “Export HTML Text” spreadsheet. It uses column headings, not fixed columns. */
export function parseSpectoraSpreadsheet(bytes: ArrayBuffer): ImportResult {
  const workbook = XLSX.read(bytes, { type: "array", raw: false });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) throw new Error("The spreadsheet has no worksheet.");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "", raw: false });
  if (!rows.length) throw new Error("The spreadsheet is empty. Export the template using “Export HTML Text”, then try again.");
  const headings = Object.keys(rows[0]);
  const keyFor = (...candidates: string[]) => headings.find(h => candidates.includes(h.toLowerCase().replace(/[^a-z0-9]/g, "")));
  const sectionKey = keyFor("sectionname", "section");
  const itemKey = keyFor("itemname", "item");
  const commentKey = keyFor("commenttext", "commenthtml", "commentdescription", "comment");
  const commentNameKey = keyFor("commentname", "commenttitle", "narrativename");
  if (!sectionKey || !itemKey || !commentKey) {
    throw new Error(`This spreadsheet does not have the required Spectora columns. Found: ${headings.join(", ")}. Expected Section Name, Item Name, and Comment Text.`);
  }
  const sections: ImportedSection[] = [];
  const sectionByTitle = new Map<string, ImportedSection>();
  const itemByPath = new Map<string, ImportedItem>();
  const warnings: string[] = [];
  for (const row of rows) {
    const sectionTitle = String(row[sectionKey] ?? "").trim();
    const itemTitle = String(row[itemKey] ?? "").trim();
    const commentValue = String(row[commentKey] ?? "").trim();
    const commentName = commentNameKey ? String(row[commentNameKey] ?? "").trim() : "";
    if (!sectionTitle || !itemTitle) { warnings.push("A row without a section or item name was skipped."); continue; }
    let section = sectionByTitle.get(sectionTitle);
    if (!section) { section = { title: sectionTitle, items: [] }; sectionByTitle.set(sectionTitle, section); sections.push(section); }
    const path = `${sectionTitle}\u0000${itemTitle}`;
    let item = itemByPath.get(path);
    if (!item) { item = { title: itemTitle, comments: [] }; itemByPath.set(path, item); section.items.push(item); }
    if (commentValue || commentName) {
      const combined = commentName && commentValue ? `${commentName}\n${text(commentValue)}` : (commentName || text(commentValue));
      item.comments.push({ html: asHtml(commentValue || commentName), plainText: combined });
    }
  }
  if (!sections.length) throw new Error("No usable template rows were found in this spreadsheet.");
  if (commentNameKey) warnings.push("Comment names are preserved at the start of each comment because this first editor version has one comment-text field.");
  const comments = sections.flatMap(s => s.items).reduce((n, i) => n + i.comments.length, 0);
  const items = sections.reduce((n, s) => n + s.items.length, 0);
  return { sections, warnings, sha256: createHash("sha256").update(Buffer.from(bytes)).digest("hex"), stats: { sections: sections.length, items, comments } };
}
