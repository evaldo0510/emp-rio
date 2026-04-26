-- Fix search_path for SECURITY DEFINER functions to prevent hijacking
ALTER FUNCTION public.protect_seller_approval() SET search_path = public;
ALTER FUNCTION public.process_withdrawal_approval() SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.get_monthly_sales_report(timestamp with time zone) SET search_path = public;
ALTER FUNCTION public.process_order_commissions() SET search_path = public;
ALTER FUNCTION public.check_seller_approval() SET search_path = public;
