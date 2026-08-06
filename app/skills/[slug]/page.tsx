import Link from "next/link";
import { notFound } from "next/navigation";
import { getOperators } from "@/lib/sheet";
import { computeBacs } from "@/lib/bacs";
import { getCategory, categorizeOperator } from "@/lib/taxonomy";
import { OperatorCard } from "@/components/OperatorCard";

export const revalidate = 300;

export default async function SkillPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const operators = await getOperators();
  const scored = operators
    .filter((o) => categorizeOperator(o).includes(slug))
    .map((op) => ({ op, bacs: computeBacs(op) }))
    .sort((a, b) => b.bacs.score - a.bacs.score);

  return (
    <main className="container">
      <Link href="/skills" className="back">← All skills</Link>
      <header className="categoryHeader">
        <p className="eyebrow">
          {scored.length} verified {scored.length === 1 ? "operator" : "operators"}
        </p>
        <h1>{category.label}</h1>
        <p className="sub">{category.summary}</p>
      </header>

      {scored.length === 0 ? (
        <div className="notice">
          <p>No operators in this category yet. Check back soon, or use the matchmaker.</p>
        </div>
      ) : (
        <section className="grid">
          {scored.map(({ op, bacs }) => (
            <OperatorCard key={op.id} op={op} bacs={bacs} />
          ))}
        </section>
      )}

      <div className="callout" style={{ marginTop: 24 }}>
        <strong>Not what you need?</strong> Use the{" "}
        <Link href="/#matchmaker" style={{ color: "var(--accent)" }}>matchmaker</Link>{" "}
        to find the best fit for a specific job description.
      </div>
    </main>
  );
}