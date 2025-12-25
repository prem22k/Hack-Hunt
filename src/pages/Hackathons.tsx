import { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Filter, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import FilterPills from "@/components/FilterPills";
import HackathonCard from "@/components/HackathonCard";
import { Button } from "@/components/ui/button";
import { Hackathon, skills } from "@/data/hackathons";

const Hackathons = () => {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/hackathons');
        const data = await response.json();
        setHackathons(data);
      } catch (error) {
        console.error('Error fetching hackathons:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHackathons();
  }, []);

  const modes = ["online", "offline", "hybrid"];
  const types = ["free", "paid"];

  const filteredHackathons = useMemo(() => {
    return hackathons.filter((h) => {
      const matchesSearch =
        search === "" ||
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.organizer.toLowerCase().includes(search.toLowerCase()) ||
        h.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));

      const matchesSkills =
        selectedSkills.length === 0 ||
        selectedSkills.some((skill) =>
          h.skills.map((s) => s.toLowerCase()).includes(skill.toLowerCase())
        );

      const matchesMode =
        selectedMode.length === 0 || selectedMode.includes(h.mode);

      const matchesType =
        selectedType.length === 0 || selectedType.includes(h.type);

      return matchesSearch && matchesSkills && matchesMode && matchesType;
    });
  }, [search, selectedSkills, selectedMode, selectedType]);

  const clearFilters = () => {
    setSelectedSkills([]);
    setSelectedMode([]);
    setSelectedType([]);
    setSearch("");
  };

  const hasActiveFilters =
    selectedSkills.length > 0 ||
    selectedMode.length > 0 ||
    selectedType.length > 0 ||
    search !== "";

  return (
    <>
      <Helmet>
        <title>Browse Hackathons | HackHunt</title>
        <meta
          name="description"
          content="Discover and filter hackathons by skills, mode, and type. Find the perfect hackathon for your interests and skill level."
        />
      </Helmet>

      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navbar />

        <main className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Browse <span className="text-gradient">Hackathons</span>
            </h1>
            <p className="text-muted-foreground">
              Discover {hackathons.length}+ hackathons from around the world
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by name, organizer, or skill..."
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="md:w-auto"
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 w-5 h-5 rounded-full bg-primary-foreground text-primary text-xs flex items-center justify-center">
                  {selectedSkills.length + selectedMode.length + selectedType.length}
                </span>
              )}
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-card rounded-2xl p-6 mb-6 shadow-sm animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Filters</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>

              <div className="space-y-6">
                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Skills
                  </label>
                  <FilterPills
                    options={skills.slice(0, 12)}
                    selected={selectedSkills}
                    onChange={setSelectedSkills}
                  />
                </div>

                {/* Mode */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Mode
                  </label>
                  <FilterPills
                    options={modes.map((m) => m.charAt(0).toUpperCase() + m.slice(1))}
                    selected={selectedMode.map((m) => m.charAt(0).toUpperCase() + m.slice(1))}
                    onChange={(selected) =>
                      setSelectedMode(selected.map((s) => s.toLowerCase()))
                    }
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Entry Type
                  </label>
                  <FilterPills
                    options={types.map((t) => t.charAt(0).toUpperCase() + t.slice(1))}
                    selected={selectedType.map((t) => t.charAt(0).toUpperCase() + t.slice(1))}
                    onChange={(selected) =>
                      setSelectedType(selected.map((s) => s.toLowerCase()))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              Showing {filteredHackathons.length} of {hackathons.length} hackathons
            </p>
          </div>

          {/* Hackathon Grid */}
          {filteredHackathons.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredHackathons.map((hackathon, index) => (
                <HackathonCard
                  key={hackathon.id}
                  hackathon={hackathon}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
                <Filter className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No hackathons found
              </h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search terms
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default Hackathons;
