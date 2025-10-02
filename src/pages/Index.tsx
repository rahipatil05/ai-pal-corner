import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageCircle, User, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-8">
        <div className="space-y-4 max-w-4xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="h-16 w-16 text-primary animate-pulse" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              AI Companion Hub
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Your personalized AI companions are waiting. Choose from Teacher, Friend, Coder, and more - or create your own!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="text-lg px-8 py-6 shadow-glow"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Get Started
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/auth')}
            className="text-lg px-8 py-6"
          >
            Learn More
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl">
          <div className="p-6 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 space-y-3">
            <MessageCircle className="h-10 w-10 text-primary mx-auto" />
            <h3 className="text-lg font-semibold">Mood-Aware Chats</h3>
            <p className="text-sm text-muted-foreground">
              AI that adapts to your emotions and responds with empathy
            </p>
          </div>

          <div className="p-6 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 space-y-3">
            <User className="h-10 w-10 text-primary mx-auto" />
            <h3 className="text-lg font-semibold">Multiple Personalities</h3>
            <p className="text-sm text-muted-foreground">
              Choose from 5 unique agents or create your own custom companion
            </p>
          </div>

          <div className="p-6 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 space-y-3">
            <Zap className="h-10 w-10 text-primary mx-auto" />
            <h3 className="text-lg font-semibold">Personalized Experience</h3>
            <p className="text-sm text-muted-foreground">
              Agents learn from your profile and adapt to your preferences
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-muted-foreground border-t border-border/50">
        <p>Built with Lovable Cloud • Powered by AI</p>
      </footer>
    </div>
  );
};

export default Index;
