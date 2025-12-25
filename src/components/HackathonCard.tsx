import { Link } from "react-router-dom";
import { MapPin, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HackathonCardProps {
  hackathon: any; // Using any to handle both frontend mock data and backend API data
  index?: number;
}

const HackathonCard = ({ hackathon, index = 0 }: HackathonCardProps) => {
  if (!hackathon) return null;

  // Normalize data
  const name = hackathon.name || hackathon.title || "Untitled Event";
  const organizer = hackathon.organizer || "Unknown Organizer";
  const location = hackathon.location || "Online";
  const mode = hackathon.mode || "online";
  const type = hackathon.type || (hackathon.isPaid ? "paid" : "free");
  const prize = hackathon.prize || "TBD";
  const participants = hackathon.participants || 0;
  const skills = hackathon.skills || [];
  const id = hackathon._id || hackathon.id;

  // Date handling
  let month = "TBD";
  let day = 0;

  if (hackathon.startDate) {
    const date = new Date(hackathon.startDate);
    month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
    day = date.getDate();
  } else if (hackathon.date) {
    month = hackathon.date.month || "TBD";
    day = hackathon.date.day || 0;
  }

  return (
    <div
      className="group bg-card rounded-2xl overflow-hidden shadow-sm card-hover animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Image/Banner */}
      <div className="relative h-40 bg-gradient-to-br from-secondary to-pink-muted overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl gradient-coral flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
            <Trophy className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>
        
        {/* Date Badge */}
        <div className="absolute top-3 left-3 bg-card rounded-xl p-2 shadow-md text-center min-w-[56px]">
          <span className="block text-xs font-semibold text-primary uppercase">
            {month}
          </span>
          <span className="block text-xl font-bold text-foreground">
            {day > 0 ? day : "?"}
          </span>
        </div>

        {/* Mode Badge */}
        <div className="absolute top-3 right-3 flex gap-2">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-medium",
              mode === "online" && "bg-success/20 text-success",
              mode === "offline" && "bg-info/20 text-info",
              mode === "hybrid" && "bg-warning/20 text-warning"
            )}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {name}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-3">
          by {organizer}
        </p>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="w-4 h-4 text-primary" />
          <span>{location}</span>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{participants > 0 ? `${participants}+` : "Open"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            <span>{prize}</span>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              type === "free"
                ? "border-success text-success"
                : "border-primary text-primary"
            )}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Badge>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {skills.slice(0, 3).map((skill: string) => (
            <Badge
              key={skill}
              variant="secondary"
              className="text-xs bg-secondary text-secondary-foreground"
            >
              {skill}
            </Badge>
          ))}
          {skills.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{skills.length - 3}
            </Badge>
          )}
        </div>

        {/* CTA */}
        <Link to={`/hackathon/${id}`}>
          <Button variant="coral" className="w-full" size="sm">
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default HackathonCard;
