import PublicNavbar from "@/components/PublicNavbar";
import LandingHeroSection from "@/components/LandingHeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import StatsRow from "@/components/StatsRow";
import PublicFooter from "@/components/PublicFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <LandingHeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsRow />
      <PublicFooter />
    </div>
  );
};

export default Index;
