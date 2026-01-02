import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Filter } from "lucide-react";

export function HackathonRecommendations({ userId, userSkills = ["React", "TypeScript", "Node.js"] }: { userId: string, userSkills?: string[] }) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filter States
  const [location, setLocation] = useState<string>("");
  const [mode, setMode] = useState<string>("all");
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState(false);

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`);
            const data = await response.json();
            const city = data.city || data.locality;
            if (city) setLocation(city);
        } catch (e) {
            console.log("Could not fetch city name");
        }
      }, (error) => {
        console.error("Error getting location", error);
      });
    }
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (mode && mode !== 'all') filters.mode = mode;
      if (isPaid) filters.isPaid = true;
      if (location) filters.location = location;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/hackathons/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userSkills, 
          userLocation: location, // Still pass for ranking context
          filters // Pass explicit filters
        })
      });
      const data = await res.json();
      setRecommendations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">AI Recommendations</h2>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4 mr-2" /> Filters
            </Button>
        </div>

        {showFilters && (
            <Card className="p-4 bg-muted/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                        <Label>Location</Label>
                        <div className="flex gap-2">
                            <Input 
                                placeholder="City or Country" 
                                value={location} 
                                onChange={(e) => setLocation(e.target.value)} 
                            />
                            <Button variant="ghost" size="icon" onClick={detectLocation} title="Use my location">
                                <MapPin className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Mode</Label>
                        <Select value={mode} onValueChange={setMode}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any Mode</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="offline">In-Person</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2 pb-2">
                        <Checkbox 
                            id="paid" 
                            checked={isPaid}
                            onCheckedChange={(checked) => setIsPaid(checked as boolean)}
                        />
                        <Label htmlFor="paid">Paid / Prizes Only</Label>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button onClick={fetchRecommendations} disabled={loading}>
                        {loading ? "Analyzing..." : "Apply & Recommend"}
                    </Button>
                </div>
            </Card>
        )}
        
        {!showFilters && (
             <div className="flex justify-end">
                <Button onClick={fetchRecommendations} disabled={loading}>
                    {loading ? "Analyzing..." : "Get Matches"}
                </Button>
             </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.length === 0 && !loading && (
            <div className="col-span-3 text-center py-8 text-muted-foreground">
                No recommendations found. Try adjusting your filters.
            </div>
        )}
        {recommendations.map((rec: any, idx) => (
          <Card key={idx} className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">{rec.hackathonTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-center gap-2">
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">
                  {rec.matchScore}% Match
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{rec.reason}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
