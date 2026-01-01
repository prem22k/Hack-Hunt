import { useState } from 'react';
import { Sparkles, Loader2, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Recommendation {
  hackathonTitle: string;
  matchScore: number; // 0-100
  reason: string;
}

const AIRecommendations = () => {
  const [skills, setSkills] = useState('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleGetRecommendations = async () => {
    if (!skills.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/hackathons/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userSkills: skills.split(',').map(s => s.trim()).filter(s => s.length > 0)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      setRecommendations(data);
    } catch (err) {
      console.error(err);
      setError('Failed to generate recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-8 mb-8 bg-secondary/30 rounded-2xl border border-border/50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
            <BrainCircuit className="w-6 h-6 text-primary mr-2" />
            <span className="text-primary font-semibold">AI-Powered Discovery</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Find Your Perfect Hackathon Match</h2>
          <p className="text-muted-foreground">
            Enter your skills and let our AI analyze hundreds of events to find the ones where you'll shine.
          </p>
        </div>

        <div className="max-w-xl mx-auto mb-10">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Python, React, Machine Learning..."
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="h-12 text-lg bg-background"
              onKeyDown={(e) => e.key === 'Enter' && handleGetRecommendations()}
            />
            <Button 
              size="lg" 
              onClick={handleGetRecommendations} 
              disabled={loading || !skills.trim()}
              className="h-12 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="text-center text-destructive mb-8 bg-destructive/10 p-4 rounded-lg max-w-xl mx-auto">
            {error}
          </div>
        )}

        {searched && !loading && recommendations.length === 0 && !error && (
          <div className="text-center text-muted-foreground mb-8">
            No recommendations found. Try adding more specific skills.
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {recommendations.map((rec, index) => (
              <Card key={index} className="border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group bg-card">
                <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                      #{index + 1} Top Match
                    </Badge>
                    <span className="text-xl font-bold text-primary">{rec.matchScore}%</span>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-1">
                    {rec.hackathonTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Match Confidence</span>
                    </div>
                    <Progress value={rec.matchScore} className="h-1.5" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed bg-secondary/50 p-3 rounded-md border border-border/50">
                    <Sparkles className="w-3 h-3 inline mr-1 text-yellow-500" />
                    {rec.reason}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AIRecommendations;
