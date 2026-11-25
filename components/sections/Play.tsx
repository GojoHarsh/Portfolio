import { SectionHeader } from "@/components/ui/SectionHeader";
import { story } from "@/content/portfolio";
import { RideGame } from "./play/RideGame";

/** Play: a small game made for this site, in the spirit of hill-climb games. */
export function Play() {
  return (
    <section id="play" aria-labelledby="play-title" className="px-[var(--gutter)] py-[var(--section-space)]">
      <SectionHeader
        index="04"
        label="Play"
        id="play-title"
        kicker={story.play}
        title={
          <>
            Ride along the <span className="italic">Ganga</span>
            <span className="text-accent">.</span>
          </>
        }
        aside="A small game I built for this site. How far along the riverbank can you get?"
      />

      <div className="mt-10 lg:mt-12">
        <RideGame />
      </div>
    </section>
  );
}
