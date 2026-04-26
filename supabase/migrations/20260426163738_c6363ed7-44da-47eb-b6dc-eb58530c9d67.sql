-- Create a table to track admin users
CREATE TABLE IF NOT EXISTS public.app_admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on app_admins
ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;

-- Only admins can see who else is an admin
CREATE POLICY "Admins can view admins" ON public.app_admins
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = auth.uid()));

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure the get_monthly_sales_report function
CREATE OR REPLACE FUNCTION public.get_monthly_sales_report(report_month timestamp with time zone)
RETURNS TABLE(orders_count bigint, total_revenue numeric, status_distribution jsonb, category_distribution jsonb) 
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Protect the 'approved' column in the sellers table
CREATE OR REPLACE FUNCTION public.protect_seller_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- If the user is not an admin, they cannot change the 'approved' or 'verified_at' columns
    IF NOT public.is_admin() THEN
        IF (NEW.approved IS DISTINCT FROM OLD.approved) OR (NEW.verified_at IS DISTINCT FROM OLD.verified_at) THEN
            -- Revert the changes to these columns
            NEW.approved := OLD.approved;
            NEW.verified_at := OLD.verified_at;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_seller_approval ON public.sellers;
CREATE TRIGGER tr_protect_seller_approval
BEFORE UPDATE ON public.sellers
FOR EACH ROW
EXECUTE FUNCTION public.protect_seller_approval();

-- Also ensure that ONLY admins can see unapproved sellers (besides the seller themselves)
DROP POLICY IF EXISTS "Public can view approved sellers" ON public.sellers;
CREATE POLICY "Public can view approved sellers" ON public.sellers
    FOR SELECT USING (approved = true OR auth.uid() = user_id OR public.is_admin());

-- Ensure admins can update any seller (to approve them)
CREATE POLICY "Admins can update any seller" ON public.sellers
    FOR UPDATE USING (public.is_admin());
