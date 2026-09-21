# MigrateKit — Spectora template importer

A desk-first web app for inspection companies moving from Spectora. It imports a Spectora **HTML-text** template export into real database records, makes its hierarchy editable, and creates independent copies.

## Run locally

1. Create a PostgreSQL database (Supabase is a good fit) and copy `.env.example` to `.env` with its connection string.
2. `npm install`
3. `npx prisma migrate deploy && npx prisma generate`
4. `npx tsx prisma/seed.ts` to load the shareable demo export.
5. `npm run dev`

For Vercel, set `DATABASE_URL` in project environment variables, run the migration against the production database, deploy, and run the seed once from a machine with that production URL.

## Input and mapping

`sample-data/internachi-residential-demo.html` is a compact, shareable stand-in based on the public InterNACHI Residential template suggested in the exercise. Replace it with the actual Spectora **Export to spreadsheet → Export HTML Text** file before submission; the app accepts `.html` / `.htm` HTML-text exports.

The importer accepts Spectora's `.xlsx`/`.xls` **Export HTML Text** spreadsheet. It maps `Section Name → Section`, `Item Name → Item`, and `Comment Text → ordered comment`, using column headings rather than hard-coded column positions. Comment names are kept at the start of comment text in this first editor version. It also accepts legacy HTML files, mapping `h1/h2 → Section`, `h3/h4 → Item`, and paragraphs/list/table cells → ordered comments. Every imported template has a SHA-256 source fingerprint and an import receipt with counts and warnings.

## Deliberate limits

The editor supports renaming templates, sections, and items, plus editing comment text. It retains link/inline HTML in storage, but editing a comment replaces its stored HTML with escaped paragraph text. It does not yet offer drag/drop reorder, rich-text editing, photo/form/rating migration, authentication, or a source-to-record line-by-line diff. Photos and form rules are absent from an HTML-text export rather than merely unsupported; tables/media/embeds encountered by the importer are flagged in the receipt.

## Stack and AI use

Next.js App Router, TypeScript, Prisma, and PostgreSQL. The importer is intentionally rule-based instead of model-mapped: malformed or unsupported inputs produce a visible 422 error or warning, rather than invented sections or silently discarded data. This project was built with Codex assistance and reviewed manually.
