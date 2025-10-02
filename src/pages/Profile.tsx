import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    date_of_birth: '',
    interests: '',
    favorite_items: '',
    reply_mode: 'medium'
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
      return;
    }

    if (data) {
      setProfile({
        name: data.name || '',
        email: data.email || '',
        date_of_birth: data.date_of_birth || '',
        interests: data.interests?.join(', ') || '',
        favorite_items: data.favorite_items?.join(', ') || '',
        reply_mode: data.reply_mode || 'medium'
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          date_of_birth: profile.date_of_birth || null,
          interests: profile.interests ? profile.interests.split(',').map(i => i.trim()) : [],
          favorite_items: profile.favorite_items ? profile.favorite_items.split(',').map(i => i.trim()) : [],
          reply_mode: profile.reply_mode
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/chat')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Chat
        </Button>

        <Card className="border-border/50 shadow-card backdrop-blur-sm bg-card/95">
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Personalize your AI companion experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={profile.date_of_birth}
                  onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interests">Interests</Label>
                <Input
                  id="interests"
                  value={profile.interests}
                  onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
                  placeholder="e.g., music, coding, gaming (comma-separated)"
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple interests with commas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="favorites">Favorite Things</Label>
                <Input
                  id="favorites"
                  value={profile.favorite_items}
                  onChange={(e) => setProfile({ ...profile, favorite_items: e.target.value })}
                  placeholder="e.g., pizza, movies, books (comma-separated)"
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple items with commas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reply_mode">Reply Length Preference</Label>
                <Select
                  value={profile.reply_mode}
                  onValueChange={(value) => setProfile({ ...profile, reply_mode: value })}
                >
                  <SelectTrigger id="reply_mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (1-2 sentences)</SelectItem>
                    <SelectItem value="medium">Medium (2-4 sentences)</SelectItem>
                    <SelectItem value="detailed">Detailed (4-6 sentences)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
