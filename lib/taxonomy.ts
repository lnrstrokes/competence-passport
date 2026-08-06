import type { Operator } from "@/lib/schema";

export interface SkillCategory {
  slug: string;
  label: string;
  summary: string;
  keywords: string[];
}

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    slug: "earthmoving",
    label: "Earthmoving & Excavation",
    summary:
      "Excavators, bulldozers, wheel loaders and graders for site preparation, mining, and construction earthworks.",
    keywords: ["excavator", "bulldozer", "wheel loader", "grader", "loader", "backhoe", "digger", "earth"],
  },
  {
    slug: "cranes-lifting",
    label: "Cranes & Lifting",
    summary:
      "Mobile and tower cranes for precision lifts on bridges, high-rises and heavy installation work.",
    keywords: ["crane", "tower", "lifting", "hoist", "rigging", "lift"],
  },
  {
    slug: "haulage-transport",
    label: "Haulage & Transport",
    summary:
      "Tipper trucks, dump trucks and heavy haulage for material delivery and site logistics.",
    keywords: ["tipper", "dump truck", "truck", "haulage", "transporter", "dumper"],
  },
  {
    slug: "roadworks",
    label: "Road Construction",
    summary:
      "Operators for road building, land clearing and site preparation on civil projects.",
    keywords: ["road", "grader", "asphalt", "paving", "compactor", "roller"],
  },
];

export function getCategory(slug: string): SkillCategory | undefined {
  return SKILL_CATEGORIES.find((c) => c.slug === slug);
}

export function categorizeOperator(op: Operator): string[] {
  const haystack = [op.trade, ...op.machines, ...op.terrains].join(" ").toLowerCase();
  const hits = SKILL_CATEGORIES.filter((c) =>
    c.keywords.some((k) => haystack.includes(k)),
  );
  return hits.length > 0 ? hits.map((c) => c.slug) : ["other"];
}