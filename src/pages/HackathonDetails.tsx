import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Trophy,
  ExternalLink,
  Clock,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { Hackathon } from "@/data/hackathons";
import { cn } from "@/lib/utils";

const HackathonDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHackathon = async () => {
      try {
        // Try to fetch by ID (which might be the MongoDB _id or the custom id)
        // Since we seeded with custom IDs, but MongoDB generates _id, we might need to handle both.
        // However, the seed script didn't preserve the "id" field explicitly as _id.
        // The seed script used `Hackathon.insertMany(hackathons)`.
        // The `hackathons` array in seed.js didn't have `id` field (I removed it in my thought process but let's check seed.js content I wrote).
        // Wait, I copied the array WITHOUT `id` field in `seed.js`?
        // Let's check `seed.js` content again.
        const response = await fetch(`http://localhost:5000/api/hackathons/${id}`);
        if (response.ok) {
          const data = await response.json();
          setHackathon(data);
        }
      } catch (error) {
        console.error('Error fetching hackathon:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchHackathon();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Hackathon not found
          </h1>
          <Link to="/hackathons">
            <Button variant="coral">Browse Hackathons</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{hackathon.name} | HackHunt</title>
        <meta name="description" content={hackathon.description} />
      </Helmet>

      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navbar />

        <main className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Link
            to="/hackathons"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Hackathons</span>
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <div className="bg-card rounded-2xl overflow-hidden shadow-sm animate-fade-in">
                {/* Banner */}
                <div className="h-48 md:h-64 bg-gradient-to-br from-secondary to-pink-muted flex items-center justify-center relative">
                  <div className="w-24 h-24 rounded-3xl gradient-coral flex items-center justify-center shadow-glow">
                    <Trophy className="w-12 h-12 text-primary-foreground" />
                  </div>

                  {/* Badges */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Badge
                      className={cn(
                        "text-sm font-medium",
                        hackathon.mode === "online" && "bg-success/20 text-success",
                        hackathon.mode === "offline" && "bg-info/20 text-info",
                        hackathon.mode === "hybrid" && "bg-warning/20 text-warning"
                      )}
                    >
                      {hackathon.mode.charAt(0).toUpperCase() + hackathon.mode.slice(1)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-sm",
                        hackathon.type === "free"
                          ? "border-success text-success"
                          : "border-primary text-primary"
                      )}
                    >
                      {hackathon.type.charAt(0).toUpperCase() + hackathon.type.slice(1)}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                    {hackathon.name}
                  </h1>
                  <p className="text-muted-foreground mb-4">
                    Organized by{" "}
                    <span className="text-foreground font-medium">
                      {hackathon.organizer}
                    </span>
                  </p>

                  {/* Quick Info */}
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{hackathon.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>
                        {hackathon.date.month} {hackathon.date.day}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4 text-primary" />
                      <span>{hackathon.participants}+ participants</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Trophy className="w-4 h-4 text-warning" />
                      <span>{hackathon.prize} in prizes</span>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-2">
                    {hackathon.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  About This Hackathon
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {hackathon.longDescription}
                </p>
              </div>

              {/* Eligibility */}
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Eligibility
                </h2>
                <ul className="space-y-3">
                  {hackathon.eligibility.map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Register Card */}
              <div className="bg-card rounded-2xl p-6 shadow-sm sticky top-24">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {hackathon.prize}
                  </div>
                  <p className="text-muted-foreground text-sm">in prizes</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Registration</span>
                    <span className="font-medium text-foreground">
                      {hackathon.type === "free" ? "Free" : "Paid Entry"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Deadline</span>
                    <span className="font-medium text-foreground">
                      {hackathon.deadline}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-muted-foreground">Participants</span>
                    <span className="font-medium text-foreground">
                      {hackathon.participants}+
                    </span>
                  </div>
                </div>

                <a
                  href={hackathon.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="coral" size="lg" className="w-full mb-3">
                    <ExternalLink className="w-5 h-5" />
                    Register Now
                  </Button>
                </a>

                <p className="text-xs text-muted-foreground text-center">
                  You'll be redirected to the official registration page
                </p>
              </div>

              {/* Important Dates */}
              <div className="bg-card rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Important Dates
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary uppercase">
                        {hackathon.date.month}
                      </span>
                      <span className="text-lg font-bold text-foreground">
                        {hackathon.date.day}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Event Start</p>
                      <p className="text-sm text-muted-foreground">
                        {hackathon.date.start}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-destructive/10 flex flex-col items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Registration Deadline</p>
                      <p className="text-sm text-muted-foreground">
                        {hackathon.deadline}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coming Soon */}
              <div className="bg-secondary/50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">Coming Soon</span>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Team matching feature</li>
                  <li>• Direct messaging with organizers</li>
                  <li>• Project submission portal</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default HackathonDetails;
