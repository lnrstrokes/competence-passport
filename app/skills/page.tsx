import Link from "next/link";
import { getOperators } from "@/lib/sheet";
import { SKILL_CATEGORIES, categorizeOperator } from "@/lib/taxonomy";

export const revalidate = 300;

export default async function SkillsPage() {
  const operators = await getOperators();

  return (
    <main className="container">
      <Link href="/" className="back">← Home</Link>
      <header className="hero">
        <p className="eyebrow">Browse by skill</p>
        <h1>Find operators by what they do.</h1>
        <p className="sub">
          Each category groups verified operators by the machines and work they&apos;re proven in —
          pick a category to see candidates.
        </p>
      </header>

      <section className="grid">
        {SKILL_CATEGORIES.map((c) => {
          const count = operators.filter((o) => categorizeOperator(o).includes(c.slug)).length;
          return (
            <Link key={c.slug} href={`/skills/${c.slug}`} className="card">
              <div className="cardTop">
                <span className="badge">{c.label}</span>
                <span className="score">{count}</span>
              </div>
              <p className="muted">{c.summary}</p>
              <span className="btn btnGhost">View operators →</span>
            </Link>
          );
        })}
      </section>

      <div className="callout" style={{ marginTop: 24 }}>
        <strong>Tip:</strong> not sure what you need? Use the{" "}
        <Link href="/#matchmaker" style={{ color: "var(--accent)" }}>matchmaker</Link>{" "}
        — paste the job description and AI will rank the best fits.
      </div>
    </main>
  );
}