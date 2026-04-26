-- 1. Reforçar a função recalculate_all_commissions com check de admin
CREATE OR REPLACE FUNCTION public.recalculate_all_commissions()
RETURNS void AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_seller RECORD;
    v_commission_rate NUMERIC;
    v_net_amount NUMERIC;
    v_commission_amount NUMERIC;
    v_wallet_id UUID;
BEGIN
    -- Verificação de segurança: Apenas admins podem rodar o recálculo
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Somente administradores podem recalcular comissões.';
    END IF;

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

    -- Reconstruir saldo final das carteiras
    UPDATE public.seller_wallet w
    SET balance = (
        SELECT COALESCE(SUM(amount), 0)
        FROM public.wallet_transactions t
        WHERE t.wallet_id = w.id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Corrigir políticas de commission_rate_history
DROP POLICY IF EXISTS "Admins can view history" ON public.commission_rate_history;
CREATE POLICY "Admins can view commission history" 
ON public.commission_rate_history 
FOR SELECT 
USING (public.is_admin());

-- 3. Políticas para seller_type_settings
DROP POLICY IF EXISTS "Everyone can read seller type settings" ON public.seller_type_settings;
CREATE POLICY "Everyone can view seller type settings" 
ON public.seller_type_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage seller type settings" 
ON public.seller_type_settings 
FOR ALL 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- 4. Consolidação de políticas para sellers
-- Remover duplicatas e reforçar
DROP POLICY IF EXISTS "Admins manage all sellers" ON public.sellers;
DROP POLICY IF EXISTS "Admins can update all sellers" ON public.sellers;
DROP POLICY IF EXISTS "Admins can update any seller" ON public.sellers;
DROP POLICY IF EXISTS "Public can view approved sellers" ON public.sellers;
DROP POLICY IF EXISTS "Anyone can view approved sellers" ON public.sellers;

CREATE POLICY "Admins manage all sellers" 
ON public.sellers 
FOR ALL 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

CREATE POLICY "Anyone can view approved sellers" 
ON public.sellers 
FOR SELECT 
USING (approved = true OR auth.uid() = user_id OR public.is_admin());

-- 5. Atualizar check_seller_approval para verificar ambos IDs
CREATE OR REPLACE FUNCTION public.check_seller_approval()
RETURNS TRIGGER AS $$
BEGIN
   -- Bloqueia publicação se o vendedor não estiver aprovado (para seller_id ou vendor_id)
   IF (NEW.seller_id IS NOT NULL AND NOT EXISTS (
     SELECT 1 FROM public.sellers WHERE user_id = NEW.seller_id AND approved = true
   )) OR (NEW.vendor_id IS NOT NULL AND NOT EXISTS (
     SELECT 1 FROM public.sellers WHERE user_id = NEW.vendor_id AND approved = true
   )) THEN
     NEW.is_published := false;
   END IF;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
