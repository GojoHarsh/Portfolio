"use client";

import { useRef, useState } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/components/motion/gsap";
import { contact, person } from "@/content/portfolio";
import { Postmark, Stamp } from "./Stamp";

type Topic = (typeof contact.topics)[number];

/** A mailto link with the subject and first lines already written. */
function mailto(topic: Topic | undefined) {
  const subject = topic?.subject ?? "Hello from your website";
  const body = `Dear Harsh,\n\n${topic ? `${topic.line}\n\n` : ""}`;
  return `mailto:${person.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * The way to get in touch, as a postcard: the message side starts the
 * email ("Dear Harsh, I'd love to talk about…"), the address side has the
 * address itself, a stamp and a postmark. Nothing is sent from the page;
 * the button opens the visitor's own mail app. It rests on an airmail
 * envelope, and with a mouse it lifts and tilts towards the pointer.
 */
export function Postcard() {
  const ref = useRef<HTMLDivElement>(null);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const topic = contact.topics.find((t) => t.id === topicId);

  useGSAP(
    () => {
      // Bound to the element, not the ref (see Loader: React's development
      // remount empties refs while GSAP cleans up).
      const root = ref.current!;
      const q = gsap.utils.selector(root);
      const stack = q<HTMLElement>("[data-stack]")[0];
      const card = q<HTMLElement>("[data-card]")[0];
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // The card arrives, the stamp is stuck on, the postmark lands on it.
        gsap
          .timeline({ scrollTrigger: { trigger: root, start: "top 85%", once: true } })
          .fromTo(stack, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power4.out" })
          .fromTo(q("[data-stamp]"), { scale: 1.3, rotation: 10, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.6, ease: "back.out(2)" }, 0.45)
          .fromTo(q("[data-postmark]"), { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "power4.in" }, 0.85);
      });

      // With a mouse: the card lifts off the envelope and tilts a little
      // towards the pointer, like a card picked up to be read.
      mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        gsap.set(card, { transformPerspective: 1600 });
        const tiltX = gsap.quickTo(card, "rotationX", { duration: 0.7, ease: "power3" });
        const tiltY = gsap.quickTo(card, "rotationY", { duration: 0.7, ease: "power3" });
        const lift = gsap.quickTo(card, "y", { duration: 0.7, ease: "power3" });
        const move = (e: PointerEvent) => {
          const r = stack.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          tiltY(px * 7);
          tiltX(-py * 6);
          lift(-10);
        };
        const rest = () => {
          tiltX(0);
          tiltY(0);
          lift(0);
        };
        stack.addEventListener("pointermove", move);
        stack.addEventListener("pointerleave", rest);
        return () => {
          stack.removeEventListener("pointermove", move);
          stack.removeEventListener("pointerleave", rest);
        };
      });
    },
    { dependencies: [] },
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(person.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the mailto link still works.
    }
  };

  return (
    <div ref={ref}>
      <div data-stack className="group/stack relative">
        {/* An airmail envelope under the card: its striped edge peeks out,
            and fans out a little more when the card is picked up. It only
            turns on wide screens, where the card is short enough for it. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 translate-x-2 translate-y-2.5 rounded-[1.25rem] bg-[repeating-linear-gradient(135deg,var(--accent)_0_12px,var(--surface)_12px_24px)] p-[9px] shadow-[0_24px_50px_-28px_rgb(0_0_0/0.35)] transition-[rotate,translate] duration-700 ease-out group-hover/stack:translate-x-4 group-hover/stack:translate-y-4 lg:translate-x-3 lg:translate-y-3 lg:rotate-[2.5deg] lg:group-hover/stack:translate-x-5 lg:group-hover/stack:translate-y-5 lg:group-hover/stack:rotate-[3.5deg] dark:shadow-[0_24px_50px_-24px_rgb(0_0_0/0.8)]"
        >
          <div className="h-full w-full rounded-[0.8rem] bg-surface" />
        </div>
        {/* Layered shadows lift the card off the page; deeper when picked up. */}
        <div
          data-card
          className="relative grid overflow-hidden rounded-[1.25rem] border border-line bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.06),0_14px_28px_-14px_rgb(0_0_0/0.22),0_40px_80px_-36px_rgb(0_0_0/0.4)] transition-[rotate,box-shadow] duration-700 ease-out group-hover/stack:shadow-[0_2px_4px_rgb(0_0_0/0.06),0_24px_44px_-18px_rgb(0_0_0/0.3),0_64px_110px_-40px_rgb(0_0_0/0.5)] lg:-rotate-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:group-hover/stack:rotate-0 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_14px_28px_-14px_rgb(0_0_0/0.6),0_40px_80px_-30px_rgb(0_0_0/0.85)] dark:group-hover/stack:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_24px_44px_-18px_rgb(0_0_0/0.7),0_64px_110px_-36px_rgb(0_0_0/0.95)]"
        >
          {/* Message side */}
          <div className="flex flex-col p-6 sm:p-10">
            <p className="display text-[clamp(1.8rem,1.3rem+1.6vw,2.6rem)] italic leading-none">Dear Harsh,</p>
            <fieldset className="mt-6">
              <legend className="text-lead">I&rsquo;d love to talk about&hellip;</legend>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {contact.topics.map((t) => (
                  <label
                    key={t.id}
                    className="cursor-pointer rounded-full border border-line px-4 py-2 text-[0.98rem] transition-colors duration-300 hover:border-ink has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-bg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
                  >
                    <input
                      type="radio"
                      name="topic"
                      value={t.id}
                      checked={topicId === t.id}
                      onChange={() => setTopicId(t.id)}
                      className="sr-only"
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Ruled lines, like the back of a postcard; the chosen topic writes itself in. */}
            <div aria-hidden="true" className="mt-6 text-[clamp(1.15rem,1rem+0.5vw,1.45rem)]">
              <p className="display h-11 border-b border-line pt-3 italic leading-none">
                {topic ? (
                  <span key={topic.id} className="inline-block animate-[write_0.9s_var(--ease-out)] text-accent motion-reduce:animate-none">
                    {topic.line}
                  </span>
                ) : (
                  <span className="text-muted/70">Pick one, and the first line writes itself.</span>
                )}
              </p>
              <p className="h-11 border-b border-line" />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:mt-auto sm:pt-10">
              <a
                href={mailto(topic)}
                data-magnetic
                className="group inline-flex h-14 w-fit items-center gap-3 rounded-full bg-ink pl-7 pr-2 text-[1.05rem] text-bg transition-colors duration-300 hover:bg-accent hover:text-on-accent"
              >
                Write it in your mail app
                <span className="grid size-10 place-items-center rounded-full bg-bg text-ink transition-transform duration-500 ease-out group-hover:-rotate-45">
                  →
                </span>
              </a>
              <p className="text-[0.9rem] text-muted">Opens your email app, with the first lines written. Nothing is sent from this page.</p>
            </div>
          </div>

          {/* Address side */}
          <div className="relative border-t border-line p-6 sm:p-10 lg:border-l lg:border-t-0">
            <div className="flex justify-end">
              <div className="relative">
                <div data-stamp className="rotate-[4deg]">
                  <Stamp className="w-28 sm:w-32" />
                </div>
                <div data-postmark className="pointer-events-none absolute -bottom-7 right-14 w-44 sm:right-16 sm:w-52">
                  <Postmark year={new Date().getFullYear()} className="-rotate-12" />
                </div>
              </div>
            </div>
            <dl className="mt-10 text-[1rem]">
              <div className="flex items-baseline gap-3 border-b border-line pb-2">
                <dt className="eyebrow w-10 shrink-0 text-muted">To</dt>
                <dd className="display text-[1.35rem] italic">{person.name}</dd>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line py-2.5">
                <dt className="eyebrow w-10 shrink-0 text-muted">Email</dt>
                <dd className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <a href={`mailto:${person.email}`} className="u-link whitespace-nowrap">
                    {person.email}
                  </a>
                  <button
                    type="button"
                    onClick={copy}
                    className="h-8 rounded-full border border-line px-3 text-[0.85rem] transition-colors hover:border-ink"
                  >
                    {copied ? "Copied ✓" : "Copy"}
                  </button>
                  <span className="sr-only" aria-live="polite">
                    {copied ? "Email address copied" : ""}
                  </span>
                </dd>
              </div>
            </dl>
            <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[1rem]">
              <span className="text-muted">Or find me on</span>
              {[
                { href: person.linkedin, label: "LinkedIn" },
                ...(person.github ? [{ href: person.github, label: "GitHub" }] : []),
              ].map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1.5">
                  <span className="u-link">{link.label}</span>
                  <span aria-hidden="true" className="transition-transform duration-500 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                    ↗
                  </span>
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
