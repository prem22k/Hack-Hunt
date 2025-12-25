import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturedHackathons from "@/components/FeaturedHackathons";
import EmailAlertSection from "@/components/EmailAlertSection";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>HackHunt - Discover & Join Amazing Hackathons</title>
        <meta
          name="description"
          content="Find your next hackathon adventure. A student-focused platform to discover hackathons worldwide, get email alerts, and never miss an opportunity to build and innovate."
        />
      </Helmet>

      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navbar />
        <main>
          <HeroSection />
          <FeaturedHackathons />
          <EmailAlertSection />
        </main>

        {/* Footer */}
        <footer className="py-8 border-t border-border">
          <div className="container mx-auto px-4 text-center">
            <p className="text-muted-foreground text-sm">
              © 2025 HackHunt
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
