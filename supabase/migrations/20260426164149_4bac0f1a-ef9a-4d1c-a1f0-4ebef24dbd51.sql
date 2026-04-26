-- Fix function search path
CREATE OR REPLACE FUNCTION public.handle_order_payment()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    v_wallet_id UUID;
BEGIN
    IF (NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid')) THEN
        FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
            -- Ensure wallet exists
            INSERT INTO public.seller_wallet (seller_id)
            VALUES (item.seller_id)
            ON CONFLICT (seller_id) DO NOTHING;
            
            SELECT id INTO v_wallet_id FROM public.seller_wallet WHERE seller_id = item.seller_id;
            
            -- Update balance
            UPDATE public.seller_wallet 
            SET balance = balance + item.net_amount,
                updated_at = now()
            WHERE id = v_wallet_id;
            
            -- Record transaction
            INSERT INTO public.wallet_transactions (wallet_id, amount, type, description)
            VALUES (v_wallet_id, item.net_amount, 'sale', 'Venda do item: ' || item.name || ' (Pedido #' || NEW.id || ')');
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix permissive order_items policy
DROP POLICY IF EXISTS "Insert items for orders" ON public.order_items;
CREATE POLICY "Users can insert items for their own orders" 
ON public.order_items 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE id = order_id AND (user_id = auth.uid() OR user_id IS NULL)
    )
);
