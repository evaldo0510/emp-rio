-- Drop the conflicting functions first
DROP FUNCTION IF EXISTS public.get_monthly_sales_report(date);
DROP FUNCTION IF EXISTS public.get_monthly_sales_report(timestamp with time zone);

-- Re-create the function with a single signature, fixed search_path, and correct column names
CREATE OR REPLACE FUNCTION public.get_monthly_sales_report(report_month timestamp with time zone)
RETURNS TABLE(total_orders bigint, total_revenue numeric, sales_by_status jsonb, sales_by_category jsonb) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only allow admins to run this report
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Apenas administradores podem visualizar relatórios globais.';
    END IF;

    RETURN QUERY
    SELECT 
        COUNT(o.id),
        COALESCE(SUM(o.total), 0),
        (SELECT jsonb_object_agg(status, count) FROM (
            SELECT status, COUNT(*) as count FROM public.orders 
            WHERE date_trunc('month', created_at) = date_trunc('month', report_month) GROUP BY status
        ) s),
        (SELECT jsonb_object_agg(category, revenue) FROM (
            SELECT p.category, SUM(oi.price * oi.quantity) as revenue
            FROM public.order_items oi
            JOIN public.products p ON oi.product_id = p.id
            JOIN public.orders o2 ON oi.order_id = o2.id
            WHERE date_trunc('month', o2.created_at) = date_trunc('month', report_month)
            GROUP BY p.category
        ) c)
    FROM public.orders o
    WHERE date_trunc('month', o.created_at) = date_trunc('month', report_month);
END;
$$;

-- Fix search_path for other functions
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.protect_seller_approval() SET search_path = public;
