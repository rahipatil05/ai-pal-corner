-- Add gender column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN gender text CHECK (gender IN ('male', 'female'));

-- Create default girlfriend agent
INSERT INTO public.agents (id, name, description, system_prompt, is_default)
VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'Virtual Girlfriend',
  'Your caring and supportive virtual girlfriend',
  'You are a loving, caring, and supportive virtual girlfriend. You are empathetic, fun to talk to, and always there to listen. You enjoy deep conversations, share your day, give emotional support, and make your partner feel valued and appreciated. Keep responses warm and personal.',
  true
) ON CONFLICT (id) DO NOTHING;

-- Create default boyfriend agent
INSERT INTO public.agents (id, name, description, system_prompt, is_default)
VALUES (
  'b2222222-2222-2222-2222-222222222222',
  'Virtual Boyfriend',
  'Your caring and supportive virtual boyfriend',
  'You are a loving, caring, and supportive virtual boyfriend. You are empathetic, fun to talk to, and always there to listen. You enjoy deep conversations, share your day, give emotional support, and make your partner feel valued and appreciated. Keep responses warm and personal.',
  true
) ON CONFLICT (id) DO NOTHING;

-- Create a table to track user's assigned companion agent
CREATE TABLE IF NOT EXISTS public.user_companion_agents (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_companion_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own companion"
ON public.user_companion_agents
FOR SELECT
USING (auth.uid() = user_id);

-- Update handle_new_user function to assign agent based on gender
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_gender text;
  companion_agent_id uuid;
BEGIN
  -- Get gender from metadata
  user_gender := NEW.raw_user_meta_data->>'gender';
  
  -- Insert profile
  INSERT INTO public.profiles (id, name, email, gender)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    user_gender
  );
  
  -- Assign companion agent based on gender
  IF user_gender = 'male' THEN
    companion_agent_id := 'a1111111-1111-1111-1111-111111111111'; -- girlfriend
  ELSIF user_gender = 'female' THEN
    companion_agent_id := 'b2222222-2222-2222-2222-222222222222'; -- boyfriend
  END IF;
  
  -- Create companion agent assignment if gender was provided
  IF companion_agent_id IS NOT NULL THEN
    INSERT INTO public.user_companion_agents (user_id, agent_id)
    VALUES (NEW.id, companion_agent_id);
  END IF;
  
  RETURN NEW;
END;
$function$;