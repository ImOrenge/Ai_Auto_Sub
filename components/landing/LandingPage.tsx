import HeaderSticky from "./HeaderSticky";
import HeroSplit from "./HeroSplit";
import SocialProofStrip from "./SocialProofStrip";
import ProblemSolution from "./ProblemSolution";
import HowItWorksTimeline from "./HowItWorksTimeline";
import FeatureGrid from "./FeatureGrid";
import PricingSection from "./PricingSection";
import FAQAccordion from "./FAQAccordion";
import FinalCTA from "./FinalCTA";
import Footer from "./Footer";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50">
            <HeaderSticky />

            <main>
                <HeroSplit />
                <SocialProofStrip />
                <ProblemSolution />
                <HowItWorksTimeline />
                <FeatureGrid />
                <PricingSection />
                <FAQAccordion />
                <FinalCTA />
            </main>

            <Footer />
        </div>
    );
}
