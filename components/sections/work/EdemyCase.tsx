import type { Project } from "@/content/portfolio";
import { ProjectText } from "./ProjectText";
import { PANEL } from "./panel";

// The two sides of the platform, as described in the project brief.
const SIDES = [
  { who: "Instructors", steps: ["Create a course", "Upload media to Cloudinary", "Publish it"] },
  { who: "Students", steps: ["Find a course", "Pay with Stripe", "Start learning"] },
] as const;

/**
 * Project 02: the full-stack build. No screenshots exist, so the visual is a
 * typographic composition rather than a fake UI: the two roles the platform
 * serves, side by side, joined by the auth layer that keeps them apart.
 */
export function EdemyCase({ project }: { project: Project }) {
  return (
    <article
      id="project-edemy"
      data-panel
      aria-labelledby="edemy-title"
      className={`${PANEL} grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-12`}
    >
      <ProjectText project={project} headingId="edemy-title" title={<span className="italic font-light">Edemy</span>} />

      <figure data-reveal-in className="min-w-0">
        <div className="rounded-[1.5rem] border border-line p-6 sm:p-8">
          <div className="grid gap-8 sm:grid-cols-2 sm:gap-6">
            {SIDES.map((side, s) => (
              <div key={side.who}>
                <p className="display text-[clamp(1.6rem,1.2rem+1.4vw,2.4rem)] italic leading-none">
                  {side.who}
                </p>
                <ol className="mt-5 flex flex-col gap-3">
                  {side.steps.map((step, i) => (
                    <li key={step} className="flex items-baseline gap-3 border-t border-line pt-3">
                      <span className={`eyebrow ${s === 0 ? "text-accent" : "text-muted"}`}>0{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
          <p className="mt-7 flex items-center gap-3 border-t border-dashed border-line pt-4 text-[0.95rem] text-muted">
            <span aria-hidden="true" className="inline-block size-2 rounded-full bg-accent" />
            One sign-in, two roles: role-based access decides what each side can do.
          </p>
        </div>
        <figcaption className="mt-3 text-[0.85rem] text-muted">
          How the platform works, set as type. No screenshots of the app are shown.
        </figcaption>
      </figure>
    </article>
  );
}
