# 🚀 MigrateKit — Spectora Template Importer

> **A desk-first migration tool for inspection companies moving from Spectora.**

MigrateKit transforms **Spectora HTML-text template exports** into real, structured database records. It preserves the template hierarchy, makes it editable, and allows users to create independent copies for further customization.

Built with **Next.js, TypeScript, Prisma, and PostgreSQL** — with a deliberately **rule-based importer** designed to fail visibly rather than silently inventing or losing data.

---

## ✨ What MigrateKit Does

MigrateKit is designed to simplify the process of moving inspection templates into a structured, editable system.

### 📥 Import

Import Spectora template exports and convert them into database records.

### 🗂️ Preserve Hierarchy

Maintain the structure of:

```text
Template
 └── Section
      └── Item
           └── Comments
```

### ✏️ Edit

Modify:

* 📝 Template names
* 📂 Section names
* 🔹 Item names
* 💬 Comment text

### 📋 Duplicate

Create **independent copies** of imported templates so changes can be made without affecting the original.

### 🔍 Import Receipts

Every import generates a receipt containing:

* ✅ Imported record counts
* ⚠️ Warnings
* 🔐 SHA-256 source fingerprint
* 📊 Import information

---

# 🧩 Supported Input Formats

MigrateKit supports Spectora's:

**Export to spreadsheet → Export HTML Text**

The application accepts:

* `.xlsx`
* `.xls`
* `.html`
* `.htm`

### 📊 Spectora Spreadsheet Mapping

The importer identifies columns using their **headings**, rather than relying on fixed column positions.

| Spectora Export | MigrateKit         |
| --------------- | ------------------ |
| `Section Name`  | 📂 Section         |
| `Item Name`     | 🔹 Item            |
| `Comment Text`  | 💬 Ordered Comment |

Comment names are preserved at the beginning of comment text in this initial editor version.

---

# 🌐 Legacy HTML Support

MigrateKit can also process legacy HTML template files.

The importer maps common HTML structures as follows:

| HTML Element    | Imported As |
| --------------- | ----------- |
| `<h1>` / `<h2>` | 📂 Section  |
| `<h3>` / `<h4>` | 🔹 Item     |
| Paragraphs      | 💬 Comments |
| List items      | 💬 Comments |
| Table cells     | 💬 Comments |

This makes the importer flexible enough to handle both structured spreadsheet exports and older HTML-based templates.

---

# 🛡️ Safe, Deterministic Importing

MigrateKit intentionally uses a **rule-based importer instead of AI/model-based mapping**.

That means the application does **not** try to guess what malformed data means.

Instead:

```text
Valid input
    ↓
Parse
    ↓
Map
    ↓
Validate
    ↓
Create database records
```

If something goes wrong:

```text
Malformed / unsupported input
            ↓
     ⚠️ Warning / 422 Error
            ↓
       Visible to user
```

This approach helps prevent:

* ❌ Invented sections
* ❌ Silent data loss
* ❌ Incorrect hierarchy
* ❌ Hidden parsing failures

---

# 🔐 Source Fingerprinting

Every imported template receives a **SHA-256 fingerprint** of its source file.

This provides a deterministic identifier for the imported source and is included in the import receipt.

---

# 🧾 Import Receipts

After an import, MigrateKit provides visibility into what happened during the process.

Example information includes:

```text
📄 Source file
🔐 SHA-256 fingerprint

📂 Sections imported
🔹 Items imported
💬 Comments imported

⚠️ Warnings
❌ Errors
```

This makes the import process easier to audit and troubleshoot.

---

# ✏️ Template Editor

Once imported, the template hierarchy becomes editable.

### Supported

* ✏️ Rename templates
* ✏️ Rename sections
* ✏️ Rename items
* 💬 Edit comment text
* 📋 Create independent template copies

Inline HTML and links are retained in storage.

When a comment is edited, however, its stored HTML is replaced with an escaped paragraph containing the edited text.

---

# ⚠️ Current Limitations

MigrateKit intentionally keeps the first editor version focused.

The following features are **not currently implemented**:

* 🖱️ Drag-and-drop reordering
* 🎨 Rich-text editing
* 📸 Photo migration
* 📝 Form-rule migration
* ⭐ Rating migration
* 🔐 Authentication
* 🔎 Source-to-record line-by-line diff

### Important

Photos and form rules are **not present in Spectora HTML-text exports**, rather than simply being unsupported by MigrateKit.

Tables, media, and embeds encountered during import are detected and **flagged in the import receipt**.

---

# 🏗️ Tech Stack

| Technology     | Purpose               |
| -------------- | --------------------- |
| ⚛️ Next.js     | Application framework |
| 🔷 TypeScript  | Type-safe development |
| 🗄️ PostgreSQL | Database              |
| 💎 Prisma      | ORM & migrations      |
| ☁️ Vercel      | Deployment            |

### Architecture

```text
Spectora Export
      │
      ▼
📥 Importer
      │
      ├── Spreadsheet Parser
      │
      └── HTML Parser
      │
      ▼
🧹 Validation & Mapping
      │
      ▼
🗄️ PostgreSQL
      │
      ▼
🖥️ Template Editor
      │
      ├── ✏️ Edit
      ├── 📋 Duplicate
      └── 🔍 Import Receipt
```

---

# 🧑‍💻 Run Locally

## 1️⃣ Create a PostgreSQL Database

Create a PostgreSQL database.

**Supabase** is a convenient option.

Copy the example environment file:

```bash
cp .env.example .env
```

Then add your database connection string to `.env`.

---

## 2️⃣ Install Dependencies

```bash
npm install
```

---

## 3️⃣ Run Prisma

Deploy the database migrations:

```bash
npx prisma migrate deploy
```

Generate the Prisma client:

```bash
npx prisma generate
```

---

## 4️⃣ Load Demo Data

Run the seed script:

```bash
npx tsx prisma/seed.ts
```

This loads the shareable demo template.

---

## 5️⃣ Start the Development Server

```bash
npm run dev
```

Then open the local application in your browser.

---

# ☁️ Deploying to Vercel

To deploy the application:

### 1. Add the database

Set:

```text
DATABASE_URL
```

in the Vercel project environment variables.

### 2. Run production migrations

Run Prisma migrations against the production database:

```bash
npx prisma migrate deploy
```

### 3. Deploy 🚀

Deploy the application to Vercel.

### 4. Seed once

Run the seed script once from a machine configured with the production database URL:

```bash
npx tsx prisma/seed.ts
```

---

# 🧪 Demo Data

The repository contains:

```text
sample-data/
└── internachi-residential-demo.html
```

This is a **compact, shareable stand-in** based on the public InterNACHI Residential template suggested in the exercise.

> ⚠️ **For an actual submission/import test, replace this demo file with the real Spectora `Export to spreadsheet → Export HTML Text` file.**

---

# 🤖 AI & Development Approach

MigrateKit was built with **Codex assistance** and subsequently reviewed manually.

AI was used as a development aid, while the importer itself intentionally remains **deterministic and rule-based**.

The guiding principle is:

> **When the input is ambiguous, surface the problem — don't invent the answer.**

This makes the migration process more transparent and predictable.

---

# 🎯 Project Goals

MigrateKit focuses on three principles:

### 🔒 Data Integrity

Preserve the source hierarchy and avoid silent data loss.

### 👀 Transparency

Make import counts, warnings, and unsupported content visible.

### 🛠️ Practical Editing

Turn imported templates into real records that users can modify and duplicate.

---

# 🚀 Future Improvements

Potential next steps include:

* 🖱️ Drag-and-drop hierarchy reordering
* 🎨 Rich-text comment editor
* 📸 Expanded media migration
* 📝 Form/rating migration where source data permits
* 🔐 Authentication & multi-user workspaces
* 🔎 Source-to-record comparison
* 📊 More detailed import diagnostics
* 🔄 Re-import and synchronization workflows

---

## 📌 Project Summary

**MigrateKit** is a focused migration and editing tool that turns Spectora HTML-text template exports into structured, editable database records.

It combines:

**📥 Reliable importing + 🗂️ Hierarchical data + ✏️ Editing + 📋 Duplication + 🔍 Transparent diagnostics**

without relying on AI to guess what the source data means.

**Built with Next.js · TypeScript · Prisma · PostgreSQL · Codex-assisted development**
