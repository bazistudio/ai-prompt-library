import { LandingNavbar } from "@/components/landing/Navbar";
import { LandingHero } from "@/components/landing/Hero";
import { LandingTrustStrip } from "@/components/landing/TrustStrip";
import { LandingWhySection } from "@/components/landing/WhySection";
import { LandingShowcaseSection } from "@/components/landing/ShowcaseSection";
import { LandingFeatureGrid } from "@/components/landing/FeatureGrid";
import { LandingHowItWorks } from "@/components/landing/HowItWorks";
import { LandingPrivacySecuritySection } from "@/components/landing/PrivacySecuritySection";
import { LandingPricingSection } from "@/components/landing/PricingSection";
import { LandingVideoSection } from "@/components/landing/VideoSection";
import { LandingFAQSection } from "@/components/landing/FAQSection";
import { LandingFinalCTA } from "@/components/landing/FinalCTA";
import { LandingFooter } from "@/components/landing/Footer";

export const metadata = {
  title: "AI Prompt Library — Your Private AI Prompt Workspace | Bazi Studio",
  description:
    "An offline-first workspace to organize, create, improve, version, and reuse your AI prompts in a private local environment.",
  openGraph: {
    title: "AI Prompt Library — Your Private AI Prompt Workspace | Bazi Studio",
    description:
      "An offline-first workspace to organize, create, improve, version, and reuse your AI prompts.",
    type: "website",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      <LandingNavbar />
      <main className="flex-grow">
        <LandingHero />
        <LandingTrustStrip />
        <LandingWhySection />
        <LandingShowcaseSection />
        <LandingFeatureGrid />
        <LandingHowItWorks />
        <LandingPrivacySecuritySection />
        <LandingPricingSection />
        <LandingVideoSection />
        <LandingFAQSection />
        <LandingFinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
