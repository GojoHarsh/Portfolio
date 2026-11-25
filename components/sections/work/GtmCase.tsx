import type { Project } from "@/content/portfolio";
import { ProjectText } from "./ProjectText";
import { PANEL } from "./panel";

const STAGES = [
  { n: "01", title: "Search", note: "SearXNG finds candidate websites." },
  { n: "02", title: "Discover", note: "Results become sites worth visiting." },
  { n: "03", title: "Crawl", note: "Crawlee visits their pages." },
  { n: "04", title: "Extract", note: "Company info becomes structured data." },
] as const;

/**
 * Project 03: professional work. Typography-led, with a deliberately
 * abstract four-step picture of the workflow. No product UI, data,
 * endpoints or internal architecture are shown.
 */
export function GtmCase({ project }: { project: Project }) {
  return (
    <article
      id="project-gtm"
      data-panel
      aria-labelledby="gtm-title"
      className={`${PANEL} grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-12`}
    >
      <ProjectText
        project={project}
        headingId="gtm-title"
        title={
          <>
            GTM Lead <span className="italic font-light">Capture Engine</span>
          </>
        }
      />

      <figure className="min-w-0">
        <ol data-steps className="grid grid-cols-2 gap-3 sm:gap-4">
          {STAGES.map((s, i) => (
            <li key={s.n} data-reveal-in className="flex flex-col rounded-[1.25rem] bg-surface p-4 sm:p-5">
              <span className="eyebrow text-muted">{s.n}</span>
              <span className="display mt-1 text-[1.35rem] italic leading-tight">{s.title}</span>
              <div className="my-3 aspect-[16/8] w-full">
                <Vignette index={i} />
              </div>
              <p className="mt-auto text-[0.85rem] leading-snug text-muted max-sm:hidden">{s.note}</p>
            </li>
          ))}
        </ol>
        <figcaption className="mt-3 text-[0.85rem] text-muted">
          A simplified, public-safe picture of the workflow. No code, data, endpoints or internal architecture.
        </figcaption>
      </figure>
    </article>
  );
}

/** Small abstract drawings, one per step. currentColor = ink, accent for emphasis. */
function Vignette({ index }: { index: number }) {
  const common = { viewBox: "0 0 160 100", className: "h-full w-full overflow-visible", "aria-hidden": true } as const;
  if (index === 0)
    return (
      <svg {...common}>
        <rect x="8" y="36" width="144" height="28" rx="14" fill="none" stroke="currentColor" strokeOpacity=".35" />
        <rect data-query x="20" y="47" width="86" height="6" rx="3" className="fill-accent" />
        <circle cx="134" cy="50" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M138.5 54.5 L143 59" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  if (index === 1)
    return (
      <svg {...common}>
        {[
          [30, 30], [58, 22], [90, 34], [122, 24], [40, 62], [74, 56], [104, 70], [134, 58], [56, 86], [118, 88],
        ].map(([x, y], i) => (
          <circle key={i} data-result cx={x} cy={y} r={i % 3 === 0 ? 7 : 5} className={i % 3 === 0 ? "fill-accent" : "fill-current opacity-40"} />
        ))}
      </svg>
    );
  if (index === 2)
    return (
      <svg {...common}>
        {[12, 62, 112].map((x, i) => (
          <g key={x} data-page>
            <rect x={x} y={18 + (i % 2) * 14} width="38" height="50" rx="6" fill="none" stroke="currentColor" strokeOpacity=".45" />
            <rect x={x + 7} y={28 + (i % 2) * 14} width="24" height="4" rx="2" className="fill-current opacity-40" />
            <rect x={x + 7} y={37 + (i % 2) * 14} width="17" height="4" rx="2" className="fill-current opacity-40" />
          </g>
        ))}
        <path
          data-crawl
          d="M8 90 C 30 80, 26 54, 31 46 S 70 90, 81 60 S 120 92, 131 54"
          fill="none"
          className="stroke-accent"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 5"
        />
      </svg>
    );
  return (
    <svg {...common}>
      {[0, 1, 2].map((r) => (
        <g key={r} data-row transform={`translate(0 ${18 + r * 26})`}>
          <rect x="8" y="0" width="34" height="14" rx="7" className="fill-accent" />
          <rect x="48" y="0" width="52" height="14" rx="7" className="fill-current opacity-35" />
          <rect x="106" y="0" width="46" height="14" rx="7" className="fill-current opacity-20" />
        </g>
      ))}
    </svg>
  );
}
