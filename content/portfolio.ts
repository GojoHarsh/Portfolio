// Every fact on the site lives here, taken from Harsh's résumé and brief.
// Edit this file to update the site; components only handle presentation.

export const person = {
  name: "Harsh Kumar",
  firstName: "Harsh",
  location: "Patna, India",
  roles: ["MCA Student", "Web Development & AI Intern"],
  email: "harsh82525@gmail.com",
  linkedin: "https://www.linkedin.com/in/harsh-kumar-0b94292a3/",
  // Verified: the profile Harsh pushes this site to.
  github: "https://github.com/GojoHarsh" as string | null,
};

export const hero = {
  eyebrow: "Full-stack developer · MCA at SRMIST",
  greeting: "Hi, I'm Harsh Kumar —",
  headline: ["I build websites", "& the systems", "behind them."],
  intro:
    "I like knowing what happens behind the interface, so I build both sides of it, and I learn best by shipping real things. Curious by default, building as I go.",
  cue: "Scroll to start the ride",
};

/**
 * The page reads as one ride: the loader pumps up the tyres, then a
 * narrator's line opens each section and hands over from the last one.
 */
export const story = {
  bring: "Tyres pumped. Here’s what I bring along.",
  work: "Four stops on the route so far.",
  about: "So, who’s riding?",
  play: "Your turn to ride.",
  // The contact section opens with contact.kicker.
  end: "Thanks for riding along, and for stopping by my little corner.",
};

/**
 * What Harsh brings to a team: four strengths, each grounded in the résumé.
 * Each says what he can do; the work that shows it is one link away, so
 * the projects are described once, in Work.
 */
export const strengths = {
  title: { plain: "From requirements to", em: "release" },
  intro: "Hands-on with MERN and Next.js, and happiest when I own the work from the first brief to the live site.",
  items: [
    {
      title: { plain: "End-to-end", em: "delivery" },
      text: "I can take a project the whole way on my own: design it, build it, deploy it and set up the domain.",
      proof: { href: "#project-adira", label: "See AdiRa BioCycle" },
    },
    {
      title: { plain: "Full-stack,", em: "the hard parts" },
      text: "I'm comfortable with the parts that have to be right, not just look right: authentication, role-based access, payments and media storage.",
      proof: { href: "#project-edemy", label: "See Edemy" },
    },
    {
      title: { plain: "AI-driven features,", em: "in a team" },
      text: "I work in sprints with a cross-functional team, turning product requirements into shipped features for an AI-driven product.",
      proof: { href: "#project-enrichment", label: "See the Enrichment Layer" },
    },
    {
      title: { plain: "Quick to learn,", em: "glad to teach" },
      text: "New frameworks and tools don't stay new to me for long, and I like passing on what I learn.",
      proof: { href: "#about", label: "More about me" },
    },
  ],
};

export type Project = {
  id: string;
  index: string;
  title: string;
  kind: string;
  summary: string;
  contribution: string[];
  stack: string[];
  meta?: string;
  links?: { href: string; label: string }[];
};

export const projects: Project[] = [
  {
    id: "adira",
    index: "01",
    title: "AdiRa BioCycle",
    kind: "Corporate website · shipped",
    summary:
      "A multi-page website for a circular-economy and waste-management company, taken from client requirements to a live, customer-facing site.",
    contribution: [
      "Designed and developed the multi-page corporate website.",
      "Turned client requirements into the Solutions, Impact and Partnerships pages.",
      "Built the assessment-request and contact flows.",
      "Handled deployment on Vercel and the custom domain on Hostinger.",
    ],
    stack: ["Next.js", "React", "Vercel", "Hostinger"],
    links: [{ href: "https://adirabiocycle.in/", label: "Visit adirabiocycle.in" }],
  },
  {
    id: "enrichment",
    index: "02",
    title: "Enrichment Layer",
    kind: "Professional work · BDA Technologies",
    meta: "Web Development & AI Intern · September 2026 – present",
    summary:
      "The layer of BDA Technologies' GTM product that turns sign-up spreadsheets into one clean user database and prepares outreach a person approves. I built this layer; the wider product is a team effort.",
    contribution: [
      "Imports with column mapping, a preview and resumable saves.",
      "Rule-based enrichment, and segments that explain why each person is in them.",
      "Personalised email and WhatsApp drafts written with OpenAI, approved before sending.",
      "Email campaigns through Listmonk over SMTP, with opens, clicks and IMAP replies tracked.",
      "WhatsApp integration with batch sends, daily caps and delivery status from webhooks.",
    ],
    stack: ["Next.js", "PostgreSQL", "Prisma", "OpenAI", "Listmonk + SMTP", "IMAP", "WhatsApp (WA-AKG)"],
  },
  {
    id: "gocart",
    index: "03",
    title: "GoCart",
    kind: "Multivendor marketplace · capstone project, SRMIST",
    summary:
      "A marketplace where sellers open their own stores and list products, shoppers browse and pay, and an admin approves stores and manages coupons.",
    contribution: [
      "Seller stores with their own products, stock and orders; new stores wait for admin approval.",
      "AI product listings: upload a photo and a vision model drafts the name and description.",
      "Stripe checkout, Clerk sign-in with roles, and product images on ImageKit.",
      "Background jobs with Inngest: expiring coupons and keeping users in sync with Clerk.",
    ],
    stack: ["Next.js", "Prisma", "Neon PostgreSQL", "Clerk", "Stripe", "ImageKit", "Inngest"],
    links: [
      { href: "https://go-cart-iota-opal.vercel.app/", label: "Live demo" },
      { href: "https://github.com/GojoHarsh/GoCart", label: "Code on GitHub" },
    ],
  },
  {
    id: "edemy",
    index: "04",
    title: "Edemy",
    kind: "Learning platform · full-stack personal project",
    summary:
      "A MERN e-learning platform where instructors create and sell courses and students learn from them.",
    contribution: [
      "Separate instructor and student experiences.",
      "Course creation and delivery workflows.",
      "Authentication with role-based access control.",
      "Payments through Stripe; course media stored on Cloudinary.",
    ],
    stack: ["MongoDB", "Express.js", "React", "Node.js", "Stripe", "Cloudinary"],
    links: [{ href: "https://github.com/GojoHarsh/Edemy", label: "Code on GitHub" }],
  },
];

export const about = {
  // The projects, role and skills each have their own section, so About
  // stays personal: how I learn, what I do away from the screen.
  paragraphs: [
    "I enjoy learning by making things, understanding why they work, and occasionally figuring out why they don't.",
    "Outside the browser, you'll probably find me cycling, exploring new routes, or discovering something new to experiment with.",
  ],
  education: [
    { degree: "MCA", place: "SRMIST, Delhi-NCR", period: "August 2025 – Present" },
    { degree: "BCA", place: "B.D. College, Patna", period: "July 2022 – March 2025" },
  ],
  volunteering:
    "Volunteer programming tutor — introduced students with limited prior exposure to computers to basic computing and coding concepts.",
};

/** Read as a sentence; each tool is emphasised in place. */
export const toolbox: { lead: string; tools: string[]; tail?: string }[] = [
  { lead: "Mostly I write", tools: ["JavaScript", "HTML", "CSS"] },
  { lead: "On the front, I reach for", tools: ["React", "Next.js"] },
  { lead: "behind it,", tools: ["Node.js", "Express.js", "REST APIs"] },
  { lead: "Data lives in", tools: ["MongoDB", "PostgreSQL"] },
  {
    lead: "And along the way:",
    tools: ["Git/GitHub", "Prisma", "Crawlee", "SearXNG", "Stripe", "Cloudinary", "Vercel", "Hostinger"],
  },
];

/** Read as one sentence; `tool` parts are emphasised like the toolbox. */
export const aiToolbox = {
  label: "AI-assisted development",
  parts: [
    { tool: "Claude" },
    " and ",
    { tool: "Claude Code" },
    " for ",
    { tool: "AI-assisted coding" },
    " and ",
    { tool: "prompt-driven development" },
    ", always followed by my own ",
    { tool: "code review and verification" },
    ".",
  ] as (string | { tool: string })[],
};

export const contact = {
  kicker: "Have something interesting in mind?",
  headline: "Let’s make something.",
  /** The postcard: pick what it's about, and the email is started for you. */
  topics: [
    { id: "project", label: "a project", subject: "About a project", line: "I'd love to talk about a project." },
    { id: "role", label: "a job or internship", subject: "About a job or internship", line: "I'd love to talk about a job or internship." },
    { id: "collab", label: "a collaboration", subject: "About a collaboration", line: "I'd love to talk about a collaboration." },
    { id: "hi", label: "just saying hi", subject: "Just saying hi", line: "Just saying hi!" },
  ],
};

export const nav = [
  { id: "what-i-bring", label: "What I bring" },
  { id: "work", label: "Work" },
  { id: "about", label: "About" },
  { id: "play", label: "Play" },
  { id: "contact", label: "Contact" },
] as const;
