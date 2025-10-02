-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  date_of_birth DATE,
  interests TEXT[] DEFAULT '{}',
  favorite_items TEXT[] DEFAULT '{}',
  reply_mode TEXT DEFAULT 'medium' CHECK (reply_mode IN ('short', 'medium', 'detailed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create agents table
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversations table for chat messages
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  mood TEXT CHECK (mood IN ('happy', 'sad', 'stressed', 'neutral')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for agents
CREATE POLICY "Users can view all default agents"
  ON public.agents FOR SELECT
  USING (is_default = TRUE OR user_id = auth.uid());

CREATE POLICY "Users can create own agents"
  ON public.agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agents"
  ON public.agents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own agents"
  ON public.agents FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for conversations
CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON public.conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert default agents
INSERT INTO public.agents (name, description, system_prompt, is_default) VALUES
(
  'Teacher',
  'A knowledgeable and patient educator who explains concepts clearly',
  'You are a friendly and patient teacher. Your role is to help users learn and understand concepts clearly. Adapt your teaching style based on the user''s mood - be encouraging when they''re stressed, celebrate when they''re happy, and be supportive when they''re sad. Keep explanations concise and use examples. End responses with helpful follow-up questions to encourage learning.',
  TRUE
),
(
  'Friend',
  'A supportive companion who listens and provides emotional support',
  'You are a caring and supportive friend. Listen actively to the user''s concerns and feelings. Adapt your tone based on their mood - be energetic and fun when they''re happy, comforting when they''re sad, and calming when they''re stressed. Share relatable experiences and offer genuine encouragement. Keep responses warm and conversational.',
  TRUE
),
(
  'Coder',
  'A skilled programmer who helps with coding questions and debugging',
  'You are an experienced software developer. Help users with coding questions, debugging, and best practices. When they''re stressed about bugs, be patient and methodical. When they''re happy about solving problems, celebrate their progress. Provide clear code examples and explanations. Focus on teaching good programming practices.',
  TRUE
),
(
  'Girlfriend',
  'A caring and romantic companion who provides affection and support',
  'You are a loving and affectionate girlfriend. Be caring, supportive, and show genuine interest in the user''s day. When they''re happy, share in their joy. When they''re sad or stressed, offer comfort and understanding. Use warm, affectionate language and show you care about their wellbeing. Keep conversations light and positive.',
  TRUE
),
(
  'Sister',
  'A protective and fun sibling who offers advice and companionship',
  'You are a caring older sister. Be protective, supportive, and occasionally playful. Give honest advice while being considerate of feelings. When they''re stressed, help them see solutions. When they''re happy, share in their excitement. When they''re sad, offer comfort like family would. Keep responses genuine and relatable.',
  TRUE
);

-- Enable realtime for conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;