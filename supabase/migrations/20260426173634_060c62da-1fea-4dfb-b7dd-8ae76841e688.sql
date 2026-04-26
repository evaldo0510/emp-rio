-- Atualizar função handle_order_item_paid_finance com search_path fixo
ALTER FUNCTION public.handle_order_item_paid_finance() SET search_path = public;

-- Atualizar função sync_order_items_on_payment com search_path fixo
ALTER FUNCTION public.sync_order_items_on_payment() SET search_path = public;
