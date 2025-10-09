import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Send, Sparkles, User, LogOut, Settings, Plus, Trash2 } from "lucide-react";
import AgentSelector from "@/components/AgentSelector";
import ChatMessage from "@/components/ChatMessage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Message {
  id: string;
  role: string;
  message: string;
  mood?: string;
  created_at: string;
  agent_id: string;
  user_id: string;
}

interface Agent {
  id: string;
  name: string;
  description: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (selectedAgent && user) {
      loadMessages();
    }
  }, [selectedAgent, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!selectedAgent || !user) return;

    // Subscribe to realtime updates for this conversation
    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (newMessage.agent_id === selectedAgent.id) {
            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedAgent, user]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    setUser(session.user);
    loadAgents();
  };

  const loadAgents = async () => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at');

    if (error) {
      console.error('Error loading agents:', error);
      toast.error("Failed to load agents");
      return;
    }

    setAgents(data || []);
    if (data && data.length > 0) {
      setSelectedAgent(data[0]);
    }
  };

  const loadMessages = async () => {
    if (!selectedAgent || !user) return;

    setLoadingMessages(true);
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('agent_id', selectedAgent.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      toast.error("Failed to load messages");
    } else {
      setMessages(data || []);
    }
    setLoadingMessages(false);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedAgent || !user) return;

    const userMessage = inputMessage;
    setInputMessage("");
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('chat', {
        body: {
          agentId: selectedAgent.id,
          message: userMessage,
        },
      });

      if (response.error) throw response.error;

      // Messages will be added via realtime subscription
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChats = async () => {
    if (!selectedAgent || !user) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', user.id)
        .eq('agent_id', selectedAgent.id);

      if (error) throw error;

      setMessages([]);
      toast.success("Chat history cleared successfully");
    } catch (error: any) {
      console.error('Error clearing chats:', error);
      toast.error(error.message || "Failed to clear chat history");
    }
  };

  const deleteAgent = async (agentId: string) => {
    try {
      // Delete all conversations with this agent
      const { error: convError } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', user.id)
        .eq('agent_id', agentId);

      if (convError) throw convError;

      // Delete the agent
      const { error: agentError } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId)
        .eq('user_id', user.id);

      if (agentError) throw agentError;

      // Update UI
      setAgents(prev => prev.filter(a => a.id !== agentId));
      if (selectedAgent?.id === agentId) {
        const remainingAgents = agents.filter(a => a.id !== agentId);
        setSelectedAgent(remainingAgents[0] || null);
      }

      toast.success("Agent deleted successfully");
    } catch (error: any) {
      console.error('Error deleting agent:', error);
      toast.error(error.message || "Failed to delete agent");
    }
  };

  return (
    <div className="flex h-screen bg-gradient-hero">
      {/* Sidebar */}
      <div className="w-80 border-r border-border/50 bg-card/95 backdrop-blur-sm flex flex-col">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AI Companions
            </h1>
          </div>
          
          <AgentSelector
            agents={agents}
            selectedAgent={selectedAgent}
            onSelectAgent={setSelectedAgent}
            onDeleteAgent={deleteAgent}
          />
        </div>

        <div className="flex-1" />

        <div className="p-4 border-t border-border/50 space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate('/profile')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Profile Settings
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate('/create-agent')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Agent
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        {selectedAgent && (
          <div className="p-6 border-b border-border/50 bg-card/95 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary">
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                    {selectedAgent.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{selectedAgent.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedAgent.description}</p>
                </div>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all messages with {selectedAgent.name}. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearChats} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Clear Chat
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <Sparkles className="h-16 w-16 text-primary/50" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Start a conversation</h3>
                <p className="text-muted-foreground">
                  Say hello to {selectedAgent?.name}! They're here to help.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  agentName={selectedAgent?.name || 'AI'}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-6 border-t border-border/50 bg-card/95 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto flex gap-3">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={loading || !selectedAgent}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !inputMessage.trim() || !selectedAgent}
              size="icon"
              className="h-10 w-10"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
