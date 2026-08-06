import Link from "next/link";
import { SITE } from "@/config/site";
import { getOperators } from "@/lib/sheet";
import { computeBacs } from "@/lib/bacs";
import { BEHAVIORAL } from "@/lib/behavioral";
import { SKILL_CATEGORIES } from "@/lib/taxonomy";
import { Matchmaker } from "@/components/Matchmaker";
import { OperatorCard } from "@/components/OperatorCard";

export const revalidate = 300;

export default async function Home() {
  const operators = await getOperators();

  if (!SITE.sheetCsvUrl) {
    return (
      <main className="container">
        <div className="notice">
          <h1>{SITE.name}</h1>
          <p>Add <code>SHEET_CSV_URL</code> to your Vercel environment variables, then redeploy.</p>
        </div>
      </main>
    );
  }

  const scored = operators
    .map((op) => ({ op, bacs: computeBacs(op) }))
    .sort((a, b) => b.bacs.score - a.bacs.score);

  return (
    <main className="container">
      <header className="hero">
        <p className="eyebrow">{SITE.tagline}</p>
        <h1>Find a verified operator in seconds.</h1>
        <p className="sub">
          Every profile is video-verified, BACS-scored, and ready to negotiate directly —
          no signup, no middlemen. Employers are vetted before connection.
        </p>
        <div className="heroActions">
          <a
            className="btn"
            href={BEHAVIORAL.cta.href(BEHAVIORAL.ownerWhatsapp, BEHAVIORAL.cta.joinMessage())}
            target="_blank"
            rel="noopener noreferrer"
          >
            {BEHAVIORAL.cta.joinLabel}
          </a>
        </div>
      </header>

      <Matchmaker />

      <h2 className="sectionTitle">Browse by skill</h2>
      <div className="categoryBar">
        {SKILL_CATEGORIES.map((c) => (
          <Link key={c.slug} href={`/skills/${c.slug}`} className="chip">{c.label}</Link>
        ))}
        <Link href="/skills" className="chip">All skills →</Link>
      </div>

      {scored.length === 0 ? (
        <div className="notice">
          <p>No operators found yet. Check your sheet data and try again.</p>
        </div>
      ) : (
        <section className="grid">
          {scored.map(({ op, bacs }) => (
            <OperatorCard key={op.id} op={op} bacs={bacs} />
          ))}
        </section>
      )}
    </main>
  );
}