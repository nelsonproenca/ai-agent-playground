INSERT INTO public.user_roles (user_id, role)
VALUES ('aaa8454f-88a8-483a-ada9-5d8d1b876d8e', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;