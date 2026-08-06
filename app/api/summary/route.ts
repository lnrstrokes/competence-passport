import { getOperators } from "@/lib/sheet";
import { completeJson } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const operators = await getOperators();
  const op = operators.find((o) => o.id === id);
  if (!op) return Response.json({ error: "Operator not found" }, { status: 404 });

  try {
    const { data, provider } = await completeJson<{ summary: string; watchFor: string[] }>({
      system:
        "You are an AI competence verifier for heavy-equipment operators. You summarize verified operator profiles for international recruiters. Respond with valid JSON only.",
      user: [
        `Name: ${op.name}`,
        `Trade: ${op.trade}`,
        `Machines: ${op.machines.join(", ")}`,
        `Terrains: ${op.terrains.join(", ")}`,
        `Total seat hours: ${op.seatHours}`,
        `Certifications: ${op.certifications.join(", ") || "none listed"}`,
        `Bio: ${op.bio}`,
        'Produce JSON: { "summary": one paragraph on this operator\'s proven competence and best-fit use, "watchFor": 3 short items an employer should verify when watching the video proof }.',
      ].join("\n"),
    });
    return Response.json({ ...data, provider });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
