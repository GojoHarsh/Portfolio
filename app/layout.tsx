import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { THEME_COLORS, themeScript } from "@/components/theme/theme-script";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { SiteNav } from "@/components/layout/SiteNav";
import { Loader } from "@/components/loader/Loader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { person } from "@/content/portfolio";
import "./globals.css";

// Fontshare fonts (ITF Free Font License, self-hosting permitted; files are
// the official, unmodified WOFF2 releases). See app/fonts/LICENSE-ITF-FFL.txt.
const zodiak = localFont({
  src: [
    { path: "./fonts/Zodiak-Variable.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/Zodiak-VariableItalic.woff2", weight: "100 900", style: "italic" },
  ],
  variable: "--font-zodiak",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

const generalSans = localFont({
  src: [{ path: "./fonts/GeneralSans-Variable.woff2", weight: "200 700", style: "normal" }],
  variable: "--font-general",
  display: "swap",
});

const title = `${person.name} — Full-stack developer`;
const description =
  "Harsh Kumar is a full-stack developer (MERN and Next.js) from Patna, India: an MCA student at SRMIST and a Web Development & AI Intern at BDA Technologies, who has shipped a live client website and built a learning platform with Stripe payments.";

export const metadata: Metadata = {
  title,
  description,
  // TODO: set to the production domain once deployed.
  metadataBase: new URL("http://localhost:3000"),
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
  ],
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: person.name,
  jobTitle: ["Full-stack developer", "Web Development & AI Intern"],
  worksFor: { "@type": "Organization", name: "BDA Technologies" },
  affiliation: { "@type": "CollegeOrUniversity", name: "SRM Institute of Science and Technology" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "B. D. College, Patna" },
  knowsAbout: ["JavaScript", "React", "Next.js", "Node.js", "Express.js", "MongoDB", "REST APIs", "Stripe"],
  address: { "@type": "PostalAddress", addressLocality: "Patna", addressCountry: "IN" },
  email: `mailto:${person.email}`,
  sameAs: [person.linkedin, ...(person.github ? [person.github] : [])],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${zodiak.variable} ${generalSans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      </head>
      <body>
        <a
          href="#main"
          className="eyebrow fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-ink px-4 py-2 text-bg focus:translate-y-0"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <SmoothScroll>
            <Loader />
            <SiteNav />
            {/* The page is a curtain over the footer: opaque, above it, with a
                rounded lower edge that lifts away at the end of the page. */}
            <main
              id="main"
              tabIndex={-1}
              className="relative z-10 rounded-b-[clamp(1.5rem,4vw,3rem)] bg-bg shadow-[0_40px_80px_-40px_rgb(0_0_0/0.45)] outline-none"
            >
              {children}
            </main>
            <SiteFooter />
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
