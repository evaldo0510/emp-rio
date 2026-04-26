-- Remove the overly permissive update policy on orders
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

-- Ensure RLS is enabled (it already is, but good practice)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can still view their own orders
-- Users can still insert their own orders

-- If we want to allow users to update their orders but NOT the status, 
-- we would need a more complex policy or a trigger. 
-- Since the frontend doesn't use it, we'll keep it disabled for now.
