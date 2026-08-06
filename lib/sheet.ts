import { SITE } from "@/config/site";
import { parseOperatorRow, type Operator } from "@/lib/schema";

export async function getOperators(): Promise<Operator[]> {
  if (!SITE.sheetCsvUrl) return [];

  try {
    const res = await fetch(SITE.sheetCsvUrl, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const rows = parseCsv(await res.text());
    return rows
      .map(parseOperatorRow)
      .filter((op): op is Operator => op !== null);
  } catch {
    return [];
  }
}

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ""));
  const [header, ...data] = nonEmpty;
  if (!header) return [];

  return data.map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => {
      obj[h.trim()] = (r[i] ?? "").trim();
    });
    return obj;
  });
}