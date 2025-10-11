import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";
import { useMouseGlow } from "@/hooks/use-mouse-glow";

interface Message {
  id: string;
  role: string;
  message: string;
  mood?: string;
  created_at: string;
}

interface ChatMessageProps {
  message: Message;
  agentName: string;
}

const moodEmojis: Record<string, string> = {
  happy: '😊',
  sad: '😔',
  stressed: '😰',
  neutral: '😐',
};

const moodColors: Record<string, string> = {
  happy: 'border-l-mood-happy',
  sad: 'border-l-mood-sad',
  stressed: 'border-l-mood-stressed',
  neutral: 'border-l-mood-neutral',
};

const ChatMessage = ({ message, agentName }: ChatMessageProps) => {
  const isUser = message.role === 'user';
  const glowRef = useMouseGlow<HTMLDivElement>();
  
  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <Avatar className={cn(
        "h-10 w-10 border-2",
        isUser ? "border-secondary" : "border-primary"
      )}>
        <AvatarFallback className={cn(
          isUser ? "bg-gradient-secondary" : "bg-gradient-primary",
          "text-primary-foreground"
        )}>
          {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </AvatarFallback>
      </Avatar>

      <Card ref={glowRef as any} className={cn(
        "max-w-[70%] p-4 border-l-4 mouse-glow",
        isUser ? "bg-card/80" : "bg-card/95",
        message.mood ? moodColors[message.mood] : "border-l-border"
      )}>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs font-semibold text-muted-foreground">
            {isUser ? 'You' : agentName}
          </p>
          {message.mood && (
            <span className="text-xs">
              {moodEmojis[message.mood] || ''}
            </span>
          )}
        </div>
        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
        <p className="text-xs text-muted-foreground mt-2">
          {new Date(message.created_at).toLocaleTimeString()}
        </p>
      </Card>
    </div>
  );
};

export default ChatMessage;
