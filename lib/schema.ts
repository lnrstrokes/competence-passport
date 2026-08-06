export interface Operator {
  id: string;
  name: string;
  trade: string;
  machines: string[];
  terrains: string[];
  seatHours: number;
  certifications: string[];
  videoUrl: string;
  whatsapp: string;
  location: string;
  bio: string;
  status: "active" | "verified" | "featured";
}

function splitList(value: string | undefined): string[] {
  return (value ?? "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseOperatorRow(row: Record<string, string>): Operator | null {
  const id = (row["id"] ?? "").trim();
  if (!id) return null;

  const seatHours = Number(row["seat_hours"] ?? "0");
  const safeSeatHours = Number.isFinite(seatHours) && seatHours >= 0 ? seatHours : 0;

  const rawStatus = (row["status"] ?? "active").trim();
  const status: Operator["status"] =
    rawStatus === "verified" || rawStatus === "featured" ? rawStatus : "active";

  return {
    id,
    name: (row["name"] ?? "Unnamed Operator").trim(),
    trade: (row["trade"] ?? "Operator").trim(),
    machines: splitList(row["machines"]),
    terrains: splitList(row["terrains"]),
    seatHours: safeSeatHours,
    certifications: splitList(row["certifications"]),
    videoUrl: (row["video_url"] ?? "").trim(),
    whatsapp: (row["whatsapp"] ?? "").trim(),
    location: (row["location"] ?? "").trim(),
    bio: (row["bio"] ?? "").trim(),
    status,
  };
}