import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import HackathonCard from "./HackathonCard";
import { Hackathon } from "@/data/hackathons";

const FeaturedHackathons = () => {
  const [featured, setFeatured] = useState<Hackathon[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_URL}/api/hackathons`);
        if (!response.ok) {
           throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setFeatured(data.slice(0, 4));
      } catch (error) {
        console.error('Error fetching hackathons:', error);
        setError("Failed to load featured hackathons.");
      }
    };

    fetchHackathons();
  }, []);

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wide">
                Featured Events
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Trending <span className="text-gradient">Hackathons</span>
            </h2>
          </div>

          <Link to="/hackathons" className="mt-4 md:mt-0">
            <Button variant="outline" className="group">
              View All
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Hackathon Grid */}
        {error ? (
          <div className="text-center py-8 text-muted-foreground">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((hackathon: any, index) => (
              <HackathonCard 
                key={hackathon._id || hackathon.id || index} 
                hackathon={hackathon} 
                index={index} 
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedHackathons;
