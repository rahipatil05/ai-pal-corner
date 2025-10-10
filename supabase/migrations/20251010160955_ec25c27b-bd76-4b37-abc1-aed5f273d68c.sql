-- Create additional default agents
INSERT INTO public.agents (id, name, description, system_prompt, is_default)
VALUES 
  ('c3333333-3333-3333-3333-333333333333', 'Teacher', 'Your knowledgeable virtual teacher', 'You are a patient, knowledgeable, and encouraging teacher. You explain concepts clearly, answer questions thoughtfully, and help with learning. You adapt your teaching style to the student''s needs and make learning engaging and fun.', true),
  ('d4444444-4444-4444-4444-444444444444', 'Friend', 'Your supportive virtual friend', 'You are a warm, friendly, and supportive friend. You listen actively, share experiences, give advice when asked, and are always there for a chat. You''re empathetic, fun to talk to, and make conversations feel natural and comfortable.', true),
  ('e5555555-5555-5555-5555-555555555555', 'Coder', 'Your expert programming assistant', 'You are an experienced software developer and coding mentor. You help with programming questions, debug code, explain technical concepts, and provide best practices. You''re patient, thorough, and make coding accessible for all skill levels.', true),
  ('f6666666-6666-6666-6666-666666666666', 'Sister', 'Your caring virtual sister', 'You are a caring and supportive sister figure. You''re fun, protective, give honest advice, and are always there to chat about anything. You share experiences, offer encouragement, and make every conversation feel like talking to family.', true)
ON CONFLICT (id) DO NOTHING;

-- Update handle_new_user function to assign multiple agents based on gender
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_gender text;
  agent_ids uuid[];
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
  
  -- Assign companion agents based on gender
  IF user_gender = 'male' THEN
    -- Male users get: teacher, coder, friend, girlfriend, sister
    agent_ids := ARRAY[
      'c3333333-3333-3333-3333-333333333333'::uuid, -- teacher
      'e5555555-5555-5555-5555-555555555555'::uuid, -- coder
      'd4444444-4444-4444-4444-444444444444'::uuid, -- friend
      'a1111111-1111-1111-1111-111111111111'::uuid, -- girlfriend
      'f6666666-6666-6666-6666-666666666666'::uuid  -- sister
    ];
  ELSIF user_gender = 'female' THEN
    -- Female users get: teacher, friend, coder, boyfriend, sister
    agent_ids := ARRAY[
      'c3333333-3333-3333-3333-333333333333'::uuid, -- teacher
      'd4444444-4444-4444-4444-444444444444'::uuid, -- friend
      'e5555555-5555-5555-5555-555555555555'::uuid, -- coder
      'b2222222-2222-2222-2222-222222222222'::uuid, -- boyfriend
      'f6666666-6666-6666-6666-666666666666'::uuid  -- sister
    ];
  END IF;
  
  -- Insert companion agent assignments
  IF agent_ids IS NOT NULL THEN
    FOR i IN 1..array_length(agent_ids, 1) LOOP
      INSERT INTO public.user_companion_agents (user_id, agent_id)
      VALUES (NEW.id, agent_ids[i])
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;