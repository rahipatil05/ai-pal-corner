import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  description: string;
}

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgent: Agent | null;
  onSelectAgent: (agent: Agent) => void;
}

const AgentSelector = ({ agents, selectedAgent, onSelectAgent }: AgentSelectorProps) => {
  return (
    <div className="space-y-2">
      {agents.map((agent) => (
        <Card
          key={agent.id}
          className={cn(
            "p-3 cursor-pointer transition-all hover:scale-105",
            "border-border/50 hover:border-primary/50",
            selectedAgent?.id === agent.id && "border-primary bg-primary/10 shadow-glow"
          )}
          onClick={() => onSelectAgent(agent)}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/50">
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm">
                {agent.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{agent.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{agent.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default AgentSelector;
