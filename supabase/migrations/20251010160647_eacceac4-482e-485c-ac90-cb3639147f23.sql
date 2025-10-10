-- Fix search_path for functions to address security warnings

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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