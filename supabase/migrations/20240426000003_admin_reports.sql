-- Create a table for categories performance if it doesn't exist
-- This is often a view or a summary table, but we'll use orders and order_items for the report

-- Example of a function to get monthly sales
CREATE OR REPLACE FUNCTION get_monthly_sales_report(report_month DATE)
RETURNS TABLE (
  total_orders BIGINT,
  total_revenue NUMERIC,
  orders_by_status JSONB,
  sales_by_category JSONB
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(o.id) as total_orders,
    COALESCE(SUM(o.total), 0) as total_revenue,
    (
      SELECT jsonb_object_agg(status, count)
      FROM (
        SELECT status, COUNT(*) as count 
        FROM orders 
        WHERE date_trunc('month', created_at) = date_trunc('month', report_month)
        GROUP BY status
      ) s
    ) as orders_by_status,
    (
      SELECT jsonb_object_agg(category, revenue)
      FROM (
        SELECT p.category, SUM(oi.price * oi.quantity) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE date_trunc('month', o.created_at) = date_trunc('month', report_month)
        GROUP BY p.category
      ) c
    ) as sales_by_category
  FROM orders o
  WHERE date_trunc('month', o.created_at) = date_trunc('month', report_month);
END;
$$;
