export const BEHAVIORAL = {
  trustSignals: ["Video proof", "Verified seat hours", "Certifications", "Evidence Density"],
  frictionReducers: ["No signup", "Direct WhatsApp chat", "No middlemen"],
  primaryCta: {
    label: "Negotiate on WhatsApp",
    href: (whatsapp: string, name: string) =>
      `https://wa.me/${whatsapp}?text=${encodeURIComponent(
        `Hello ${name}, I found your Competence Passport. Let's talk about a job.`,
      )}`,
  },
  scoreLabel: "BACS Competence Score",
  evidenceLabel: "Evidence Density",
} as const;