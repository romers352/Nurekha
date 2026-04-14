import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ChannelBar from "@/components/landing/ChannelBar";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import HowItWorks from "@/components/landing/HowItWorks";
import BusinessTypes from "@/components/landing/BusinessTypes";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" data-testid="landing-page">
      <Navbar />
      <main className="pt-16">
        <HeroSection />
        <ChannelBar />
        <FeaturesGrid />
        <HowItWorks />
        <BusinessTypes />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
