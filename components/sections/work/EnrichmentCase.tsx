import Image from "next/image";
import type { Project } from "@/content/portfolio";
import { ProjectText } from "./ProjectText";
import { PANEL } from "./panel";
import users from "@/public/work/enrichment-users.png";
import rules from "@/public/work/enrichment-rules.png";
import insights from "@/public/work/enrichment-insights.png";

const CARD = "overflow-hidden rounded-[14px] border border-line bg-bg shadow-[0_28px_60px_-28px_rgb(0_0_0/0.5)] transition-transform duration-700 ease-out";

/**
 * Project 01: professional work. Real screens of the Enrichment Layer, taken
 * from a local copy running on the sample spreadsheet (dummy people only):
 * the users table as the window, with the segment rules and the insights
 * lifted out of it, since those are the parts that make it more than a list.
 * No integrations, endpoints or real data are shown.
 */
export function EnrichmentCase({ project }: { project: Project }) {
  return (
    <article
      id="project-enrichment"
      data-panel
      aria-labelledby="enrichment-title"
      className={`${PANEL} grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-12`}
    >
      <ProjectText
        project={project}
        headingId="enrichment-title"
        title={
          <>
            Enrichment <span className="italic font-light">Layer</span>
          </>
        }
      />

      <figure data-reveal-in className="flex min-h-0 flex-col justify-center [[data-h=on]_&]:h-full">
        <div className="group relative mx-auto aspect-[1440/1000] w-full [[data-h=on]_&]:h-[calc(100%-2.5rem)] [[data-h=on]_&]:w-auto [[data-h=on]_&]:max-w-full">
          {/* The app: the users table, everyone searchable and filterable */}
          <div className={`${CARD} absolute left-[5%] top-[12%] w-[80%] group-hover:-translate-y-1`}>
            <Image src={users} alt="Enrichment Layer users table with filters and segments, on sample data" sizes="(min-width: 1024px) 40vw, 80vw" placeholder="blur" />
          </div>
          {/* What the data says, from the imported columns */}
          <div data-parallax className="absolute right-0 top-0 w-[46%]">
            <div className={`${CARD} rotate-[1.5deg] group-hover:translate-x-2 group-hover:-translate-y-2`}>
              <Image src={insights} alt="User insights charts by role and challenge, on sample data" sizes="(min-width: 1024px) 24vw, 46vw" placeholder="blur" />
            </div>
          </div>
          {/* Segments as readable rules, each explaining its members */}
          <div data-parallax className="absolute bottom-0 left-0 w-[38%]">
            <div className={`${CARD} -rotate-[1.5deg] group-hover:-translate-x-2 group-hover:translate-y-1`}>
              <Image src={rules} alt="Enrichment and segment rules, each with its condition and member count" sizes="(min-width: 1024px) 20vw, 38vw" placeholder="blur" />
            </div>
          </div>
        </div>
        <figcaption className="mt-4 text-[0.85rem] text-muted">
          Screens from a local copy running on sample data. No real users, integrations or endpoints are shown.
        </figcaption>
      </figure>
    </article>
  );
}
