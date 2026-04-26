-- 1. Tabela de histórico de comissão
CREATE TABLE IF NOT EXISTS public.commission_rate_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_type TEXT NOT NULL,
    old_rate NUMERIC,
    new_rate NUMERIC,
    admin_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para histórico
ALTER TABLE public.commission_rate_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view history" ON public.commission_rate_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sellers WHERE user_id = auth.uid() AND store_name = 'Admin' OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_user_meta_data->>'role') = 'admin'))
);

-- 2. Trigger para registrar histórico
CREATE OR REPLACE FUNCTION public.log_commission_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.commission_rate IS DISTINCT FROM NEW.commission_rate) THEN
        INSERT INTO public.commission_rate_history (seller_type, old_rate, new_rate, admin_id)
        VALUES (OLD.seller_type, OLD.commission_rate, NEW.commission_rate, auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_commission_change
AFTER UPDATE ON public.seller_type_settings
FOR EACH ROW EXECUTE FUNCTION public.log_commission_change();

-- 3. Função RPC para recálculo
CREATE OR REPLACE FUNCTION public.recalculate_all_commissions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_seller RECORD;
    v_commission_rate NUMERIC;
    v_net_amount NUMERIC;
    v_commission_amount NUMERIC;
    v_wallet_id UUID;
BEGIN
    -- Resetar saldos das carteiras (serão reconstruídos a partir das transações)
    UPDATE public.seller_wallet SET balance = 0;

    -- Iterar por pedidos pagos
    FOR v_order IN SELECT id FROM public.orders WHERE status = 'paid' LOOP
        FOR v_item IN SELECT * FROM public.order_items WHERE order_id = v_order.id LOOP
            IF v_item.seller_id IS NOT NULL THEN
                -- Buscar taxa atual
                SELECT commission_rate, seller_type INTO v_seller 
                FROM public.sellers WHERE id = v_item.seller_id;
                
                v_commission_rate := v_seller.commission_rate;
                IF v_commission_rate IS NULL THEN
                    SELECT commission_rate INTO v_commission_rate 
                    FROM public.seller_type_settings 
                    WHERE seller_type = v_seller.seller_type;
                END IF;
                IF v_commission_rate IS NULL THEN v_commission_rate := 0.15; END IF;

                v_net_amount := (v_item.price * v_item.quantity) * (1 - v_commission_rate);
                v_commission_amount := (v_item.price * v_item.quantity) * v_commission_rate;

                -- Garantir carteira
                INSERT INTO public.seller_wallet (seller_id) VALUES (v_item.seller_id) ON CONFLICT (seller_id) DO NOTHING;
                SELECT id INTO v_wallet_id FROM public.seller_wallet WHERE seller_id = v_item.seller_id;

                -- Atualizar ou Inserir Transação de Venda
                -- Excluímos as transações de venda antigas deste item/pedido para reinserir as corretas
                DELETE FROM public.wallet_transactions 
                WHERE order_id = v_order.id 
                  AND seller_id = v_item.seller_id 
                  AND type = 'sale' 
                  AND (description LIKE 'Venda do item%' OR description LIKE 'Venda:%');

                INSERT INTO public.wallet_transactions (wallet_id, seller_id, order_id, amount, commission, type, description)
                VALUES (v_wallet_id, v_item.seller_id, v_order.id, v_net_amount, v_commission_amount, 'sale', 'Venda do item: ' || COALESCE(v_item.name, 'Produto'));
            END IF;
        END LOOP;
    END LOOP;

    -- Reconstruir saldo final das carteiras somando TODAS as transações (vendas e saques)
    UPDATE public.seller_wallet w
    SET balance = (
        SELECT COALESCE(SUM(amount), 0)
        FROM public.wallet_transactions t
        WHERE t.wallet_id = w.id
    );
END;
$$;
