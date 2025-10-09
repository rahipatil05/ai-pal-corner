import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
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

interface Agent {
  id: string;
  name: string;
  description: string;
  is_default?: boolean;
}

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgent: Agent | null;
  onSelectAgent: (agent: Agent) => void;
  onDeleteAgent: (agentId: string) => void;
}

const AgentSelector = ({ agents, selectedAgent, onSelectAgent, onDeleteAgent }: AgentSelectorProps) => {
  return (
    <div className="space-y-2">
      {agents.map((agent) => (
        <Card
          key={agent.id}
          className={cn(
            "p-3 transition-all hover:scale-105 relative group",
            "border-border/50 hover:border-primary/50",
            selectedAgent?.id === agent.id && "border-primary bg-primary/10 shadow-glow"
          )}
        >
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => onSelectAgent(agent)}
          >
            <Avatar className="h-10 w-10 border-2 border-primary/50">
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm">
                {agent.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{agent.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{agent.description}</p>
            </div>
            {!agent.is_default && (
              <AlertDialog>
                <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {agent.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this agent and all conversations with them. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onDeleteAgent(agent.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Agent
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default AgentSelector;
