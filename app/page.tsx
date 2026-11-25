import { Hero } from "@/components/sections/Hero";
import { Strengths } from "@/components/sections/Strengths";
import { Work } from "@/components/sections/Work";
import { About } from "@/components/sections/About";
import { Play } from "@/components/sections/Play";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Hero />
      <Strengths />
      <Work />
      <About />
      <Play />
      <Contact />
    </>
  );
}
