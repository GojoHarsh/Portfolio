import Image from "next/image";
import type { Project } from "@/content/portfolio";
import { ProjectText } from "./ProjectText";
import { PANEL } from "./panel";
import home from "@/public/work/gocart-home.png";
import product from "@/public/work/gocart-product.png";
import mobile from "@/public/work/gocart-mobile.png";

const SHADOW = "shadow-[0_28px_60px_-28px_rgb(0_0_0/0.5)] transition-transform duration-700 ease-out";

/** A browser window around a screenshot, with the address it was taken at. */
function Window({ children, address }: { children: React.ReactNode; address: string }) {
  return (
    <div className={`overflow-hidden rounded-[14px] border border-line bg-bg ${SHADOW}`}>
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
        <span className="size-2 rounded-full bg-line" />
        <span className="size-2 rounded-full bg-line" />
        <span className="size-2 rounded-full bg-line" />
        <span className="ml-2 truncate text-[0.7rem] text-muted">{address}</span>
      </div>
      {children}
    </div>
  );
}

/**
 * Project 03: the capstone. Real screenshots of the live demo store, set
 * square to the page like devices on a desk (AdiRa's prints are fanned;
 * this one stands up straight): the storefront, a product page behind it,
 * and the same store on a phone.
 */
export function GoCartCase({ project }: { project: Project }) {
  return (
    <article
      id="project-gocart"
      data-panel
      aria-labelledby="gocart-title"
      className={`${PANEL} grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-12`}
    >
      <ProjectText
        project={project}
        headingId="gocart-title"
        title={
          <>
            Go<span className="italic font-light">Cart</span>
          </>
        }
      />

      <figure data-reveal-in className="flex min-h-0 flex-col justify-center [[data-h=on]_&]:h-full">
        <div className="group relative mx-auto aspect-[1440/1000] w-full [[data-h=on]_&]:h-full [[data-h=on]_&]:w-auto [[data-h=on]_&]:max-w-full">
          <div data-parallax className="absolute right-0 top-0 w-[56%] group-hover:-translate-y-2">
            <Window address="go-cart-iota-opal.vercel.app/product">
              <Image src={product} alt="GoCart product page with price, offer and add to cart" sizes="(min-width: 1024px) 28vw, 56vw" placeholder="blur" />
            </Window>
          </div>
          <div className="absolute bottom-[6%] left-0 w-[74%] group-hover:-translate-x-1">
            <Window address="go-cart-iota-opal.vercel.app">
              <Image src={home} alt="GoCart storefront home page" sizes="(min-width: 1024px) 37vw, 74vw" placeholder="blur" />
            </Window>
          </div>
          <div data-parallax className="absolute bottom-0 right-[4%] w-[19%]">
            <div className={`overflow-hidden rounded-[18px] border-[4px] border-ink bg-bg ${SHADOW} group-hover:-translate-y-3`}>
              <Image src={mobile} alt="GoCart home page on a phone" sizes="(min-width: 1024px) 10vw, 19vw" placeholder="blur" />
            </div>
          </div>
        </div>
      </figure>
    </article>
  );
}
