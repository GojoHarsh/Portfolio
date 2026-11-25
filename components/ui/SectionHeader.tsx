import { Reveal } from "@/components/motion/Reveal";

/**
 * One header pattern for every section: a numbered label, the narrator's
 * line that carries the story on from the section before (the kicker), then
 * the title at the shared section size, with an optional aside. Consistency
 * here is what lets the individual compositions underneath be different.
 */
export function SectionHeader({
  index,
  label,
  id,
  kicker,
  title,
  aside,
}: {
  index: string;
  label: string;
  id: string;
  kicker?: React.ReactNode;
  title: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <Reveal className="grid items-end gap-x-10 gap-y-5 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <p className="eyebrow flex items-center gap-3 text-muted">
          <span className="display text-[1rem] normal-case italic tracking-normal text-accent">{index}</span>
          <span aria-hidden="true" className="h-px w-8 bg-line" />
          {label}
        </p>
        {kicker ? <Kicker>{kicker}</Kicker> : null}
        <h2 id={id} className={`display text-section ${kicker ? "mt-3" : "mt-5"}`}>
          {title}
        </h2>
      </div>
      {aside ? <div className="max-w-[24rem] text-muted lg:col-span-4 lg:justify-self-end lg:pb-2">{aside}</div> : null}
    </Reveal>
  );
}

/** The narrator's line above a section title. */
export function Kicker({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`display mt-6 text-[clamp(1.15rem,1rem+0.7vw,1.55rem)] italic text-muted ${className}`}>{children}</p>;
}
