export interface Operator {
  id: string;
  name: string;
  trade: string;
  machines: string[];
  terrains: string[];
  seatHours: number;
  certifications: string[];
  videoUrl: string;
  photoUrl: string;
  whatsapp: string;
  location: string;
  bio: string;
  status: "active" | "verified" | "featured";
}

function clean(value: string | undefined): string {
  return (value ?? "").trim().replace(/^"+|"+$/g, "");
}

function splitList(value: string | undefined): string[] {
  return clean(value)
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseOperatorRow(row: Record<string, string>): Operator | null {
  const id = clean(row["id"]);
  if (!id) return null;

  const seatHours = Number(clean(row["seat_hours"]));
  const safeSeatHours = Number.isFinite(seatHours) && seatHours >= 0 ? seatHours : 0;

  const rawStatus = clean(row["status"]);
  const status: Operator["status"] =
    rawStatus === "verified" || rawStatus === "featured" ? rawStatus : "active";

  return {
    id,
    name: clean(row["name"]) || "Unnamed Operator",
    trade: clean(row["trade"]) || "Operator",
    machines: splitList(row["machines"]),
    terrains: splitList(row["terrains"]),
    seatHours: safeSeatHours,
    certifications: splitList(row["certifications"]),
    videoUrl: clean(row["video_url"]),
    photoUrl: clean(row["photo_url"]),
    whatsapp: clean(row["whatsapp"]),
    location: clean(row["location"]),
    bio: clean(row["bio"]),
    status,
  };
}
