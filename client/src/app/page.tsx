import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HeroBentoGrid from "@/components/HeroBentoGrid";
import CareWorkflowSection from "@/components/CareWorkflowSection";
import PlatformPersonasSection from "@/components/PlatformPersonasSection";
import ServicesSection from "@/components/ServicesSection";
import DiagnosticsSection from "@/components/DiagnosticsSection";
import ImpactMetricsSection from "@/components/ImpactMetricsSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0F172A] font-sans antialiased selection:bg-[#E5F973] selection:text-slate-950">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 space-y-6 sm:space-y-8">
        <Navbar />
        <HeroSection />
        <HeroBentoGrid />
        <CareWorkflowSection />
        <PlatformPersonasSection />
        <ServicesSection />
        <DiagnosticsSection />
        <ImpactMetricsSection />
        <Footer />
      </div>
    </div>
  );
}
