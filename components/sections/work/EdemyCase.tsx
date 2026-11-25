import Image from "next/image";
import type { Project } from "@/content/portfolio";
import { ProjectText } from "./ProjectText";
import { PANEL } from "./panel";
import hero from "@/public/work/edemy-hero.png";
import mobile from "@/public/work/edemy-mobile.png";

// The two sides of the platform, as described in the project brief.
const SIDES = [
  { who: "Instructors", steps: ["Create a course", "Upload media to Cloudinary", "Publish it"] },
  { who: "Students", steps: ["Find a course", "Pay with Stripe", "Start learning"] },
] as const;

const SHADOW = "shadow-[0_28px_60px_-28px_rgb(0_0_0/0.5)] transition-transform duration-700 ease-out";

/**
 * Project 04: the full-stack build. The app's own landing page, on a
 * laptop and a phone, with a card that sets out how the platform works for
 * each of its two roles.
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

      <figure data-reveal-in className="flex min-h-0 flex-col justify-center [[data-h=on]_&]:h-full">
        <div className="group relative mx-auto aspect-[1440/1000] w-full [[data-h=on]_&]:h-full [[data-h=on]_&]:w-auto [[data-h=on]_&]:max-w-full">
          <div className={`absolute left-0 top-[3%] w-[76%] overflow-hidden rounded-[14px] border border-line bg-bg ${SHADOW} group-hover:-translate-y-1`}>
            <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
              <span className="size-2 rounded-full bg-line" />
              <span className="size-2 rounded-full bg-line" />
              <span className="size-2 rounded-full bg-line" />
            </div>
            <Image src={hero} alt="Edemy landing page with course search" sizes="(min-width: 1024px) 38vw, 76vw" placeholder="blur" />
          </div>

          {/* How it works, for each role */}
          <div data-parallax className="absolute bottom-0 left-[4%] w-[64%]">
            <div className={`rounded-[14px] border border-line bg-surface p-[4%] ${SHADOW} group-hover:-translate-x-2`}>
              <div className="grid grid-cols-2 gap-[6%]">
                {SIDES.map((side, s) => (
                  <div key={side.who}>
                    <p className="display text-[clamp(0.95rem,0.6rem+0.9vw,1.5rem)] italic leading-none">{side.who}</p>
                    <ol className="mt-2 flex flex-col">
                      {side.steps.map((step, i) => (
                        <li key={step} className="flex items-baseline gap-2 border-t border-line py-[0.3em] text-[clamp(0.6rem,0.45rem+0.35vw,0.85rem)]">
                          <span className={`eyebrow !text-[0.62em] ${s === 0 ? "text-accent" : "text-muted"}`}>0{i + 1}</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
              <p className="mt-2 flex items-center gap-2 border-t border-dashed border-line pt-2 text-[clamp(0.55rem,0.42rem+0.3vw,0.8rem)] text-muted">
                <span aria-hidden="true" className="inline-block size-1.5 shrink-0 rounded-full bg-accent" />
                One sign-in, two roles: role-based access decides what each side can do.
              </p>
            </div>
          </div>

          <div data-parallax className="absolute bottom-[2%] right-[2%] w-[21%]">
            <div className={`overflow-hidden rounded-[18px] border-[4px] border-ink bg-bg ${SHADOW} group-hover:-translate-y-3`}>
              <Image src={mobile} alt="Edemy landing page on a phone" sizes="(min-width: 1024px) 11vw, 21vw" placeholder="blur" />
            </div>
          </div>
        </div>
      </figure>
    </article>
  );
}
