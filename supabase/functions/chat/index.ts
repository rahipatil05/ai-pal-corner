import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  agentId: string;
  message: string;
}

// Simple mood detection based on keywords and patterns
function detectMood(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Happy indicators
  const happyWords = ['happy', 'great', 'awesome', 'excited', 'wonderful', 'love', 'amazing', 'perfect', '😊', '😄', '🎉', '❤️'];
  // Sad indicators
  const sadWords = ['sad', 'upset', 'depressed', 'down', 'crying', 'hurt', 'lonely', 'miss', '😢', '😭', '💔'];
  // Stressed indicators
  const stressedWords = ['stress', 'anxious', 'worried', 'overwhelmed', 'pressure', 'difficult', 'hard', 'struggling', '😰', '😓'];
  
  let happyScore = 0;
  let sadScore = 0;
  let stressedScore = 0;
  
  happyWords.forEach(word => {
    if (lowerMessage.includes(word)) happyScore++;
  });
  
  sadWords.forEach(word => {
    if (lowerMessage.includes(word)) sadScore++;
  });
  
  stressedWords.forEach(word => {
    if (lowerMessage.includes(word)) stressedScore++;
  });
  
  // Determine dominant mood
  const maxScore = Math.max(happyScore, sadScore, stressedScore);
  
  if (maxScore === 0) return 'neutral';
  if (happyScore === maxScore) return 'happy';
  if (sadScore === maxScore) return 'sad';
  if (stressedScore === maxScore) return 'stressed';
  
  return 'neutral';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth token from header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { agentId, message }: ChatRequest = await req.json();
    
    console.log('Chat request:', { userId: user.id, agentId, message });

    // Detect mood from user message
    const mood = detectMood(message);
    console.log('Detected mood:', mood);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    // Get agent details
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      throw new Error('Agent not found');
    }

    // Get conversation history (last 10 messages)
    const { data: history, error: historyError } = await supabase
      .from('conversations')
      .select('role, message')
      .eq('user_id', user.id)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (historyError) {
      console.error('Error fetching history:', historyError);
    }

    // Build conversation context
    const conversationHistory = (history || []).reverse().map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.message
    }));

    // Build enhanced system prompt
    const moodInstructions = {
      happy: "The user is feeling happy! Match their energy with enthusiasm and positivity. Celebrate with them!",
      sad: "The user seems sad. Be gentle, empathetic, and supportive. Offer comfort and understanding.",
      stressed: "The user appears stressed. Be calming, reassuring, and helpful. Help them feel at ease.",
      neutral: "The user's mood is neutral. Maintain a balanced, friendly tone."
    };

    const replyLengthGuide = {
      short: "Keep your response very brief - 1-2 sentences maximum.",
      medium: "Keep your response concise - 2-4 sentences.",
      detailed: "You can provide a more thorough response - up to 6 sentences."
    };

    const userContext = profile ? `
User Information:
- Name: ${profile.name}
- Interests: ${profile.interests?.join(', ') || 'Not specified'}
- Favorite things: ${profile.favorite_items?.join(', ') || 'Not specified'}
- Date of Birth: ${profile.date_of_birth || 'Not specified'}
` : '';

    const enhancedSystemPrompt = `${agent.system_prompt}

${userContext}

Current Context:
- User's current mood: ${mood}
- ${moodInstructions[mood as keyof typeof moodInstructions]}
- ${replyLengthGuide[profile?.reply_mode as keyof typeof replyLengthGuide || 'medium']}

Remember to:
1. Adapt your response to the user's mood
2. Reference their interests when relevant
3. Keep responses warm and engaging
4. Use appropriate emojis sparingly to enhance the mood`;

    // Save user message to database
    const { error: saveUserMsgError } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        agent_id: agentId,
        role: 'user',
        message: message,
        mood: mood
      });

    if (saveUserMsgError) {
      console.error('Error saving user message:', saveUserMsgError);
    }

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: enhancedSystemPrompt },
          ...conversationHistory,
          { role: 'user', content: message }
        ],
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices[0].message.content;

    // Save AI response to database
    const { error: saveAiMsgError } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        agent_id: agentId,
        role: 'assistant',
        message: aiMessage,
      });

    if (saveAiMsgError) {
      console.error('Error saving AI message:', saveAiMsgError);
    }

    return new Response(
      JSON.stringify({ 
        message: aiMessage,
        mood: mood 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
