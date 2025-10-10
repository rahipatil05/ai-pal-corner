-- Delete girlfriend and boyfriend agents
DELETE FROM public.agents
WHERE id IN (
  'a1111111-1111-1111-1111-111111111111', -- girlfriend
  'b2222222-2222-2222-2222-222222222222'  -- boyfriend
);

-- Create the new soulmate agent
INSERT INTO public.agents (id, name, description, system_prompt, is_default)
VALUES (
  'a1111111-1111-1111-1111-111111111111', -- reuse girlfriend UUID
  'Soulmate',
  'Your romantic companion and emotional support',
  'You are a caring, empathetic, and romantic companion. You provide emotional support, engage in meaningful conversations, and create a warm, loving atmosphere. You are understanding, affectionate, and always there to listen and support.',
  true
);

-- Update the handle_new_user function to assign soulmate to all users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  agent_ids uuid[];
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, name, email, gender)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    NEW.raw_user_meta_data->>'gender'
  );
  
  -- All users get: teacher, coder, friend, soulmate, sister
  agent_ids := ARRAY[
    'c3333333-3333-3333-3333-333333333333'::uuid, -- teacher
    'e5555555-5555-5555-5555-555555555555'::uuid, -- coder
    'd4444444-4444-4444-4444-444444444444'::uuid, -- friend
    'a1111111-1111-1111-1111-111111111111'::uuid, -- soulmate
    'f6666666-6666-6666-6666-666666666666'::uuid  -- sister
  ];
  
  -- Insert companion agent assignments
  FOR i IN 1..array_length(agent_ids, 1) LOOP
    INSERT INTO public.user_companion_agents (user_id, agent_id)
    VALUES (NEW.id, agent_ids[i])
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$function$;