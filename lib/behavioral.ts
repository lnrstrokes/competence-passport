export const BEHAVIORAL = {
  ownerWhatsapp: "2347089711946",
  trustSignals: ["Video proof", "Verified seat hours", "Certifications", "Evidence Density"],
  frictionReducers: ["No signup", "Direct WhatsApp chat", "Employers are vetted"],
  cta: {
    hireLabel: "Hire on WhatsApp",
    hireMessage: (name: string, trade: string) =>
      `Hello ${name}, I found your Competence Passport on Operator Exchange. I'm hiring for a ${trade} role and I'd like to discuss terms.`,
    testLabel: "Request competence test",
    testMessage: (name: string, trade: string) =>
      `Hello ${name}, I'd like to request a competence/maneuver video to verify your ${trade} skill before engagement. I understand I cover equipment rental and associated charges.`,
    joinLabel: "I'm an operator — join",
    joinMessage: () =>
      "Hello, I'm a skilled operator and I'd like to join Operator Exchange. My trade is: [trade], machines: [machines], seat hours: [hours], location: [location].",
    href: (whatsapp: string, text: string) =>
      `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`,
  },
  scoreLabel: "BACS Competence Score",
  evidenceLabel: "Evidence Density",
} as const;
