-- Fix search_path for handle_updated_at function
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
