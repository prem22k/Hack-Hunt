import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturedHackathons from "@/components/FeaturedHackathons";
import { HackathonRecommendations } from "@/components/HackathonRecommendations";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { currentUser } = useAuth();

  return (
    <>
      <Helmet>
        <title>HackHunt - Discover & Join Amazing Hackathons</title>
        <meta
          name="description"
          content="Find your next hackathon adventure. A student-focused platform to discover hackathons worldwide."
        />
      </Helmet>

      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navbar />
        <main>
          <HeroSection />
          
          <FeaturedHackathons />
          
          {/* Replaced EmailAlertSection with AI Recommendations */}
          <section className="py-16 bg-secondary/20 border-t border-border/50">
            <div className="container mx-auto px-4">
              <div className="mb-10 text-center max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold mb-4">AI-Powered Recommendations</h2>
                <p className="text-muted-foreground">
                  Get personalized hackathon suggestions based on your skills and location.
                </p>
              </div>
              <HackathonRecommendations 
                userId={currentUser?.uid || "guest"} 
                userSkills={["React", "Node.js", "Python"]} // Default skills for guest context
              />
            </div>
          </section>
        </main>

        <footer className="py-8 border-t border-border bg-card">
          <div className="container mx-auto px-4 text-center">
            <p className="text-muted-foreground text-sm">
              © 2025 HackHunt. Built for builders.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
