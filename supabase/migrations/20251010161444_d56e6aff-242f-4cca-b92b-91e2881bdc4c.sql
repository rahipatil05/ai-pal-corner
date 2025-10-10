-- Delete all agents except the 5 core default agents
DELETE FROM public.agents
WHERE id NOT IN (
  'c3333333-3333-3333-3333-333333333333', -- teacher
  'e5555555-5555-5555-5555-555555555555', -- coder
  'd4444444-4444-4444-4444-444444444444', -- friend
  'a1111111-1111-1111-1111-111111111111', -- girlfriend
  'b2222222-2222-2222-2222-222222222222', -- boyfriend
  'f6666666-6666-6666-6666-666666666666'  -- sister
);