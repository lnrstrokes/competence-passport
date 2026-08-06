import { SITE } from "@/config/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = SITE.sheetCsvUrl;
  if (!url) {
    return Response.json({ ok: false, reason: "SHEET_CSV_URL is not set" });
  }

  let fetchStatus = "not attempted";
  let bytes = 0;
  let preview = "";
  let rowCount = 0;
  let headerRow: string[] = [];

  try {
    const res = await fetch(url, { cache: "no-store" });
    fetchStatus = `${res.status} ${res.statusText}`;
    const text = await res.text();
    bytes = text.length;
    preview = text.slice(0, 200);
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    rowCount = lines.length;
    if (lines.length > 0) headerRow = lines[0].split(",");
  } catch (error) {
    fetchStatus = `error: ${error instanceof Error ? error.message : String(error)}`;
  }

  return Response.json({
    ok: fetchStatus.startsWith("200"),
    url: url.slice(0, 80),
    fetchStatus,
    bytes,
    rowCount,
    headerRow,
    preview,
  });
}
