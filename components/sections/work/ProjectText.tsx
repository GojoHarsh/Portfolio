import type { Project } from "@/content/portfolio";

/**
 * The written half of a project panel. Children marked [data-reveal-in]
 * slide in when the panel arrives (driven by Work).
 */
export function ProjectText({
  project,
  title,
  headingId,
  tone = "default",
}: {
  project: Project;
  title: React.ReactNode;
  headingId: string;
  tone?: "default" | "inverse";
}) {
  const muted = tone === "inverse" ? "text-on-accent/75" : "text-muted";
  return (
    <div className="flex flex-col gap-4">
      <p data-reveal-in className={`eyebrow ${muted}`}>
        <span className="display mr-3 text-[1rem] normal-case italic tracking-normal">{project.index}</span>
        {project.kind}
      </p>
      <h3 id={headingId} data-reveal-in className="display text-[clamp(2.1rem,1.3rem+2.4vw,3.6rem)] leading-[1] [[data-h=on]_&]:text-[clamp(1.9rem,0.9rem+2.2vw,3.2rem)]">
        {title}
      </h3>
      {project.meta ? (
        <p data-reveal-in className={`-mt-1 text-[0.95rem] ${muted}`}>
          {project.meta}
        </p>
      ) : null}
      <p data-reveal-in className="max-w-[32rem] text-[1rem] leading-[1.55] sm:text-[1.05rem]">
        {project.summary}
      </p>
      <ul data-reveal-in data-compact-hide className="flex max-w-[32rem] flex-col gap-1.5 text-[0.95rem] max-sm:hidden">
        {project.contribution.map((item) => (
          <li key={item} className="flex gap-3">
            <span aria-hidden="true" className={`mt-[0.7em] h-px w-4 shrink-0 ${tone === "inverse" ? "bg-on-accent" : "bg-accent"}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p data-reveal-in className={`text-[0.9rem] ${muted}`}>
        <span className="sr-only">Built with: </span>
        {project.stack.join("  ·  ")}
      </p>
      {project.link ? (
        <a
          data-reveal-in
          href={project.link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex w-fit items-center gap-2 font-medium"
        >
          <span className="u-link">Visit {project.link.label}</span>
          <span aria-hidden="true" className="transition-transform duration-500 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
            ↗
          </span>
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : null}
    </div>
  );
}
