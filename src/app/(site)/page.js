import Hero from "@/components/sections/hero";
import SearchCard from "@/components/sections/search-card";
import {
  ServicesSection,
  StepsSection,
  BenefitsSection,
  StatsSection,
  CtaSection,
} from "@/components/sections/landing-sections";

export default function Beranda() {
  return (
    <>
      <Hero />
      <SearchCard />
      <ServicesSection />
      <StepsSection />
      <BenefitsSection />
      <StatsSection />
      <CtaSection />
    </>
  );
}
