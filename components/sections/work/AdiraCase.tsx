import Image from "next/image";
import type { Project } from "@/content/portfolio";
import { ProjectText } from "./ProjectText";
import { PANEL } from "./panel";
import home from "@/public/work/adira-home.png";
import impact from "@/public/work/adira-impact.png";
import solutions from "@/public/work/adira-solutions.png";
import mobile from "@/public/work/adira-mobile.png";

const PRINT = "overflow-hidden rounded-[16px] border border-line shadow-[0_24px_60px_-30px_rgb(0_0_0/0.5)] transition-transform duration-700 ease-out";

/**
 * Project 01: the shipped one. Real screenshots of the live site stacked
 * like prints; they drift as the panel slides by and fan out on hover.
 */
export function AdiraCase({ project }: { project: Project }) {
  return (
    <article
      id="project-adira"
      data-panel
      aria-labelledby="adira-title"
      className={`${PANEL} grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-12`}
    >
      <ProjectText
        project={project}
        headingId="adira-title"
        title={
          <>
            AdiRa <span className="italic font-light">BioCycle</span>
          </>
        }
      />

      <figure data-reveal-in className="flex min-h-0 flex-col justify-center px-[4%] [[data-h=on]_&]:h-full [[data-h=on]_&]:px-0">
        <div className="group relative mx-auto aspect-[1440/1000] w-full [[data-h=on]_&]:h-[calc(100%-2.5rem)] [[data-h=on]_&]:max-w-full [[data-h=on]_&]:w-auto">
          <div data-parallax className="absolute right-0 top-0 w-[56%]">
            <div className={`${PRINT} rotate-[3deg] group-hover:translate-x-3 group-hover:rotate-[6deg]`}>
              <Image src={impact} alt="AdiRa BioCycle Impact page" sizes="(min-width: 1024px) 30vw, 56vw" placeholder="blur" />
            </div>
          </div>
          <div className="absolute left-0 top-[5%] w-[50%]">
            <div className={`${PRINT} -rotate-[4deg] group-hover:-translate-x-3 group-hover:-rotate-[7deg]`}>
              <Image src={solutions} alt="AdiRa BioCycle Solutions page" sizes="(min-width: 1024px) 26vw, 50vw" placeholder="blur" />
            </div>
          </div>
          <div className="absolute inset-x-[5%] bottom-[2%]">
            <div className={`${PRINT} group-hover:-translate-y-2`}>
              <Image src={home} alt="AdiRa BioCycle home page on desktop" sizes="(min-width: 1024px) 44vw, 90vw" placeholder="blur" />
            </div>
          </div>
          <div data-parallax className="absolute -bottom-[3%] right-0 w-[20%]">
            <div className={`${PRINT} rounded-[20px] border-[4px] border-ink group-hover:-translate-y-4 group-hover:rotate-[3deg]`}>
              <Image src={mobile} alt="AdiRa BioCycle home page on a phone" sizes="(min-width: 1024px) 11vw, 20vw" placeholder="blur" />
            </div>
          </div>
        </div>
        <figcaption className="mt-4 text-[0.85rem] text-muted">
          Screenshots of the live site. Its figures are the client&apos;s own.
        </figcaption>
      </figure>
    </article>
  );
}
