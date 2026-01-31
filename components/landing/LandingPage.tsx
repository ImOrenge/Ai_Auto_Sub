import HeaderSticky from "./HeaderSticky";
import HeroSplit from "./HeroSplit";
import SocialProofStrip from "./SocialProofStrip";
import ProblemSolution from "./ProblemSolution";
import HowItWorksTimeline from "./HowItWorksTimeline";
import FeatureGrid from "./FeatureGrid";
import UseCasesSection from "./UseCasesSection";
import TestimonialsSection from "./TestimonialsSection";
import PricingSection from "./PricingSection";
import FAQAccordion from "./FAQAccordion";
import FinalCTA from "./FinalCTA";
import Footer from "./Footer";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground relative selection:bg-foreground/10">
            {/* Background Grid Pattern */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.03]" />
                <div className="absolute top-0 left-0 right-0 h-[500px] bg-[radial-gradient(circle_800px_at_50%_-100px,#ffffff1a,transparent)] pointer-events-none" />
            </div>

            <div className="relative z-10">
                <HeaderSticky />

                <main>
                    <HeroSplit />
                    <SocialProofStrip />
                    <ProblemSolution />
                    <HowItWorksTimeline />
                    <FeatureGrid />
                    <UseCasesSection />
                    <TestimonialsSection />
                    <PricingSection />
                    <FAQAccordion />
                    <FinalCTA />
                </main>

                <Footer />
            </div>
        </div>
    );
}
